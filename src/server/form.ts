import type { ZodError } from "zod";

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  notice?: string;
  success?: boolean;
}

export function zodFieldErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export function invalid(error: ZodError): FormState {
  return { error: "Check the highlighted fields.", fieldErrors: zodFieldErrors(error) };
}

export function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function getBoolean(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}
