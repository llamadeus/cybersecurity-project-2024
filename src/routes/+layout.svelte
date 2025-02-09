<script lang="ts">
  import { page } from "$app/stores";
  import "~/style/app.css";
  import { auth } from "$lib/auth";
  import { Toaster } from "$lib/components/ui/sonner";
  import { globals } from "$lib/globals";
  import { trpc } from "$lib/trpc/client";
  import { decrypt } from "$lib/tulip";
  import { decodeBase64Url } from "$lib/utils/base64url";
  import { type Snippet } from "svelte";
  import type { LayoutServerData } from "./$types";


  interface Props {
    children: Snippet;
    data: LayoutServerData;
  }

  const { data, children }: Props = $props();

  globals.keyval?.get<Uint8Array>("masterKey")?.then((masterKey) => {
    if (data.session !== null && masterKey !== null) {
      if (data.session.x25519PrivateKey === null || data.session.x25519PublicKey === null) {
        trpc($page).logout.mutate().then(() => {
          globals.keyval?.delete("masterKey");
          window.location.reload();
        });

        return;
      }

      const [decryptedX25519PrivateKey] = decrypt(masterKey, decodeBase64Url(data.session.x25519PrivateKey));

      auth.setLogin({
        username: data.session.u,
        masterKey,
        x25519PrivateKey: decryptedX25519PrivateKey,
        x25519PublicKey: decodeBase64Url(data.session.x25519PublicKey),
      });
    }

    auth.setReady();
  });
</script>

{@render children()}
<Toaster/>
