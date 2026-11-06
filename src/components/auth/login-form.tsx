"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { loginAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Alert } from "@/components/ui/alert";
import type { FormState } from "@/server/form";

const initialState: FormState = {};

export function LoginForm({
  next,
  initialError,
}: {
  next: string;
  initialError?: string;
}) {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-strong">
        Business sign in
      </p>
      <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-navy">
        Welcome back
      </h1>
      <p className="mt-2 text-[13.5px] leading-6 text-muted">
        Sign in to see today’s appointments and manage your availability.
      </p>

      {initialError ? (
        <Alert variant="error" className="mt-5">
          {initialError}
        </Alert>
      ) : null}
      {state.error ? (
        <Alert variant="error" className="mt-5">
          {state.error}
        </Alert>
      ) : null}
      {state.notice ? (
        <Alert variant="info" className="mt-5">
          {state.notice}
        </Alert>
      ) : null}

      <form action={action} className="mt-6 space-y-4" noValidate>
        <input type="hidden" name="next" value={next} />
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
            aria-describedby={
              state.fieldErrors?.email ? "email-error" : undefined
            }
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          error={state.fieldErrors?.password}
        >
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="Your password"
            required
            aria-invalid={Boolean(state.fieldErrors?.password)}
            aria-describedby={
              state.fieldErrors?.password ? "password-error" : undefined
            }
          />
        </Field>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-[12.5px] font-semibold text-accent-strong hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" className="w-full" loading={pending}>
          Sign in
          {!pending ? <ArrowRight aria-hidden="true" /> : null}
        </Button>
      </form>

      <p className="mt-7 text-center text-[13px] text-muted">
        New to Slotly?{" "}
        <Link
          href="/register"
          className="font-semibold text-accent-strong hover:underline"
        >
          Create a free account
        </Link>
      </p>
    </div>
  );
}
