import { db, schema } from "$lib/server/db";
import { authProcedure } from "$lib/trpc/middleware/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";


const input = z.object({
  x25519PrivateKey: z.string().min(1).max(255),
  x25519PublicKey: z.string().min(1).max(255),
});

export const updateX25519 = authProcedure
  .input(input)
  .mutation(async ({ input, ctx }) => {
    await db.update(schema.users)
      .set({
        x25519PrivateKey: input.x25519PrivateKey,
        x25519PublicKey: input.x25519PublicKey,
      })
      .where(eq(schema.users.id, ctx.auth.user.id)).returning();
  });
