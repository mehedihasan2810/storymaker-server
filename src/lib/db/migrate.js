import { migrate } from "drizzle-orm/postgres-js/migrator";

import { client, db } from "./index.js";

const runMigrate = async () => {
  console.log("⏳ Running migrations...");

  const start = Date.now();

  await migrate(db, { migrationsFolder: "src/lib/db/migrations" });
  client.end();

  const end = Date.now();

  console.log("✅ Migrations completed in", end - start, "ms");
  process.exit(0);
};

runMigrate().catch((err) => {
  console.error("❌ Migration failed");
  console.error(err);
  process.exit(1);
});
