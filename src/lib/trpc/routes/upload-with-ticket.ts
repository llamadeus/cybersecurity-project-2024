import { decrypt } from "$lib/server/crypto/encrypt";
import { db, schema } from "$lib/server/db";
import type { SlotUploadTicket } from "$lib/server/types";
import { t } from "$lib/trpc/t";
import { decodeBase64Url } from "$lib/utils/base64url";
import { bytesToUtf8 } from "@noble/ciphers/utils";
import { error } from "@sveltejs/kit";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";


const input = z.object({
  ticket: z.string().max(255),
  x25519PublicKey: z.string().max(255),
  key: z.string().max(255),
  cmac: z.string().max(255),
  attributes: z.string(),
});

export const uploadWithTicket = t.procedure
  .input(input)
  .mutation(async ({ input }) => {
    const decrypted = decrypt(decodeBase64Url(input.ticket));
    const ticket: SlotUploadTicket = JSON.parse(bytesToUtf8(decrypted));

    if (ticket.timestamp < Date.now() / 1000 - 60 * 60) {
      // Ticket expired
      return error(422, "Ticket expired");
    }

    const slot = await db.query.slots.findFirst({
      where: eq(schema.slots.id, ticket.slotId),
      with: {
        vault: true,
      },
    });
    if (typeof slot == "undefined") {
      return error(422, "Invalid ticket");
    }

    if (slot.fileId !== null) {
      return error(422, "Slot not available");
    }

    await db.transaction(async (tx) => {
      const [file] = await tx.insert(schema.files).values({
        userId: slot.vault.userId,
        key: input.key,
        cmac: input.cmac,
        attributes: input.attributes,
      }).returning();
      if (typeof file == "undefined") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create file",
        });
      }

      await tx.update(schema.slots)
        .set({
          fileX25519PublicKey: input.x25519PublicKey,
          fileId: file.id,
        })
        .where(eq(schema.slots.id, slot.id));
    });
  });
