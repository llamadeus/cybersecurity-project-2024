import { serverRandomValue } from "$lib/server";
import { db, schema } from "$lib/server/db";
import { t } from "$lib/trpc/t";
import { generateSalt } from "$lib/tulip/auth";
import { decodeBase64Url, encodeBase64Url } from "$lib/utils/base64url";
import { utf8ToBytes } from "@noble/ciphers/utils";
import { eq } from "drizzle-orm";
import { z } from "zod";


const input = z.object({
  u: z.string().max(40),
});

const output = z.object({
  salt: z.string(),
});

export const crv = t.procedure
  .input(input)
  .output(output)
  .query(async ({ input }) => {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.username, input.u),
    });
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));

    const salt = typeof user != "undefined"
      ? generateSalt(decodeBase64Url(user.crv))
      : generateSalt(serverRandomValue, utf8ToBytes(input.u));

    return {
      salt: encodeBase64Url(salt),
    };
  });
