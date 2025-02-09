import { db, schema } from "$lib/server/db";
import { createSession } from "$lib/server/session";
import { t } from "$lib/trpc/t";
import { generateHashedAuthenticationKey } from "$lib/tulip/auth";
import { decodeBase64Url, encodeBase64Url } from "$lib/utils/base64url";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";


const input = z.object({
  u: z.string().max(40),
  ak: z.string().max(255),
});

const output = z.object({
  u: z.string(),
  key: z.string(),
  x25519PrivateKey: z.string().nullable(),
  x25519PublicKey: z.string().nullable(),
});

export const login = t.procedure
  .input(input)
  .output(output)
  .mutation(async ({ input, ctx }) => {
    const hashedAuthenticationKey = generateHashedAuthenticationKey(decodeBase64Url(input.ak));
    const user = await db.query.users.findFirst({
      where: and(
        eq(schema.users.username, input.u),
        eq(schema.users.hak, encodeBase64Url(hashedAuthenticationKey)),
      ),
    });

    if (typeof user == "undefined") {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Cannot find user",
      });
    }

    const sessionId = await createSession(user);

    ctx.event.cookies.set("sid", sessionId, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === "production",
    });

    return {
      u: user.username,
      key: user.key,
      x25519PrivateKey: user.x25519PrivateKey,
      x25519PublicKey: user.x25519PublicKey,
    };
  });
