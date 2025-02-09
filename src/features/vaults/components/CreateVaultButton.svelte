<script lang="ts">
  import { auth } from "$lib/auth";
  import { Alert, AlertDescription, AlertTitle } from "$lib/components/ui/alert";
  import { Button } from "$lib/components/ui/button";
  import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
  } from "$lib/components/ui/dialog";
  import { DialogBody, DialogFooter } from "$lib/components/ui/dialog/index.js";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { reform } from "$lib/reform";
  import { FormButton, FormControl, FormFieldError, FormLabel } from "$lib/reform/components";
  import { errorMessage } from "$lib/utils/errors";
  import { parseFileSize } from "$lib/utils/format";
  import { Info, Trash } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { z } from "zod";
  import { createVault } from "~/features/vaults/create";


  interface Props {
    onRefetch: () => void;
  }

  const props: Props = $props();

  let open = $state(false);

  const schema = z.object({
    name: z.string().max(255, "The vault name cannot be longer than 255 characters"),
    slots: z.array(z.object({
      name: z.string().max(255, "The slot name cannot be longer than 255 characters"),
      maxSize: z.string().regex(/^\d+(?:\.\d+)?\s*(kb|mb|gb)$/i, "Invalid size format"),
    })),
  });

  const form = reform({
    schema,
    initialState: {
      name: `Vault ${Math.random().toString(36).slice(2)}`,
      slots: [{ name: "", maxSize: "10 MB" }],
    },
    onSubmit: async (data) => {
      if (auth.state === null) {
        throw new Error("Not authenticated");
      }

      if (data.slots.length === 0) {
        throw new Error("At least one slot is required");
      }

      try {
        await createVault(auth.state.masterKey, {
          name: data.name,
          slots: data.slots.map((slot, i) => ({
            name: slot.name.trim().length > 0 ? slot.name : `Slot ${i + 1}`,
            maxSize: slot.maxSize.trim().length > 0 ? parseFileSize(slot.maxSize) : 0,
          })),
        });

        open = false;
        props.onRefetch();
        toast.success("Vault created");
      }
      catch (error) {
        toast.error(errorMessage(error));
      }
    },
  });
</script>

<Button size="sm" onclick={() => open = true}>
  Create public vault
</Button>
<Dialog open={open} onOpenChange={value => open = value}>
  <DialogContent class="max-h-[calc(100vh_-_2rem)] overflow-auto" interactOutsideBehavior="ignore">
    <form class="contents" {...form.props}>
      <DialogHeader>
        <DialogTitle>Create a new public vault</DialogTitle>
        <DialogDescription>
          <div>
            Public vaults can be shared with other people. This will allow them to upload files into your vaults.
            <b>Vaults cannot be modified after creation.</b>
          </div>

          <Alert class="mt-4">
            <Info class="size-4"/>
            <AlertTitle>Read-only!</AlertTitle>
            <AlertDescription>
              You are the only person who will be able to view files uploaded into this vault.
            </AlertDescription>
          </Alert>
        </DialogDescription>
      </DialogHeader>

      <DialogBody class="flex flex-col gap-4">
        <FormControl {form} field="name">
          {#snippet children({ props })}
            <FormLabel>Vault name</FormLabel>
            <Input {...props} bind:value={form.state.name}/>
            <FormFieldError/>
          {/snippet}
        </FormControl>

        {#each form.state.slots as slot, i}
          <div class="flex flex-col gap-2">
            <h3 class="text-md font-medium text-muted-foreground">Slot {i + 1}</h3>

            <div class="flex gap-6">
              <div class="flex flex-1 items-center gap-2">
                <Label>Name</Label>
                <Input bind:value={slot.name} placeholder={`Slot ${i + 1}`}/>
              </div>
              <div class="flex items-center gap-2">
                <Label>Max size</Label>
                <Input bind:value={slot.maxSize} class="w-24" placeholder="Unlimited"/>
              </div>
              <div class="flex items-center">
                <Button variant="outline" class="w-8 h-8" onclick={() => form.state.slots.splice(i, 1)}>
                  <Trash/>
                </Button>
              </div>
            </div>
          </div>
        {/each}

        <div class="flex justify-end">
          <Button variant="outline" onclick={() => form.state.slots.push({ name: "", maxSize: "10 MB" })}>
            Add slot
          </Button>
        </div>

        <FormControl {form} field="slots">
          <FormFieldError/>
        </FormControl>
      </DialogBody>

      <DialogFooter>
        <DialogClose>
          {#snippet child({ props })}
            <Button variant="ghost" {...props}>
              Cancel
            </Button>
          {/snippet}
        </DialogClose>
        <FormButton disabled={form.submitting}>
          Create
        </FormButton>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
