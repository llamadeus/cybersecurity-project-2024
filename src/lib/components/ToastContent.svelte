<script lang="ts">
  import { type Readable } from "svelte/store";


  interface Props {
    message: Readable<string>;
  }

  const { message }: Props = $props();
</script>

{$message}
