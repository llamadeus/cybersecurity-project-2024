import { AuthState } from "$lib/auth/state.svelte";


export const auth = new AuthState();

export function onReady(callback: () => void) {
  auth.ready.then(callback);
}
