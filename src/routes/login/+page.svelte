<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Input } from "$lib/components/ui/input";
  import { globals } from "$lib/globals";
  import { reform } from "$lib/reform";
  import { FormButton, FormControl, FormFieldError, FormLabel } from "$lib/reform/components";
  import { errorMessage } from "$lib/utils/errors";
  import { toast } from "svelte-sonner";
  import { z } from "zod";
  import { login } from "~/features/login";


  const schema = z.object({
    username: z.string(),
    password: z.string(),
  });

  const form = reform({
    schema,
    initialState: {
      username: "",
      password: "",
    },
    onSubmit: async (data) => {
      try {
        const result = await login({
          username: data.username,
          password: data.password,
        });

        globals.keyval?.set("masterKey", result.masterKey);
        window.location.href = "/";
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
          <CardTitle>Login</CardTitle>
          <CardDescription>Log into your account and access your private data.</CardDescription>
        </CardHeader>

        <CardContent class="flex flex-col gap-4">
          <FormControl {form} field="username">
            {#snippet children({ props, error })}
              <FormLabel>Username</FormLabel>
              <Input {...props} bind:value={form.state.username} type="text"/>
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
          <Button href="/register" variant="ghost">
            Register
          </Button>
          <FormButton disabled={form.submitting}>
            Login
          </FormButton>
        </CardFooter>
      </Card>
    </form>
  </div>
</div>
