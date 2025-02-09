import { decrypt } from "$lib/server/crypto/encrypt";
import { db, schema } from "$lib/server/db";
import { getSessionFromRequest, getSessionUser } from "$lib/server/session";
import type { SlotUploadTicket } from "$lib/server/types";
import { bytesToUtf8 } from "@noble/ciphers/utils";
import { error, json } from "@sveltejs/kit";
import { eq, type InferSelectModel, sql } from "drizzle-orm";
import type { RequestHandler } from "./$types";


const NONCE_LENGTH = 24;
const AUTH_TAG_LENGTH = 16;
const OVERHEAD = NONCE_LENGTH + AUTH_TAG_LENGTH;

export const POST: RequestHandler = async (event) => {
  if (event.request.headers.get("x-application") !== "sveltekit") {
    return new Response("Forbidden", { status: 403 });
  }

  const data = await event.request.formData();
  let userId: string;
  let vaultSlot: InferSelectModel<typeof schema.slots> | undefined;

  if (data.has("ticket")) {
    const raw = data.get("ticket");
    if (raw === null || typeof raw == "string") {
      return error(422, "Invalid ticket");
    }

    const buffer = Buffer.from(await raw.arrayBuffer());
    const decrypted = decrypt(buffer);
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

    userId = slot.vault.userId;
    vaultSlot = slot;
  }
  else {
    const session = await getSessionFromRequest(event);
    const user = await getSessionUser(session);
    if (user === null) {
      return new Response("Unauthorized", { status: 401 });
    }

    userId = user.id;
  }

  const blob = data.get("blob");
  if (blob === null) {
    return error(422, "Missing blob");
  }

  if (typeof blob == "string") {
    return error(422, "Invalid blob");
  }

  const buffer = Buffer.from(await blob.arrayBuffer());

  const [usage = { usage: 0 }] = await db
    .select({ usage: sql<number>`sum(length(${schema.chunks.blob}) - ${OVERHEAD})` })
    .from(schema.chunks)
    .where(eq(schema.chunks.userId, userId))
    .groupBy(schema.chunks.userId);
  const newUsage = usage.usage + (buffer.length - OVERHEAD);

  if (newUsage > 1000 * 1000 * 1000) {
    return error(422, "Quota exceeded");
  }

  if (typeof vaultSlot != "undefined" && vaultSlot.maxSize > 0) {
    const [slotUsage = { usage: 0 }] = await db
      .select({ usage: sql<number>`sum(length(${schema.chunks.blob}) - ${OVERHEAD})` })
      .from(schema.chunks)
      .innerJoin(schema.slotChunks, eq(schema.slotChunks.chunkId, schema.chunks.id))
      .where(eq(schema.slotChunks.slotId, vaultSlot.id))
      .groupBy(schema.slotChunks.slotId);
    const newUsage = slotUsage.usage + (buffer.length - OVERHEAD);

    if (newUsage > vaultSlot.maxSize) {
      return error(422, "Slot is full");
    }
  }

  const chunk = await db.transaction(async (tx) => {
    const [chunk] = await tx.insert(schema.chunks).values({
      userId,
      blob: buffer,
    }).returning();
    if (typeof chunk == "undefined") {
      throw new Error("Failed to persist chunk");
    }

    // Create slot-chunk relation
    if (typeof vaultSlot != "undefined") {
      await tx.insert(schema.slotChunks).values({
        slotId: vaultSlot.id,
        chunkId: chunk.id,
      });
    }

    return chunk;
  });

  return json({
    id: chunk.id,
  });
};
