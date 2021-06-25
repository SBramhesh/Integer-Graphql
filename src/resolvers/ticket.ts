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
import {   ActivityCode, Ticket } from "../entities/Ticket";
import { Updoot } from "../entities/Updoot";
import { Post } from "../entities/Post";
import { User } from "../entities/User";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import { TelMarket } from "../entities/CompanyUser";
// {
//   "falocation": "FA12232323",
//   "ixscheduledate": "2021-05-27T08:40:00.000Z",
//   "ixfivegscheduledate": "2021-05-28T08:40:00.000Z",
//   "calltestdate": "2021-05-29T08:41:00.000Z",
//   "crewdispatchdate": "2021-05-29T08:41:00.000Z",
//   "tickets": [
//     {
//       "pace": "pace1",
//       "ptn": "ptn1"
//     },
//     {
//       "pace": "pace2",
//       "ptn": "ptn2"
//     }
//   ],
//   "activities": [
//     "IxSupport",
//     "CxSupport"
//   ],
//   "scopeofwork": "Giant scope of work",
//   "assignfe": 1,
//   "assigngc": 0,
//   "noOfTickets": 2,
//   "keycomments": "key comments",
//   "noticecomments": "Notice comments",
//   "fgixcomment": "5G comments",
//   "SiteId": "Site123",
//   "siteName": "Site Big",
//   "latitude": 44,
//   "longitude": -78.99,
//   "zipcode": 8778678,
//   "market": 2,
//   "address1": "Box street canal avenue"
// }

@InputType()
  class ActivitiesInt {
  @Field()
  IsTrue: boolean;

  @Field(() => ActivityCode)
  activity: ActivityCode;
}

@InputType()
 class Paceptnn  {
  @Field(() => String)
  pace: string;
  @Field( () => String)
  ptn: string;
}

@InputType()
class TicketInput {
  @Field()
  falocation: string;
  @Field()
  siteid: string;
  @Field()
  threegsiteid: string;
  @Field()
  sitename: string;
  @Field()
  latitude: number;
  @Field()
  longitude: number;
  @Field()
  zipcode: number;
  @Field()
  address1: string;
  @Field()
  address2: string;
  @Field()
  market: TelMarket;
  @Field()
  keycomments: string;
  @Field()
  noticecomments: string;
  @Field()
  fivegixcomments: string;
  @Field()
  scopeofwork: string;
  @Field()
  calltestdate: string; //Date
  @Field()
  crewdispatchdate: string; //Date
   @Field()
  fivegixscheduledate: string; //Date
   @Field()
  ixscheduledate: string; //date
  @Field()
  assignedfe: number;
  @Field()
  assignedgc: number;
  @Field(() => [Paceptnn])
  tickets: Paceptnn[];
  @Field()
  noOfTickets: number;
  @Field(() => [ActivityCode])
  activities: ActivityCode[];
}

@ObjectType()
class PaginatedTickets {
  @Field(() => [Ticket])
  tickets: Ticket[];
  @Field()
  hasMore: boolean;
}

@Resolver(Ticket)
export class TicketResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() ticket: Ticket) {
    return ticket.scopeofwork.slice(0, 50);
  }

  @FieldResolver(() => Ticket)
  creator(@Root() ticket: Ticket, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(ticket.creatorId);
  }

  @FieldResolver(() => Int, { nullable: true })
  async voteStatus(
    @Root() post: Post,
    @Ctx() { updootLoader, req }: MyContext
  ) {
    if (!req.session.userId) {
      return null;
    }

    const updoot = await updootLoader.load({
      postId: post.id,
      userId: req.session.userId,
    });

    return updoot ? updoot.value : null;
  }

  @Mutation(() => Boolean)
  //@UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const isUpdoot = value !== -1;
    const realValue = isUpdoot ? 1 : -1;
    const { userId } = req.session;

    const updoot = await Updoot.findOne({ where: { postId, userId } });

    // the user has voted on the post before
    // and they are changing their vote
    if (updoot && updoot.value !== realValue) {
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
    update updoot
    set value = $1
    where "postId" = $2 and "userId" = $3
        `,
          [realValue, postId, userId]
        );

        await tm.query(
          `
          update post
          set points = points + $1
          where id = $2
        `,
          [2 * realValue, postId]
        );
      });
    } else if (!updoot) {
      // has never voted before
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
    insert into updoot ("userId", "postId", value)
    values ($1, $2, $3)
        `,
          [userId, postId, realValue]
        );

        await tm.query(
          `
    update post
    set points = points + $1
    where id = $2
      `,
          [realValue, postId]
        );
      });
    }
    return true;
  }

    @Query(() => PaginatedTickets)
    async tickets(
      @Arg("limit", () => Int) limit: number,
      @Arg("cursor", () => String, { nullable: true }) cursor: string | null
    ): Promise<PaginatedTickets> {
      // 20 -> 21
      const realLimit = Math.min(50, limit);
      const reaLimitPlusOne = realLimit + 1;

      const replacements: any[] = [reaLimitPlusOne];

      if (cursor) {
        replacements.push(new Date(parseInt(cursor)));
      }

      const tickets = await getConnection().query(
        `
      select p.*
      from ticket p
      ${cursor ? `where p."createdAt" < $2` : ""}
      order by p."createdAt" DESC
      limit $1
      `,
        replacements
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

      return {
        tickets: tickets.slice(0, realLimit),
        hasMore: tickets.length === reaLimitPlusOne,
      };
    }

  @Query(() => Ticket, { nullable: true })
  ticket(@Arg("id", () => Int) id: number): Promise<Ticket | undefined> {
    return Ticket.findOne(id);
  }

  //   @Mutation(() => Post)
  //   // @UseMiddleware(isAuth)
  //   async createPost(
  //     @Arg("input") input: PostInput,
  //     @Ctx() { req }: MyContext
  //   ): Promise<Post> {
  //     return Post.create({
  //       ...input,
  //       creatorId: req.session.userId,
  //     }).save();
  //   }

  @Mutation(() => Post, { nullable: true })
  //@UseMiddleware(isAuth)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title") title: string,
    @Arg("text") text: string,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    const result = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('id = :id and "creatorId" = :creatorId', {
        id,
        creatorId: req.session.userId,
      })
      .returning("*")
      .execute();

    return result.raw[0];
  }

  @Mutation(() => Ticket)
  // @UseMiddleware(isAuth)
  async createTicket(
    @Arg("input") input: TicketInput,
    @Ctx() { req }: MyContext
  ): Promise<Ticket> {
    return Ticket.create({
      ...input,
      creatorId: req.session.userId,
    }).save();
  }

  @Mutation(() => Boolean)
  //@UseMiddleware(isAuth)
  async deleteTicket(
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

     await Ticket.delete({ id, creatorId: req.session.userId });
     return true;
  }
}
