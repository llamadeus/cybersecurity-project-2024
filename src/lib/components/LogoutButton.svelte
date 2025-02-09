<script lang="ts">
  import { page } from "$app/stores";
  import { Button } from "$lib/components/ui/button";
  import { globals } from "$lib/globals";
  import { trpc } from "$lib/trpc/client";


  interface Props {
    class?: string;
  }

  const { class: className }: Props = $props();

  async function handleLogout() {
    try {
      globals.keyval?.delete("masterKey");

      await trpc($page).logout.mutate();
      window.location.reload();
    }
    catch (error) {
      console.error(error);
    }
  }
</script>

<Button onclick={handleLogout} class={className}>Logout</Button>
