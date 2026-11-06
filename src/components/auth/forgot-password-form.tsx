"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordResetAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import type { FormState } from "@/server/form";

const initialState: FormState = {};

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-strong">
        Account recovery
      </p>
      <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-navy">
        Reset your password
      </h1>
      <p className="mt-2 text-[13.5px] leading-6 text-muted">
        Enter the email you signed up with and we’ll send a secure reset link.
      </p>

      {state.error ? (
        <Alert variant="error" className="mt-5">
          {state.error}
        </Alert>
      ) : null}
      {state.notice ? (
        <Alert variant="success" className="mt-5">
          {state.notice}
        </Alert>
      ) : null}

      <form action={action} className="mt-6 space-y-4" noValidate>
        <Field
          label="Email address"
          htmlFor="email"
          error={state.fieldErrors?.email}
        >
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            required
            aria-invalid={Boolean(state.fieldErrors?.email)}
          />
        </Field>

        <Button type="submit" size="lg" className="w-full" loading={pending}>
          Send reset link
        </Button>
      </form>

      <p className="mt-7 text-center text-[13px] text-muted">
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-semibold text-accent-strong hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
