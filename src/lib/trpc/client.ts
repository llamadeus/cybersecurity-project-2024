import type { Router } from "$lib/trpc/router";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { createTRPCClient, type TRPCClientInit } from "trpc-sveltekit";


export type TrpcClient = ReturnType<typeof createTRPCClient<Router>>;
export type RouterInput = inferRouterInputs<Router>;
export type RouterOutput = inferRouterOutputs<Router>;

let browserClient: TrpcClient;

export function trpc(init?: TRPCClientInit) {
  const isBrowser = typeof window !== "undefined";
  if (isBrowser && browserClient) {
    return browserClient;
  }

  const client = createTRPCClient<Router>({ init });
  if (isBrowser) {
    browserClient = client;
  }

  return client;
}
