import { db, schema } from "$lib/server/db";
import { getSessionFromRequest, getSessionUser } from "$lib/server/session";
import { error } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";


export const GET: RequestHandler = async (event) => {
  const session = await getSessionFromRequest(event);
  const user = await getSessionUser(session);
  if (user === null) {
    return new Response("Unauthorized", { status: 401 });
  }

  const chunk = await db.query.chunks.findFirst({
    where: and(
      eq(schema.chunks.id, event.params.id),
      eq(schema.chunks.userId, user.id),
    ),
  });
  if (typeof chunk == "undefined") {
    return error(404, "Chunk not found");
  }

  return new Response(chunk.blob as Uint8Array, {
    headers: {
      "Content-Type": "application/octet-stream",
    },
  });
};
