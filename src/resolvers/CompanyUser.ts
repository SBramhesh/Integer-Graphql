import {
  Resolver,
  Mutation,
  Arg,
  Field,
  Ctx,
  ObjectType,
  Query,
  FieldResolver,
  Root,
  Int,
} from "type-graphql";
import { MyContext } from "../types";
import {
  CompanyUser,
  CompanyUserRole,
  TelMarket,
} from "../entities/CompanyUser";
import * as argon2 from "argon2";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { CompanyUsernamePasswordInput } from "./CompanyUsernamePasswordInput";
import { validateCompanyRegister } from "../utils/validateCompanyRegister";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";
import { getConnection } from "typeorm";
import { Role } from "../entities/Role";

@ObjectType()
class CFieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class CompanyUserResponse {
  @Field(() => [CFieldError], { nullable: true })
  errors?: CFieldError[];

  @Field(() => CompanyUser, { nullable: true })
  user?: CompanyUser;
}

@Resolver(CompanyUser)
export class CompanyUserResolver {
  @FieldResolver(() => [CompanyUser])
  cmUsers(@Root() user: CompanyUser) {
    return CompanyUser.find({
      where: { role: CompanyUserRole.CONSTRUCTION_MANAGER },
    });
  }

  @FieldResolver(() => [CompanyUser])
  pmUsers(@Root() user: CompanyUser) {
    return CompanyUser.find({
      where: { role: CompanyUserRole.PROJECT_MANANGER },
    });
  }

  @FieldResolver(() => String)
  cemail(@Root() user: CompanyUser, @Ctx() { req }: MyContext) {
    // this is the current user and its ok to show them their own email
    if (req.session.userId === user.id) {
      return user.email;
    }
    // current user wants to see someone elses email
    return "";
  }

  // This muations sets whether the user is diabled or active
  @Mutation(() => Boolean)
  //@UseMiddleware(isAuth)
  async uservote(
    @Arg("userId", () => Int) userId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const isAlive = value !== 0;
    const realValue = isAlive ? 1 : 0;
    //const { yooserId } = req.session;

    const user = await CompanyUser.findOne({ where: { id: userId } });

    // if user has a different status than desired
    if (user && user.status !== realValue) {
      await getConnection().transaction(async (tm) => {
        await tm.query(
                  `
            update company_user
            set status = $1
            where id = $2
                `,
          [realValue, userId]
        );

        
      });
    } else if (!user) {
      // no user
      
    }
    return true;
  }

  @Mutation(() => CompanyUserResponse)
  async cchangePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis, req }: MyContext
  ): Promise<CompanyUserResponse> {
    if (newPassword.length <= 2) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "length must be greater than 2",
          },
        ],
      };
    }

    const key = FORGET_PASSWORD_PREFIX + token;
    const userId = await redis.get(key);
    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "token expired",
          },
        ],
      };
    }

    const userIdNum = parseInt(userId);
    const user = await CompanyUser.findOne(userIdNum);

    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "user no longer exists",
          },
        ],
      };
    }

    await CompanyUser.update(
      { id: userIdNum },
      {
        password: await argon2.hash(newPassword),
      }
    );

    await redis.del(key);

    // log in user after change password
    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => Boolean)
  async cforgotPassword(
    @Arg("email") email: string,
    @Ctx() { redis }: MyContext
  ) {
    const user = await CompanyUser.findOne({ where: { email } });

    console.log(`inside of forgot password with user: ${user}`);
    if (!user) {
      // the email is not in the db
      return true;
    }

    const token = v4();

    await redis.set(
      FORGET_PASSWORD_PREFIX + token,
      user.id,
      "ex",
      1000 * 60 * 60 * 24 * 3
    ); // 3 days

    console.log(
      `Forgot password token is :: ${token} and redis data is: ${redis.get(
        FORGET_PASSWORD_PREFIX + token
      )} `
    );

    await sendEmail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
    );

    return true;
  }

  @Query(() => CompanyUser, { nullable: true })
  cme(@Ctx() { req }: MyContext) {
    // you are not logged in
    if (!req.session.userId) {
      return null;
    }

    return CompanyUser.findOne(req.session.userId);
  }

  @Mutation(() => CompanyUserResponse)
  async cregister(
    @Arg("options") options: CompanyUsernamePasswordInput,
    @Ctx() { req, channel }: MyContext
  ): Promise<CompanyUserResponse> {
    const errors = validateCompanyRegister(options);
    if (errors) {
      return { errors };
    }

    const hashedPassword = await argon2.hash(options.password);
    let user;
     
    
    try {
      // User.create({}).save()
      const result = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(CompanyUser)
        .values({
          firstname: options.firstname,
          lastname: options.lastname,
          email: options.cemail,
          password: hashedPassword,
          market: options.cmarket,
          mobile: options.mobile,
          croles: options.croles,
        })
        .returning("*")
        .execute();
      user = result.raw[0];
    } catch (err) {
      //|| err.detail.includes("already exists")) {
      // duplicate username error
      if (err.code === "23505") {
        return {
          errors: [
            {
              field: "username",
              message: "username already taken",
            },
          ],
        };
      }
    }

    // store user id session
    // this will set a cookie on the user
    // keep them logged in
    // req.session.userId = user.id;
    await channel.assertQueue("yooser_created");
    await channel.sendToQueue(
      "yooser_created",
      Buffer.from(JSON.stringify({ 
          id: user.id,         
          firstname: options.firstname,
          lastname: options.lastname,
          email: options.cemail,
          password: hashedPassword,
          market: options.cmarket,
          mobile: options.mobile,
          croles: options.croles,
        }))
    );

    return { user };
  }

  @Query(() => [CompanyUser])
  async companyusers(): Promise<CompanyUser[]> {
    let cusers: CompanyUser[];
    cusers = await getConnection().query(
      `
    select c.*
    from company_user c 
    order by c."createdAt" DESC

    `
    );

    // const qb = getConnection()
    //   .getRepository(Post)
    //   .createQueryBuilder("p")
    //   .innerJoinAndSelect("p.creator", "u", 'u.id = p."creatorId"')
    //   .orderBy('p."createdAt"', "DESC")
    //   .take(reaLimitPlusOne);

    // if (cursor) {
    //   qb.where('p."createdAt" < :cursor', {
    //     cursor: new Date(parseInt(cursor)),
    //   });
    // }

    // const posts = await qb.getMany();
    // console.log("posts: ", posts);

    return cusers;
    // return CompanyUser.findOne
  }

  @Query(() => CompanyUser, { nullable: true })
  companyuser(
    @Arg("id", () => Int) id: number
  ): Promise<CompanyUser | undefined> {
    return CompanyUser.findOne(id);
  }

  @Mutation(() => CompanyUserResponse)
  async clogin(
    @Arg("Email") Email: string,
    @Arg("password") password: string,
    @Ctx() { req }: MyContext
  ): Promise<CompanyUserResponse> {
    console.log(`usernameoRemail value is: ${Email} `);
    const user = await CompanyUser.findOne({ where: { email: Email } });

    console.log(`login mutation, user is: ${user}`);
    if (!user) {
      return {
        errors: [
          {
            field: "email",
            message: "that email doesn't exist",
          },
        ],
      };
    }
    if (user.status==0) {
      return {
        errors: [
          {
            field: "email",
            message: "User is disabled",
          },
        ],
      };
    }
    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "incorrect password",
          },
        ],
      };
    }

    req.session.userId = user.id;

    return {
      user,
    };
  }
  //Admin created users

  @Mutation(() => CompanyUser)
  // @UseMiddleware(isAuth)
  async createCompanyUser(
    @Arg("input") input: CompanyUsernamePasswordInput,
    @Ctx() { req, channel }: MyContext
  ): Promise<CompanyUser> {
    const result = {
      firstname: "Timmy",
      lastname: "Siebel",
      email: "Jim@Jones.io",
      password: "password",
      market: 1,
      croles: 2,
      likes: 2,
    };
    await channel.assertQueue("yooser_created");
    await channel.sendToQueue(
      "yooser_created",
      Buffer.from(JSON.stringify(result))
    );
    return CompanyUser.create({
      ...input,
      creatorId: req.session.userId,
    }).save();
  }

  @Mutation(() => CompanyUser, { nullable: true })
  //@UseMiddleware(isAuth)
  async updateCompanyUser(
    @Arg("id", () => Int) id: number,
    @Arg("cemail") email: string,
    @Arg("firstname") firstname: string,
    @Arg("lastname") lastname: string,
    @Arg("mobile") mobile: number,
    @Arg("croles") croles: CompanyUserRole,
    @Arg("cmarket") market: TelMarket,
    @Arg("password") password: string,
    @Ctx() { req }: MyContext
  ): Promise<CompanyUser | null> {
    const hashedPassword = await argon2.hash(password);
    password = hashedPassword;
    const result = await getConnection()
      .createQueryBuilder()
      .update(CompanyUser)
      .set({ email, firstname, lastname, mobile, croles, market, password })
      .where('id = :id', {
        id,
        // creatorId: req.session.userId,
      })
      .returning("*")
      .execute();

    return result.raw[0];
  }

  @Mutation(() => Boolean)
  //@UseMiddleware(isAuth)
  async deleteCompanyUser(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    // not cascade way
    // const post = await Post.findOne(id);
    // if (!post) {
    //   return false;
    // }
    // if (post.creatorId !== req.session.userId) {
    //   throw new Error("not authorized");
    // }

    // await Updoot.delete({ postId: id });
    // await Post.delete({ id });

    await CompanyUser.delete({ id });
    return true;
  }
  

  @Mutation(() => Boolean)
  clogout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err: any) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }

        resolve(true);
      })
    );
  }
}
