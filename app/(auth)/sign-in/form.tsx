"use client";

import { useActionState } from "react";

import { signInAction } from "@/app/(auth)/sign-in/actions";

type SignInState = {
  error?: string;
  requestId?: string;
};

const initialState: SignInState = {};

export function SignInForm() {
  const [state, action, isPending] = useActionState<SignInState, FormData>(signInAction, initialState);

  return (
    <form action={action} className="mt-4 grid gap-3">
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
        autoComplete="current-password"
        required
      />

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
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
