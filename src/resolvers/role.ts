import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { getConnection } from "typeorm";
import { Post } from "../entities/Post";
import { Role } from "../entities/Role";
import { Updoot } from "../entities/Updoot";
import { User } from "../entities/User";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";

@InputType()
class RoleInput {
  @Field()
  title: string;
  @Field()
  description: string;
}

@Resolver(Role)
export class RoleResolver {
  @Query(() => [Role])
  async roles(): Promise<[Role]> {
    let roles: [Role];
    roles = await getConnection().query(
      `
    select r.*
    from  r role
    order by r."createdAt" DESC

    `
    );

    return roles;
  }

  @Query(() => Role, { nullable: true })
  role(@Arg("id", () => Int) id: number): Promise<Role | undefined> {
    return Role.findOne(id);
  }

  @Mutation(() => Role)
  // @UseMiddleware(isAuth)
  async createRole(
    @Arg("input") input: RoleInput,
    @Ctx() { req }: MyContext
  ): Promise<Role> {
    return Role.create({
      ...input,
      creatorId: req.session.userId,
    }).save();
  }

  @Mutation(() => Role, { nullable: true })
  //@UseMiddleware(isAuth)
  async updateRole(
    @Arg("id", () => Int) id: number,
    @Arg("title") title: string,
    @Arg("description") description: string,
    @Arg("status") status: number,
    @Ctx() { req }: MyContext
  ): Promise<Role | null> {
    const result = await getConnection()
      .createQueryBuilder()
      .update(Role)
      .set({ title, description, status })
      .where('id = :id and "creatorId" = :creatorId', {
        id,
        creatorId: req.session.userId,
      })
      .returning("*")
      .execute();

    return result.raw[0];
  }

  @Mutation(() => Boolean)
  //@UseMiddleware(isAuth)
  async deleteRole(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    await Role.delete({ id, creatorId: req.session.userId });
    return true;
  }
}
