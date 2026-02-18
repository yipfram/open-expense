"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type SignInState = {
  error?: string;
  requestId?: string;
};

export function SignInForm() {
  const router = useRouter();
  const [state, setState] = useState<SignInState>({});
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setState({});

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as SignInState;
        setState({
          error: data.error ?? "Unable to sign in right now.",
          requestId: data.requestId,
        });
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setState({ error: "Network error. Please retry." });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
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
