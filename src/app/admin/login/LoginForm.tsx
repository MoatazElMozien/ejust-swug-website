"use client";

import { useActionState } from "react";
import { login } from "../actions/auth";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="mb-1.5 block text-sm">Email</span>
        <input name="email" type="email" autoComplete="email" required className="input" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm">Password</span>
        <input name="password" type="password" autoComplete="current-password" required className="input" />
      </label>
      {state?.error && <p role="alert" className="rounded-md bg-brand-soft px-3 py-2 text-sm text-[#ff8595]">{state.error}</p>}
      <button disabled={pending} className="btn btn-primary w-full py-2.5">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
