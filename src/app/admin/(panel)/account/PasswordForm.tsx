"use client";

import { useActionState } from "react";
import { changeOwnPassword } from "@/app/admin/actions/auth";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changeOwnPassword, undefined);
  return (
    <form action={action} className="mt-4 space-y-4" key={state?.ok}>
      <label className="block text-sm">
        Current password
        <input name="current" type="password" autoComplete="current-password" className="input mt-1.5" required />
      </label>
      <label className="block text-sm">
        New password
        <input name="next" type="password" autoComplete="new-password" minLength={8} className="input mt-1.5" required />
      </label>
      <label className="block text-sm">
        Confirm new password
        <input name="confirm" type="password" autoComplete="new-password" minLength={8} className="input mt-1.5" required />
      </label>
      <div className="flex items-center gap-3">
        <button className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Update password"}</button>
        {state?.error && <p className="text-sm text-[#ff8595]">{state.error}</p>}
        {state?.ok && <p className="text-sm text-ok">{state.ok}</p>}
      </div>
    </form>
  );
}
