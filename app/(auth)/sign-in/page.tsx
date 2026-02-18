import Link from "next/link";

import { SignInForm } from "@/app/(auth)/sign-in/form";

export default function SignInPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col px-4 py-10 sm:px-0">
      <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
      <SignInForm />
      <p className="text-sm text-slate-700">
        Need an account?{" "}
        <Link className="font-medium text-slate-900 underline" href="/sign-up">
          Sign up
        </Link>
      </p>
    </main>
  );
}
