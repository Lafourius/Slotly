"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { registerAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Alert } from "@/components/ui/alert";
import type { FormState } from "@/server/form";

const initialState: FormState = {};

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initialState);

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-strong">
        Free pilot account
      </p>
      <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-navy">
        Create your account
      </h1>
      <p className="mt-2 text-[13.5px] leading-6 text-muted">
        Set up your business in a few minutes. No card required.
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
          label="Full name"
          htmlFor="fullName"
          error={state.fieldErrors?.fullName}
        >
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            placeholder="e.g. Ananya Sharma"
            required
            aria-invalid={Boolean(state.fieldErrors?.fullName)}
          />
        </Field>

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

        <Field
          label="Password"
          htmlFor="password"
          hint="At least 8 characters, with a letter and a number."
          error={state.fieldErrors?.password}
        >
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="Create a password"
            required
            aria-invalid={Boolean(state.fieldErrors?.password)}
          />
        </Field>

        <Button type="submit" size="lg" className="w-full" loading={pending}>
          Create account
          {!pending ? <ArrowRight aria-hidden="true" /> : null}
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-accent-strong hover:underline"
        >
          Sign in
        </Link>
      </p>

      <p className="mt-6 border-t border-line pt-5 text-center text-[11.5px] leading-5 text-muted">
        By creating an account you agree to use Slotly responsibly and only
        collect customer details you need.
      </p>
    </div>
  );
}
