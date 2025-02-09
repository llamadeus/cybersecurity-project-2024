import { t } from "$lib/trpc/t";
import { TRPCError } from "@trpc/server";


export const authProcedure = t.procedure.use(async (opts) => {
  if (opts.ctx.auth === null) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return opts.next({
    ctx: {
      auth: opts.ctx.auth,
    },
  });
});
