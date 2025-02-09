import { db, schema } from "$lib/server/db";
import { authProcedure } from "$lib/trpc/middleware/auth";
import { and, eq } from "drizzle-orm";
import { z } from "zod";


const input = z.object({
  id: z.string(),
});

const output = z.object({
  id: z.string(),
  maxSize: z.number(),
  attributes: z.string(),
  fileX25519PublicKey: z.string().nullable(),
  fileId: z.string().nullable(),
  createdAt: z.string(),
}).optional();

export const slot = authProcedure
  .input(input)
  .output(output)
  .query(async ({ input, ctx }) => {
    const [slot] = await db.select()
      .from(schema.slots)
      .innerJoin(schema.vaults, eq(schema.vaults.id, schema.slots.vaultId))
      .where(and(
        eq(schema.vaults.userId, ctx.auth.user.id),
        eq(schema.slots.id, input.id),
      ))
      .limit(1);
    if (typeof slot == "undefined") {
      return undefined;
    }

    return {
      id: slot.slots.id,
      maxSize: slot.slots.maxSize,
      attributes: slot.slots.attributes,
      fileX25519PublicKey: slot.slots.fileX25519PublicKey,
      fileId: slot.slots.fileId,
      createdAt: slot.slots.createdAt.toISOString(),
    };
  });
