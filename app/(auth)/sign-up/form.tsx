"use client";

import { useActionState } from "react";

import { signUpAction } from "@/app/(auth)/sign-up/actions";

type SignUpState = {
  error?: string;
  requestId?: string;
};

const initialState: SignUpState = {};

type SignUpFormProps = {
  requireInvite: boolean;
};

export function SignUpForm({ requireInvite }: SignUpFormProps) {
  const [state, action, isPending] = useActionState<SignUpState, FormData>(signUpAction, initialState);

  return (
    <form action={action} className="mt-4 grid gap-3">
      <label className="text-sm font-medium text-slate-700" htmlFor="name">
        Name
      </label>
      <input
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-slate-300 focus:ring-2"
        id="name"
        name="name"
        type="text"
        autoComplete="name"
        required
      />

      <label className="text-sm font-medium text-slate-700" htmlFor="email">
        Email
      </label>
      <input
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-slate-300 focus:ring-2"
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />

      <label className="text-sm font-medium text-slate-700" htmlFor="password">
        Password
      </label>
      <input
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-slate-300 focus:ring-2"
        id="password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
      />

      {requireInvite ? (
        <>
          <label className="text-sm font-medium text-slate-700" htmlFor="inviteCode">
            Invite code
          </label>
          <input
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-slate-300 focus:ring-2"
            id="inviteCode"
            name="inviteCode"
            type="text"
            required
          />
        </>
      ) : null}

      {state.error ? (
        <p className="text-sm text-rose-700">
          {state.error}
          {state.requestId ? <span className="block text-xs text-rose-600">Ref: {state.requestId}</span> : null}
        </p>
      ) : null}
      <button
        className="mt-1 w-fit rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
