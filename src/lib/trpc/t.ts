import type { Context } from "$lib/trpc/context";
import { initTRPC } from "@trpc/server";


export const t = initTRPC.context<Context>().create({
  errorFormatter: ({ shape, error }) => ({
    code: shape.code,
    message: error.message,
    data: {
      ...shape.data,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    },
  }),
});
