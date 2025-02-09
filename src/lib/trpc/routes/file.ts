import { db, schema } from "$lib/server/db";
import { authProcedure } from "$lib/trpc/middleware/auth";
import { and, eq } from "drizzle-orm";
import { z } from "zod";


const input = z.object({
  id: z.string(),
});

const output = z.object({
  id: z.string(),
  key: z.string(),
  cmac: z.string(),
  attributes: z.string(),
  createdAt: z.string(),
}).optional();

export const file = authProcedure
  .input(input)
  .output(output)
  .query(async ({ input, ctx }) => {
    const file = await db.query.files.findFirst({
      where: and(
        eq(schema.files.userId, ctx.auth.user.id),
        eq(schema.files.id, input.id),
      ),
    });
    if (typeof file == "undefined") {
      return undefined;
    }

    return {
      id: file.id,
      key: file.key,
      cmac: file.cmac,
      attributes: file.attributes,
      createdAt: file.createdAt.toISOString(),
    };
  });
