import { sign, verify } from "$lib/server/crypto/sign";
import { db, schema } from "$lib/server/db";
import { decodeBase64Url, encodeBase64Url } from "$lib/utils/base64url";
import { randomString } from "$lib/utils/id";
import { utf8ToBytes } from "@noble/ciphers/utils";
import type { RequestEvent } from "@sveltejs/kit";
import { eq, type InferSelectModel } from "drizzle-orm";


const SESSION_ID_LENGTH = 64;

export async function createSession(user: InferSelectModel<typeof schema.users>) {
  const sessionId = randomString(SESSION_ID_LENGTH);
  const signature = sign(utf8ToBytes(sessionId));

  await db.insert(schema.sessions).values({
    userId: user.id,
    sessionId,
  });

  return `${sessionId}.${encodeBase64Url(signature)}`;
}

export async function getSessionFromRequest(event: RequestEvent): Promise<InferSelectModel<typeof schema.sessions> | null> {
  const sid = event.cookies.get("sid") ?? "";
  if (! sid.includes(".")) {
    return null;
  }

  const [message, encodedSignature] = sid.split(".");
  if (typeof message == "undefined" || typeof encodedSignature == "undefined") {
    throw new Error("Invalid session parameter");
  }

  const signature = decodeBase64Url(encodedSignature);
  if (! verify(signature, utf8ToBytes(message))) {
    return null;
  }

  const session = await db.query.sessions.findFirst({
    where: eq(schema.sessions.sessionId, message),
  });

  return session ?? null;
}

export async function getSessionUser(session: InferSelectModel<typeof schema.sessions> | null): Promise<InferSelectModel<typeof schema.users> | null> {
  if (session === null) {
    return null;
  }

  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, session.userId),
  });

  return user ?? null;
}
