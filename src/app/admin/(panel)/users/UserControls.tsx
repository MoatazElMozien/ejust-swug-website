"use client";

import { useActionState, useState, useTransition } from "react";
import { KeyRound, Trash2 } from "lucide-react";
import { createUser, deleteUser, resetPassword, updateUser } from "@/app/admin/actions/settings";

type U = { id: number; name: string; email: string; role: "SUPER_ADMIN" | "EDITOR"; active: boolean };

export function UserRow({ user, isMe }: { user: U; isMe: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null);
  const run = (fn: () => Promise<{ ok?: string; error?: string }>) =>
    start(async () => setMsg(await fn()));

  return (
    <li className="p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            {user.name} {isMe && <span className="text-xs text-faint">(you)</span>}
          </p>
          <p className="truncate text-sm text-muted">{user.email}</p>
        </div>
        {!user.active && <span className="rounded-full bg-panel-2 px-2 py-0.5 text-xs text-faint">Deactivated</span>}
        <select
          className="input w-auto py-1.5 text-sm"
          value={user.role}
          disabled={isMe || pending}
          onChange={(e) => run(() => updateUser(user.id, { role: e.target.value as U["role"] }))}
          aria-label="Role"
        >
          <option value="EDITOR">Editor</option>
          <option value="SUPER_ADMIN">Super admin</option>
        </select>
        {!isMe && (
          <>
            <button className="btn btn-ghost py-1.5" disabled={pending} onClick={() => run(() => updateUser(user.id, { active: !user.active }))}>
              {user.active ? "Deactivate" : "Reactivate"}
            </button>
            <button
              className="btn btn-ghost py-1.5"
              disabled={pending}
              title="Reset password"
              onClick={() => {
                const pw = prompt(`New password for ${user.email} (min 8 characters):`);
                if (pw) run(() => resetPassword(user.id, pw));
              }}
            >
              <KeyRound className="size-4" />
            </button>
            <button
              className="btn btn-danger py-1.5"
              disabled={pending}
              title="Delete account"
              onClick={() => confirm(`Delete ${user.email}? Their projects will be kept.`) && run(() => deleteUser(user.id))}
            >
              <Trash2 className="size-4" />
            </button>
          </>
        )}
      </div>
      {msg?.error && <p className="mt-2 text-sm text-[#ff8595]">{msg.error}</p>}
      {msg?.ok && <p className="mt-2 text-sm text-ok">{msg.ok}</p>}
    </li>
  );
}

export function CreateUserForm() {
  const [state, action, pending] = useActionState(createUser, undefined);
  return (
    <form action={action} className="mt-5 grid gap-4 sm:grid-cols-2" key={state?.ok}>
      <label className="block text-sm">
        Full name
        <input name="name" className="input mt-1.5" required />
      </label>
      <label className="block text-sm">
        Email
        <input name="email" type="email" className="input mt-1.5" required />
      </label>
      <label className="block text-sm">
        Temporary password
        <input name="password" type="text" minLength={8} className="input mt-1.5" required autoComplete="off" />
      </label>
      <label className="block text-sm">
        Role
        <select name="role" className="input mt-1.5" defaultValue="EDITOR">
          <option value="EDITOR">Editor — submits projects for review</option>
          <option value="SUPER_ADMIN">Super admin — full access</option>
        </select>
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button className="btn btn-primary" disabled={pending}>{pending ? "Creating…" : "Create account"}</button>
        {state?.error && <p className="text-sm text-[#ff8595]">{state.error}</p>}
        {state?.ok && <p className="text-sm text-ok">{state.ok}</p>}
      </div>
    </form>
  );
}
