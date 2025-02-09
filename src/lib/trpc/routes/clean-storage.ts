import { db, schema } from "$lib/server/db";
import { authProcedure } from "$lib/trpc/middleware/auth";
import { eq } from "drizzle-orm";


export const cleanStorage = authProcedure
  .mutation(async ({ input, ctx }) => {
    await db.transaction(async (tx) => {
      await tx.delete(schema.chunks).where(eq(schema.chunks.userId, ctx.auth.user.id));
      await tx.delete(schema.files).where(eq(schema.files.userId, ctx.auth.user.id));
    });
  });
