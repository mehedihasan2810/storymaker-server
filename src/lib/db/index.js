import * as schema from "./schema.js";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

export const client = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 50, // Use 50 connections out of the 72 available
  idleTimeoutMillis: 30000, // This setting closes idle connections after 30 seconds, which helps manage resource usage.
  connectionTimeoutMillis: 10000, // This setting times out connection attempts after 10 seconds, preventing long waits if the database is unreachable.
});

export const db = drizzle(client, { schema });

client.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});
