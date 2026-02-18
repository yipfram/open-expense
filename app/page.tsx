import Link from "next/link";

import { signOutAction } from "@/app/actions";
import { getUserRoles } from "@/src/lib/roles";
import { getSessionSafe } from "@/src/lib/session";

export default async function HomePage() {
  const session = await getSessionSafe();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Open-expense V1</h1>
      {session ? (
        <>
          {/*
            Role resolution is async because role assignments are persisted in DB.
          */}
          <p className="text-slate-700">Signed in as {session.user.email}</p>
          <p className="text-slate-700">Roles: {(await getUserRoles(session.user)).join(", ")}</p>
          <nav>
            <ul className="flex flex-wrap gap-3">
              <li>
                <Link className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" href="/member">
                  Member area
                </Link>
              </li>
              <li>
                <Link className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" href="/finance">
                  Finance area
                </Link>
              </li>
              <li>
                <Link className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" href="/admin">
                  Admin area
                </Link>
              </li>
            </ul>
          </nav>
          <form action={signOutAction}>
            <button
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </>
      ) : (
        <nav>
          <ul className="flex flex-wrap gap-3">
            <li>
              <Link className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" href="/sign-in">
                Sign in
              </Link>
            </li>
            <li>
              <Link className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" href="/sign-up">
                Sign up
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </main>
  );
}
