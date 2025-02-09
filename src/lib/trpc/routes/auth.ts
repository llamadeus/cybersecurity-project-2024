import { getSessionFromRequest, getSessionUser } from "$lib/server/session";
import { t } from "$lib/trpc/t";
import { z } from "zod";


const output = z.object({
  u: z.string(),
  key: z.string(),
  x25519PrivateKey: z.string().nullable(),
  x25519PublicKey: z.string().nullable(),
}).nullable();

export const auth = t.procedure
  .output(output)
  .query(async ({ ctx }) => {
    const session = await getSessionFromRequest(ctx.event);
    const user = await getSessionUser(session);
    if (user === null) {
      ctx.event.cookies.delete("sid", { path: "/" });
      return null;
    }

    return {
      u: user.username,
      key: user.key,
      x25519PrivateKey: user.x25519PrivateKey,
      x25519PublicKey: user.x25519PublicKey,
    };
  });
