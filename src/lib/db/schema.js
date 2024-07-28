import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// export const users = pgTable("users", {
//   id: uuid("id").defaultRandom().primaryKey(),
//   name: text("name"),
//   email: text("email").notNull().unique(),
//   username: text("username").unique(),
//   password: text("password"),
//   emailVerified: timestamp("email_verified", { mode: "date" }),
//   image: text("image"),
//   createdAt: timestamp("created_at", { withTimezone: true })
//     .notNull()
//     .defaultNow(),
//   updatedAt: timestamp("updated_at", { withTimezone: true })
//     .default(sql`CURRENT_TIMESTAMP`)
//     .$onUpdate(() => new Date())
//     .notNull(),
// });

export const stories = pgTable("stories", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  imageUrl: text("image_url").notNull(),
  audioUrl: text("audio_url").notNull(),
  story: text("story").notNull(),
  imagePrompt: text("image_prompt").notNull(),
  prompt: text("prompt").notNull(),
  email: text("email").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date())
    .notNull(),
});
