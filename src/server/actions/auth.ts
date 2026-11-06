"use server";

import { redirect } from "next/navigation";
import { APP_URL, SETUP_MESSAGE, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";
import { getString, invalid, type FormState } from "@/server/form";
import { trackEvent } from "@/server/analytics";
import { allowRequest } from "@/server/rate-limit";

function safeNext(value: string): string {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

function authErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "That email and password do not match. Check them and try again.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirm your email address first. Check your inbox for the link.";
  }
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "An account with that email already exists. Try signing in instead.";
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many attempts. Wait a moment and try again.";
  }
  if (lower.includes("password")) {
    return "That password was not accepted. Use at least 8 characters with a letter and a number.";
  }
  return "We could not complete that request. Please try again.";
}

export async function registerAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    fullName: getString(formData, "fullName"),
    email: getString(formData, "email"),
    password: getString(formData, "password"),
  });
  if (!parsed.success) return invalid(parsed.error);
  if (!isSupabaseConfigured()) return { error: SETUP_MESSAGE };

  if (!(await allowRequest("register", 10, 60 * 60))) {
    return { error: "Too many sign-up attempts from this connection. Try again later." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${APP_URL}/auth/callback?next=/onboarding`,
    },
  });

  if (error) return { error: authErrorMessage(error.message) };

  if (!data.session) {
    return {
      notice:
        "Account created. Check your inbox for the confirmation link, then sign in to finish setting up your business.",
    };
  }

  await trackEvent("owner_registered", null);
  redirect("/onboarding");
}

export async function loginAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: getString(formData, "email"),
    password: getString(formData, "password"),
  });
  if (!parsed.success) return invalid(parsed.error);
  if (!isSupabaseConfigured()) return { error: SETUP_MESSAGE };

  if (!(await allowRequest("login", 20, 10 * 60))) {
    return { error: "Too many sign-in attempts. Wait a few minutes and try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) return { error: authErrorMessage(error.message) };

  redirect(safeNext(getString(formData, "next")));
}

export async function logoutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

export async function requestPasswordResetAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: getString(formData, "email"),
  });
  if (!parsed.success) return invalid(parsed.error);
  if (!isSupabaseConfigured()) return { error: SETUP_MESSAGE };

  if (!(await allowRequest("password-reset", 5, 60 * 60))) {
    return { error: "Too many reset requests. Try again in an hour." };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${APP_URL}/auth/callback?next=/reset-password`,
  });

  // Always the same response so the form cannot be used to discover accounts.
  return {
    notice:
      "If an account exists for that address, we have sent a reset link. Check your inbox and spam folder.",
  };
}

export async function updatePasswordAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: getString(formData, "password"),
  });
  if (!parsed.success) return invalid(parsed.error);
  if (!isSupabaseConfigured()) return { error: SETUP_MESSAGE };

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return {
      error:
        "This reset link has expired. Request a new link from the sign-in page.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) return { error: authErrorMessage(error.message) };

  redirect("/dashboard");
}
