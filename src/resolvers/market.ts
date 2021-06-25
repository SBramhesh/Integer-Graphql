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
import { Market } from "../entities/Market";
import { Updoot } from "../entities/Updoot";
import { User } from "../entities/User";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";

@InputType()
class MarketInput {
  @Field()
  title: string;
  @Field()
  description: string;
}



@Resolver(Market)
export class MarketResolver {
  

  

  @Query(() => [Market])
  async roles(): Promise<[Market]> {
    let markets: [Market];
    markets = await getConnection().query(
      `
    select m.*
    from  m market
    order by m."createdAt" DESC

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

    return markets;
  }

  @Query(() => Market, { nullable: true })
  market(@Arg("id", () => Int) id: number): Promise<Market | undefined> {
    return Market.findOne(id);
  }

  @Mutation(() => Market)
  // @UseMiddleware(isAuth)
  async createMarket(
    @Arg("input") input: MarketInput,
    @Ctx() { req }: MyContext
  ): Promise<Market> {
    return Market.create({
      ...input,
      creatorId: req.session.userId,
      
    }).save();
  }

   @Mutation(() => Market, { nullable: true })
  //@UseMiddleware(isAuth)
  async updateMarket(
    @Arg("id", () => Int) id: number,
    @Arg("title") title: string,
    @Arg("description") description: string,
    @Arg("status") status: number,
    @Ctx() { req }: MyContext
  ): Promise<Market | null> {
    const result = await getConnection()
      .createQueryBuilder()
      .update(Market)
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
  async deleteMarket(
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

    await Market.delete({ id, creatorId: req.session.userId});
    return true;
  }
}