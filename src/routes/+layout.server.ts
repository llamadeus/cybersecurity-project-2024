import { createContext } from "$lib/trpc/context";
import { createCaller } from "$lib/trpc/router";
import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";


const GUEST_ROUTES = new Set([
  "/register",
  "/login",
]);

export const load: LayoutServerLoad = async (event) => {
  const ctx = await createContext(event);
  const result = await createCaller(ctx).auth();
  const url = new URL(event.request.url);
  const loggedIn = result !== null;

  if (loggedIn) {
    if (GUEST_ROUTES.has(url.pathname)) {
      return redirect(307, "/");
    }
  }
  else {
    if (! GUEST_ROUTES.has(url.pathname) && ! url.pathname.startsWith("/v/")) {
      return redirect(307, "/login");
    }
  }

  return {
    session: result,
  };
};
