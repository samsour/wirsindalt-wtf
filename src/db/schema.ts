import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ─── Auth.js tables ───

export const users = sqliteTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
});

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (a) => ({
    pk: primaryKey({ columns: [a.provider, a.providerAccountId] }),
  })
);

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (vt) => ({
    pk: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// ─── App tables ───

// Single-row table — one event per deployment
export const event = sqliteTable("event", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().default("Abitur 2016 · 10 Jahre Treffen"),
  description: text("description"),
  finalDateOptionId: text("finalDateOptionId"), // set by admin once decided
  location: text("location"),
  time: text("time"), // e.g. "19:00"
  rsvpsEnabled: integer("rsvpsEnabled", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const rsvps = sqliteTable("rsvp", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  status: text("status", { enum: ["attending", "maybe", "not_attending"] }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const dateOptions = sqliteTable("date_option", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: text("eventId").notNull().references(() => event.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // ISO "2026-06-14"
  label: text("label"), // optional override, e.g. "Pfingstsamstag"
  sortOrder: integer("sortOrder").notNull().default(0),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const votes = sqliteTable("vote", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  voterName: text("voterName").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const voteSelections = sqliteTable(
  "vote_selection",
  {
    voteId: text("voteId").notNull().references(() => votes.id, { onDelete: "cascade" }),
    dateOptionId: text("dateOptionId").notNull().references(() => dateOptions.id, { onDelete: "cascade" }),
  },
  (vs) => ({
    pk: primaryKey({ columns: [vs.voteId, vs.dateOptionId] }),
  })
);
