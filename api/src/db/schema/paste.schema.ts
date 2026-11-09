import {
  bigserial,
  index,
  pgTable,
  text,
  timestamp,
  varchar,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const Paste = pgTable(
  "tbl_pastes",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),

    code: varchar("code", { length: 10 }).notNull(),

    title: varchar("title", { length: 255 }),

    language: varchar("language", { length: 100 }).notNull(),

    content_url: text("content_url").notNull(),

    expires_at: timestamp("expires_at", {
      withTimezone: true,
    }).notNull(),

    created_at: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_paste_code").on(table.code),
    index("idx_paste_expires_at").on(table.expires_at),
  ],
);
