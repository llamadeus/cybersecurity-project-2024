import { db, schema } from "$lib/server/db";
import { authProcedure } from "$lib/trpc/middleware/auth";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";


const input = z.object({
  id: z.string().max(20),
});

export const clearSlot = authProcedure
  .input(input)
  .mutation(async ({ input, ctx }) => {
    const [slot] = await db.select()
      .from(schema.slots)
      .innerJoin(schema.vaults, eq(schema.vaults.id, schema.slots.vaultId))
      .where(and(
        eq(schema.vaults.userId, ctx.auth.user.id),
        eq(schema.slots.id, input.id),
      ))
      .limit(1);
    if (typeof slot == "undefined") {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Slot not found",
      });
    }

    await db.transaction(async (tx) => {
      if (slot.slots.fileId !== null) {
        const slotChunks = await tx.query.slotChunks.findMany({
          where: eq(schema.slotChunks.slotId, slot.slots.id),
        });
        const chunkIds = slotChunks.map((chunk) => chunk.chunkId);

        await tx.delete(schema.slotChunks).where(eq(schema.slotChunks.slotId, slot.slots.id));
        await tx.delete(schema.chunks).where(inArray(schema.chunks.id, chunkIds));
        await tx.delete(schema.files).where(eq(schema.files.id, slot.slots.fileId));
      }

      await tx.update(schema.slots)
        .set({
          fileId: null,
          fileX25519PublicKey: null,
        })
        .where(eq(schema.slots.id, slot.slots.id));
    });
  });
