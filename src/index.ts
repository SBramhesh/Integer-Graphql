import "reflect-metadata";
import "dotenv-safe/config";
import { __prod__, COOKIE_NAME } from "./constants";
import * as express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/User";
import * as Redis from "ioredis";
import * as session from "express-session";
import * as connectRedis from "connect-redis";
import * as cors from "cors";
import { createConnection } from "typeorm";
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import * as path from "path";
import { Updoot } from "./entities/Updoot";
import { createUserLoader } from "./utils/createUserLoader";
import { createUpdootLoader } from "./utils/createUpdootLoader";
import { Ticket } from "./entities/Ticket";
import { CompanyUser } from "./entities/CompanyUser";
import { CompanyUserResolver } from "./resolvers/CompanyUser";
import { TicketResolver } from "./resolvers/ticket";
import { Role } from "./entities/Role";
import { RoleResolver } from "./resolvers/role";
import * as amqp from "amqplib";
import { MarketResolver } from "./resolvers/market";
import { Market } from "./entities/Market";
import { resolve } from "node:url";

const main = async () => {
  const conn = await createConnection({
    type: "postgres",
    url: process.env.DATABASE_URL,
    logging: true,
    synchronize: true,
    migrations: [path.join(__dirname, "./migrations/*")],
    entities: [Post, User, Updoot, Ticket, CompanyUser, Role, Market],
    // entities: ["dist/entities/*.js"]
  });
  await conn.runMigrations();

  const amqpServer =process.env.AMQP_SERVER;
    ;

  const connection = await amqp.connect(amqpServer);
  const channel = await connection.createChannel();

  // await Post.delete({});

  const app = express();

  const RedisStore = connectRedis(session);
  const redis = new Redis(process.env.REDIS_URL);
  //app.set("trust proxy", 1);
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.get("/", async (_req, res) => {
    

    return res.send("Hello World");
  });
  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        sameSite: "lax", // csrf
        secure: __prod__, // cookie only works in https
        domain: __prod__ ? ".integer.com" : undefined,
      },
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET,
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    playground: true,
    introspection: true,
    schema: await buildSchema({
      resolvers: [
        HelloResolver,
        PostResolver,
        UserResolver,
        CompanyUserResolver,
        TicketResolver,
        RoleResolver,
        MarketResolver,
      ],
      validate: false,
    }),
    context: ({ req, res }) => ({
      req,
      res,
      redis,
      userLoader: createUserLoader(),
      updootLoader: createUpdootLoader(),
      channel,
    }),
  });

  apolloServer.applyMiddleware({
    app,
    cors: false,
  });

  app.listen(parseInt(process.env.PORT), () => {
    console.log(`server started on localhost:${process.env.PORT}`);
  });
};

main().catch((err) => {
  console.error(err);
});
