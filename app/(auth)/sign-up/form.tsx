"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getPasswordPolicyLabel, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from "@/src/lib/password-policy";

type SignUpState = {
  error?: string;
  requestId?: string;
  code?: string;
  upstreamStatus?: number;
};

type SignUpFormProps = {
  requireInvite: boolean;
};

export function SignUpForm({ requireInvite }: SignUpFormProps) {
  const router = useRouter();
  const [state, setState] = useState<SignUpState>({});
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setState({});

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const inviteCode = String(formData.get("inviteCode") ?? "").trim();

    try {
      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ name, email, password, inviteCode }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as SignUpState;
        setState({
          error: data.error ?? "Unable to create account right now.",
          requestId: data.requestId,
          code: data.code,
          upstreamStatus: data.upstreamStatus,
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
      <label className="text-sm font-medium text-slate-700" htmlFor="name">
        Name
      </label>
      <input
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-slate-300 focus:ring-2"
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
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-slate-300 focus:ring-2"
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
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-slate-300 focus:ring-2"
        id="password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={PASSWORD_MIN_LENGTH}
        maxLength={PASSWORD_MAX_LENGTH}
        required
      />
      <p className="text-xs text-slate-600">{getPasswordPolicyLabel()}</p>

      {requireInvite ? (
        <>
          <label className="text-sm font-medium text-slate-700" htmlFor="inviteCode">
            Invite code
          </label>
          <input
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-slate-300 focus:ring-2"
            id="inviteCode"
            name="inviteCode"
            type="text"
          />
        </>
      ) : null}

      {state.error ? (
        <p className="text-sm text-rose-700">
          {state.error}
          {state.code ? <span className="block break-all text-xs text-rose-600">Code: {state.code}</span> : null}
          {typeof state.upstreamStatus === "number" ? (
            <span className="block text-xs text-rose-600">Auth status: {state.upstreamStatus}</span>
          ) : null}
          {state.requestId ? <span className="block break-all text-xs text-rose-600">Ref: {state.requestId}</span> : null}
        </p>
      ) : null}
      <button
        className="mt-1 w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70 sm:w-fit"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
