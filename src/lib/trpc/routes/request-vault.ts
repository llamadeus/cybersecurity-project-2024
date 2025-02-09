import { sign } from "$lib/server/crypto/sign";
import { db, schema } from "$lib/server/db";
import { t } from "$lib/trpc/t";
import { concat } from "$lib/tulip/utils/buffer";
import { encodeBase64Url } from "$lib/utils/base64url";
import { randomBytes } from "@noble/ciphers/webcrypto";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";


const input = z.object({
  token: z.string(),
});

const output = z.object({
  token: z.string(),
  authkey: z.string(),
  challenge: z.string(),
});

export const requestVault = t.procedure
  .input(input)
  .output(output)
  .query(async ({ input }) => {
    const vault = await db.query.vaults.findFirst({
      where: eq(schema.vaults.token, input.token),
    });
    if (typeof vault == "undefined") {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Vault not found",
      });
    }

    // TODO: Just creating a random challenge is not secure enough because this makes us vulnerable to replay attacks
    //       An attacker could simply send the same challenge and proof to the access endpoint and get access to the vault
    //       The challenge should probably contain a timestamp and the token of the vault
    //       Note: but then we can maybe just use XChaCha20-Poly1305 instead of ED25519 for the challenge lol
    const challenge = randomBytes(32);
    const signature = sign(challenge);

    return {
      token: vault.token,
      authkey: vault.authEd25519PrivateKey,
      challenge: encodeBase64Url(concat(challenge, signature)),
    };
  });
