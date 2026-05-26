import { sqliteTable, text, integer, primaryKey, index } from "drizzle-orm/sqlite-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ─── Auth.js tables ───
// Required by @auth/drizzle-adapter. Don't rename columns.

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

export const groups = sqliteTable("group", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // used in invite URL: vennwhen.app/g/{slug}
  ownerId: text("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  horizonWeeks: integer("horizonWeeks").notNull().default(4),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const memberships = sqliteTable(
  "membership",
  {
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    groupId: text("groupId").notNull().references(() => groups.id, { onDelete: "cascade" }),
    joinedAt: integer("joinedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (m) => ({
    pk: primaryKey({ columns: [m.userId, m.groupId] }),
  })
);

// Busy blocks — the ONLY calendar data we store.
// No titles, no descriptions, no locations. Just time ranges.
export const busyBlocks = sqliteTable(
  "busy_block",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    // Unix milliseconds — keeps range comparisons cheap with B-tree indexes
    startTs: integer("startTs").notNull(),
    endTs: integer("endTs").notNull(),
    source: text("source").notNull(), // 'google' | 'outlook' | 'ics'
    syncedAt: integer("syncedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (b) => ({
    // Range queries: WHERE userId = ? AND startTs < windowEnd AND endTs > windowStart
    userTimeIdx: index("busy_user_time_idx").on(b.userId, b.startTs, b.endTs),
  })
);

export const syncState = sqliteTable("sync_state", {
  userId: text("userId").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  lastSyncedAt: integer("lastSyncedAt", { mode: "timestamp_ms" }),
  nextSyncAt: integer("nextSyncAt", { mode: "timestamp_ms" }),
});
