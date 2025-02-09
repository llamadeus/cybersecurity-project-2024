import { db, schema } from "$lib/server/db";
import { authProcedure } from "$lib/trpc/middleware/auth";
import { z } from "zod";


const input = z.object({
  key: z.string().max(255),
  cmac: z.string().max(255),
  attributes: z.string(),
});

export const upload = authProcedure
  .input(input)
  .mutation(async ({ input, ctx }) => {
    await db.insert(schema.files).values({
      userId: ctx.auth.user.id,
      key: input.key,
      cmac: input.cmac,
      attributes: input.attributes,
    });
  });
