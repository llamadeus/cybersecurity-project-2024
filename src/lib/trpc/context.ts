import { getSessionFromRequest, getSessionUser } from "$lib/server/session";
import type { RequestEvent } from "@sveltejs/kit";


async function getAuth(event: RequestEvent) {
  const session = await getSessionFromRequest(event);
  const user = await getSessionUser(session);
  if (user === null) {
    event.cookies.delete("sid", { path: "/" });
    return null;
  }

  return {
    user,
  };
}

export async function createContext(event: RequestEvent) {
  return {
    event,
    auth: await getAuth(event),
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
