import { db, schema } from "$lib/server/db";
import { authProcedure } from "$lib/trpc/middleware/auth";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";


const input = z.object({
  id: z.string().max(20),
});

export const deleteVault = authProcedure
  .input(input)
  .mutation(async ({ input, ctx }) => {
    const vault = await db.query.vaults.findFirst({
      where: and(
        eq(schema.vaults.userId, ctx.auth.user.id),
        eq(schema.vaults.id, input.id),
      ),
      with: {
        slots: {
          with: {
            slotChunks: true,
          },
        },
      },
    });

    if (typeof vault == "undefined") {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Vault not found",
      });
    }

    await db.transaction(async (tx) => {
      const slotIds = vault.slots.map((slot) => slot.id);
      const fileIds = vault.slots.filter((slot) => slot.fileId !== null).map((slot) => slot.fileId) as string[];
      const chunkIds = vault.slots.flatMap((slot) => slot.slotChunks.map((chunk) => chunk.chunkId));

      await tx.delete(schema.slotChunks).where(inArray(schema.slotChunks.slotId, slotIds));
      await tx.delete(schema.chunks).where(inArray(schema.chunks.id, chunkIds));
      await tx.delete(schema.slots).where(eq(schema.slots.vaultId, vault.id));
      await tx.delete(schema.files).where(inArray(schema.files.id, fileIds));
      await tx.delete(schema.vaults).where(eq(schema.vaults.id, vault.id));
    });
  });
