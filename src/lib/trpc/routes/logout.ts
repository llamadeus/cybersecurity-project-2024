import { authProcedure } from "$lib/trpc/middleware/auth";


export const logout = authProcedure
  .mutation(async ({ ctx }) => {
    ctx.event.cookies.delete("sid", { path: "/" });
  });
