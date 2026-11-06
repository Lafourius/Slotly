"use client";

import { useActionState } from "react";
import { updatePasswordAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Alert } from "@/components/ui/alert";
import type { FormState } from "@/server/form";

const initialState: FormState = {};

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(
    updatePasswordAction,
    initialState,
  );

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-strong">
        Account recovery
      </p>
      <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-navy">
        Choose a new password
      </h1>
      <p className="mt-2 text-[13.5px] leading-6 text-muted">
        Pick something you don’t use elsewhere. You’ll stay signed in after
        saving.
      </p>

      {state.error ? (
        <Alert variant="error" className="mt-5">
          {state.error}
        </Alert>
      ) : null}

      <form action={action} className="mt-6 space-y-4" noValidate>
        <Field
          label="New password"
          htmlFor="password"
          hint="At least 8 characters, with a letter and a number."
          error={state.fieldErrors?.password}
        >
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="New password"
            required
            aria-invalid={Boolean(state.fieldErrors?.password)}
          />
        </Field>

        <Button type="submit" size="lg" className="w-full" loading={pending}>
          Save new password
        </Button>
      </form>
    </div>
  );
}
