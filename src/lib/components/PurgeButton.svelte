<script lang="ts">
  import { page } from "$app/stores";
  import { Button } from "$lib/components/ui/button";
  import { trpc } from "$lib/trpc/client";


  interface Props {
    onRefetch?: () => void;
  }

  const { onRefetch }: Props = $props();

  async function handlePurge() {
    if (! confirm("Do you really want to purge all data?")) {
      return;
    }

    if (! confirm("Are you really sure? This action cannot be undone.")) {
      return;
    }

    try {
      await trpc($page).cleanStorage.mutate();

      onRefetch?.();
    }
    catch (error) {
      console.error(error);
    }
  }
</script>

<Button variant="destructive" onclick={handlePurge}>Purge storage</Button>
