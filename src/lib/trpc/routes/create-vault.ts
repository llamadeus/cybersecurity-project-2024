import { db, schema } from "$lib/server/db";
import { authProcedure } from "$lib/trpc/middleware/auth";
import { randomString } from "$lib/utils/id";
import { TRPCError } from "@trpc/server";
import type { InferSelectModel } from "drizzle-orm";
import { z } from "zod";


const input = z.object({
  key: z.string(),
  attributes: z.string(),
  authEd25519PrivateKey: z.string().max(255),
  authEd25519PublicKey: z.string().max(255),
  slots: z.array(z.object({
    maxSize: z.number().positive(),
    attributes: z.string(),
  })).min(1),
});

const output = z.object({
  id: z.string(),
  token: z.string(),
});

export const createVault = authProcedure
  .input(input)
  .output(output)
  .mutation(async ({ input, ctx }) => {
    let vault: InferSelectModel<typeof schema.vaults> | undefined;

    await db.transaction(async (tx) => {
      [vault] = await tx.insert(schema.vaults).values({
        userId: ctx.auth.user.id,
        token: randomString(64),
        authEd25519PrivateKey: input.authEd25519PrivateKey,
        authEd25519PublicKey: input.authEd25519PublicKey,
        key: input.key,
        attributes: input.attributes,
      }).returning();
      if (typeof vault == "undefined") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create vault",
        });
      }

      for (const slots of input.slots) {
        await tx.insert(schema.slots).values({
          vaultId: vault.id,
          maxSize: slots.maxSize,
          attributes: slots.attributes,
        });
      }
    });

    if (typeof vault == "undefined") {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create vault",
      });
    }

    return {
      id: vault.id,
      token: vault.token,
    };
  });
