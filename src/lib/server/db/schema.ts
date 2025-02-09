import { randomId } from "$lib/utils/id";
import { relations } from "drizzle-orm";
import { blob, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";


export const users = sqliteTable("users", {
  id: text("id").$default(randomId).primaryKey(),
  username: text("username").notNull().unique(),
  crv: text("crv").notNull(),
  hak: text("hak").notNull(),
  key: text("key").notNull(),
  x25519PrivateKey: text("x25519_private_key"),
  x25519PublicKey: text("x25519_public_key"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$default(() => new Date()),
});

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  files: many(files),
  chunks: many(chunks),
}));

export const sessions = sqliteTable("sessions", {
  id: text("id").$default(randomId).primaryKey(),
  userId: text("user_id").notNull(),
  sessionId: text("session_id").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$default(() => new Date()),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const files = sqliteTable("files", {
  id: text("id").$default(randomId).primaryKey(),
  userId: text("user_id").notNull(),
  key: text("key").notNull(),
  cmac: text("cmac").notNull(),
  attributes: text("attributes").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$default(() => new Date()),
});

export const filesRelations = relations(files, ({ one, many }) => ({
  user: one(users, {
    fields: [files.userId],
    references: [users.id],
  }),
  slot: one(slots, {
    fields: [files.id],
    references: [slots.fileId],
  }),
}));

export const chunks = sqliteTable("chunks", {
  id: text("id").$default(randomId).primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  blob: blob("blob").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$default(() => new Date()),
});

export const chunksRelations = relations(chunks, ({ one }) => ({
  user: one(users, {
    fields: [chunks.userId],
    references: [users.id],
  }),
  slots: one(slotChunks, {
    fields: [chunks.id],
    references: [slotChunks.chunkId],
  }),
}));

export const vaults = sqliteTable("vaults", {
  id: text("id").$default(randomId).primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  token: text("token").notNull(),
  key: text("key").notNull(),
  attributes: text("attributes").notNull(),
  authEd25519PrivateKey: text("auth_ed25519_private_key").notNull(),
  authEd25519PublicKey: text("auth_ed25519_public_key").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$default(() => new Date()),
});

export const vaultsRelations = relations(vaults, ({ one, many }) => ({
  user: one(users, {
    fields: [vaults.userId],
    references: [users.id],
  }),
  slots: many(slots),
}));

export const slots = sqliteTable("slots", {
  id: text("id").$default(randomId).primaryKey(),
  vaultId: text("vault_id").references(() => vaults.id).notNull(),
  maxSize: integer("max_size").notNull(),
  attributes: text("attributes").notNull(),
  fileX25519PublicKey: text("file_x25519_public_key"),
  fileId: text("file_id").references(() => files.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$default(() => new Date()),
});

export const slotsRelations = relations(slots, ({ one, many }) => ({
  vault: one(vaults, {
    fields: [slots.vaultId],
    references: [vaults.id],
  }),
  file: one(files, {
    fields: [slots.fileId],
    references: [files.id],
  }),
  slotChunks: many(slotChunks),
}));

export const slotChunks = sqliteTable("slot_chunks", {
  slotId: text("slot_id").references(() => slots.id).notNull(),
  chunkId: text("chunk_id").references(() => chunks.id).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.slotId, table.chunkId] }),
}));

export const slotChunksRelations = relations(slotChunks, ({ one }) => ({
  slot: one(slots, {
    fields: [slotChunks.slotId],
    references: [slots.id],
  }),
  chunk: one(chunks, {
    fields: [slotChunks.chunkId],
    references: [chunks.id],
  }),
}));
