import { db, schema } from "$lib/server/db";
import { authProcedure } from "$lib/trpc/middleware/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";


const output = z.object({
  vaults: z.array(z.object({
    id: z.string(),
    token: z.string(),
    key: z.string(),
    attributes: z.string(),
    authEd25519PrivateKey: z.string(),
    authEd25519PublicKey: z.string(),
    createdAt: z.string(),
    slots: z.array(z.object({
      id: z.string(),
      maxSize: z.number(),
      attributes: z.string(),
      fileX25519PublicKey: z.string().nullable(),
      file: z.object({
        id: z.string(),
        key: z.string(),
        cmac: z.string(),
        attributes: z.string(),
        createdAt: z.string(),
      }).nullable(),
      createdAt: z.string(),
    })),
  })),
});

export const vaults = authProcedure
  .output(output)
  .query(async ({ ctx }) => {
    const vaults = await db.query.vaults.findMany({
      where: eq(schema.vaults.userId, ctx.auth.user.id),
      with: {
        slots: {
          with: {
            file: true,
          },
        },
      },
    });

    return {
      vaults: vaults.map(vault => ({
        id: vault.id,
        token: vault.token,
        key: vault.key,
        attributes: vault.attributes,
        authEd25519PrivateKey: vault.authEd25519PrivateKey,
        authEd25519PublicKey: vault.authEd25519PublicKey,
        createdAt: vault.createdAt.toISOString(),
        slots: vault.slots.map(slot => ({
          id: slot.id,
          maxSize: slot.maxSize,
          attributes: slot.attributes,
          fileX25519PublicKey: slot.fileX25519PublicKey,
          fileId: slot.fileId,
          file: slot.file !== null ? {
            id: slot.file.id,
            key: slot.file.key,
            cmac: slot.file.cmac,
            attributes: slot.file.attributes,
            createdAt: slot.file.createdAt.toISOString(),
          } : null,
          createdAt: slot.createdAt.toISOString(),
        })),
      })),
    };
  });
