<script lang="ts">
  import { page } from "$app/stores";
  import { type Snippet } from "svelte";


  interface Props {
    children: Snippet;
  }

  const { children }: Props = $props();
  const tab = $derived.by(() => {
    switch ($page.url.pathname) {
    case "/":
      return "home";
    case "/vaults":
      return "vaults";
    default:
      return "home";
    }
  });
</script>

<div class="flex flex-1 flex-col py-12 gap-6">
  <div class="w-[48rem] mx-auto">
    <div class="bg-muted text-muted-foreground inline-flex h-10 items-center justify-center rounded-md">
      <a
        href="/"
        class="ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm"
        data-state={tab === "home" ? "active" : undefined}
      >
        Private Storage
      </a>
      <a
        href="/vaults"
        class="ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm"
        data-state={tab === "vaults" ? "active" : undefined}
      >
        Public Vaults
      </a>
    </div>
  </div>

  {@render children()}
</div>
