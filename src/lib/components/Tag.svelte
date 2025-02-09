<script lang="ts">
  interface Props {
    adjective: string;
  }

  let { adjective }: Props = $props();
</script>

<div>
  {adjective}
</div>
