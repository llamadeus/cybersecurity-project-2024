import { db, schema } from "$lib/server/db";
import { authProcedure } from "$lib/trpc/middleware/auth";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";


const input = z.object({
  id: z.string().max(20),
  chunkIds: z.array(z.string().max(20)),
});

export const deleteFile = authProcedure
  .input(input)
  .mutation(async ({ input, ctx }) => {
    const file = await db.query.files.findFirst({
      where: and(
        eq(schema.files.userId, ctx.auth.user.id),
        eq(schema.files.id, input.id),
      ),
    });

    if (typeof file == "undefined") {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "File not found",
      });
    }

    await db.transaction(async (tx) => {
      await tx.delete(schema.chunks).where(and(
        eq(schema.chunks.userId, ctx.auth.user.id),
        inArray(schema.chunks.id, input.chunkIds),
      ));
      await tx.update(schema.slots).set({
        fileX25519PublicKey: null,
        fileId: null,
      }).where(eq(schema.slots.fileId, file.id));
      await tx.delete(schema.files).where(eq(schema.files.id, file.id));
    });
  });
