import { db, schema } from "$lib/server/db";
import { authProcedure } from "$lib/trpc/middleware/auth";
import { and, eq, notExists } from "drizzle-orm";
import { z } from "zod";


const output = z.object({
  files: z.array(z.object({
    id: z.string(),
    key: z.string(),
    cmac: z.string(),
    attributes: z.string(),
    createdAt: z.string(),
  })),
});

export const files = authProcedure
  .output(output)
  .query(async ({ ctx }) => {
    const files = await db.query.files.findMany({
      where: and(
        eq(schema.files.userId, ctx.auth.user.id),
        notExists(db.select().from(schema.slots).where(eq(schema.slots.fileId, schema.files.id))),
      ),
    });

    return {
      files: files.map(file => ({
        id: file.id,
        key: file.key,
        cmac: file.cmac,
        attributes: file.attributes,
        createdAt: file.createdAt.toISOString(),
      })),
    };
  });
