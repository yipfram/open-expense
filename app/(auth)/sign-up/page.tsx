import Link from "next/link";

import { SignUpForm } from "@/app/(auth)/sign-up/form";
import { getSignupMode } from "@/src/lib/env";

export default function SignUpPage() {
  const signupMode = getSignupMode();
  const requireInvite = signupMode === "invite_only";

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-1 px-4 py-10 sm:px-0">
      <h1 className="text-3xl font-semibold tracking-tight">Sign up</h1>
      {requireInvite ? <p className="text-sm text-slate-700">Invite-only mode is enabled.</p> : null}
      <SignUpForm requireInvite={requireInvite} />
      <p className="text-sm text-slate-700">
        Already have an account?{" "}
        <Link className="font-medium text-slate-900 underline" href="/sign-in">
          Sign in
        </Link>
      </p>
    </main>
  );
}
