import express, { json } from "express";
import cors from "cors";
import morgan from "morgan";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { resolvers } from "./resolvers/index.js";
import { typeDefs } from "./typeDefs/index.js";

import { stories } from "./lib/db/schema.js";
import { db } from "./lib/db/index.js";
import "dotenv/config";

const PORT = process.env.PORT || 4000;
const app = express();

app.use(morgan("dev"));
// app.use(helmet());
app.use(cors());
app.use(express.json());

// (async () => {
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

await server.start();

app.use("/graphql", cors(), json(), expressMiddleware(server));

app.get("/", async (_, res) => {
  res.status(200).send("I am aliveee...");
});

app.get("/test", async (_, res) => {
  const storiesRes = await db.select().from(stories);
  res.status(200).send({ message: "Testing...", storiesRes });
});

app.listen(PORT, () => {
  console.log(`Express server is running on: http://localhost:${PORT}`);
  console.log(`GraphQL server is running on: http://localhost:${PORT}/graphql`);
});
// })();
