import { defineConfig } from "drizzle-kit";
import "dotenv/config";

export default defineConfig({
  schema: "./src/lib/db/schema.js",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  verbose: true,
  dbCredentials: { url: process.env.DATABASE_URL },
});
