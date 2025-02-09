import { db, schema } from "$lib/server/db";
import { t } from "$lib/trpc/t";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";


const input = z.object({
  u: z.string()
    .min(3, "Your username must be at least 3 characters")
    .max(40, "Your username cannot be longer than 40 characters"),
  crv: z.string().min(1).max(255),
  hak: z.string().min(1).max(255),
  key: z.string().min(1).max(255),
  x25519PrivateKey: z.string().min(1).max(255),
  x25519PublicKey: z.string().min(1).max(255),
});

const ALLOWED_USERNAMES = new Set(["admin", "felix", "jacob420"]);

export const register = t.procedure
  .input(input)
  .mutation(async ({ input }) => {
    const username = input.u.trim();

    if (process.env.NODE_ENV === "production" && ! ALLOWED_USERNAMES.has(username)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid username",
      });
    }

    // Check if user exists
    const existing = await db.query.users.findFirst({
      where: eq(schema.users.username, username),
    });

    if (typeof existing != "undefined") {
      throw new TRPCError({
        code: "CONFLICT",
        message: "User already exists",
      });
    }

    // Create user
    const [user] = await db.insert(schema.users).values({
      username,
      crv: input.crv,
      hak: input.hak,
      key: input.key,
      x25519PrivateKey: input.x25519PrivateKey,
      x25519PublicKey: input.x25519PublicKey,
    }).returning();

    if (typeof user == "undefined") {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Cannot create user",
      });
    }
  });
