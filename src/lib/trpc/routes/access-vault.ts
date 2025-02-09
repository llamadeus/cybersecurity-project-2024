import { encrypt } from "$lib/server/crypto/encrypt";
import { verify } from "$lib/server/crypto/sign";
import { db, schema } from "$lib/server/db";
import type { SlotUploadTicket } from "$lib/server/types";
import { t } from "$lib/trpc/t";
import { decodeBase64Url, encodeBase64Url } from "$lib/utils/base64url";
import { utf8ToBytes } from "@noble/ciphers/utils";
import { ed25519 } from "@noble/curves/ed25519";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";


const input = z.object({
  token: z.string(),
  challenge: z.string(),
  proof: z.string(),
});

const output = z.object({
  x25519PublicKey: z.string(),
  token: z.string(),
  attributes: z.string(),
  createdAt: z.string(),
  slots: z.array(z.object({
    maxSize: z.number(),
    attributes: z.string(),
    available: z.boolean(),
    ticket: z.string(),
  })),
});

export const accessVault = t.procedure
  .input(input)
  .output(output)
  .query(async ({ input }) => {
    const vault = await db.query.vaults.findFirst({
      where: eq(schema.vaults.token, input.token),
      with: {
        user: true,
        slots: true,
      },
    });
    if (typeof vault == "undefined") {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Vault not found",
      });
    }

    const rawChallenge = decodeBase64Url(input.challenge);
    const challenge = rawChallenge.subarray(0, 32);
    const signature = rawChallenge.subarray(32);
    if (! verify(signature, challenge)) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Foreign challenge",
      });
    }

    const proof = decodeBase64Url(input.proof);
    if (! ed25519.verify(proof, rawChallenge, decodeBase64Url(vault.authEd25519PublicKey))) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Challenge failed",
      });
    }

    if (vault.user.x25519PublicKey === null) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Vault is not public",
      });
    }

    return {
      x25519PublicKey: vault.user.x25519PublicKey,
      token: vault.token,
      attributes: vault.attributes,
      createdAt: vault.createdAt.toISOString(),
      slots: vault.slots.map((slot) => {
        const ticket = JSON.stringify({
          slotId: slot.id,
          timestamp: Math.floor(Date.now() / 1000),
        } satisfies SlotUploadTicket);

        return ({
          maxSize: slot.maxSize,
          attributes: slot.attributes,
          available: slot.fileId === null,
          ticket: encodeBase64Url(encrypt(utf8ToBytes(ticket))),
        });
      }),
    };
  });
