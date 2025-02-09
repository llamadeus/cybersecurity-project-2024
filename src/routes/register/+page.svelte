<script lang="ts">
  import { goto } from "$app/navigation";
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Input } from "$lib/components/ui/input";
  import { reform } from "$lib/reform";
  import { FormButton, FormControl, FormFieldError, FormLabel } from "$lib/reform/components";
  import { errorMessage } from "$lib/utils/errors";
  import { toast } from "svelte-sonner";
  import { z } from "zod";
  import { createAccount } from "~/features/register";


  const schema = z.object({
    username: z.string()
      .min(3, "Your username must be at least 3 characters")
      .max(40, "Your username cannot be longer than 40 characters"),
    password: z.string().min(8, "Your password must be at least 8 characters"),
  });

  const form = reform({
    schema,
    initialState: {
      username: "",
      password: "",
    },
    onSubmit: async (data) => {
      try {
        await createAccount(data);

        await goto("/login");
        toast.success("Successfully registered");
      }
      catch (error) {
        toast.error(errorMessage(error));
      }
    },
  });

  $effect(() => {
    form.state.username = form.state.username.trim();
  });
</script>

<div class="flex-1">
  <div class="w-[28rem] mx-auto py-12">
    <form {...form.props}>
      <Card>
        <CardHeader>
          <CardTitle>Register</CardTitle>
          <CardDescription>Register your account and start protecting your privacy.</CardDescription>
        </CardHeader>

        <CardContent class="flex flex-col gap-4">
          <FormControl {form} field="username">
            {#snippet children({ props, error })}
              <FormLabel>Username</FormLabel>
              <Input {...props} bind:value={form.state.username} type="text"/>

              {#if ! error}
                <p class="text-muted-foreground text-xs">
                  Your username <b>cannot</b> be changed later.
                </p>
              {/if}
              <FormFieldError/>
            {/snippet}
          </FormControl>

          <FormControl {form} field="password">
            {#snippet children({ props })}
              <FormLabel>Password</FormLabel>
              <Input {...props} bind:value={form.state.password} type="password"/>
              <FormFieldError/>
            {/snippet}
          </FormControl>
        </CardContent>

        <CardFooter class="flex justify-end gap-2">
          <Button href="/login" variant="ghost">
            Login
          </Button>
          <FormButton disabled={form.submitting}>
            Register
          </FormButton>
        </CardFooter>
      </Card>
    </form>
  </div>
</div>
