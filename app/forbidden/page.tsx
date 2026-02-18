import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Forbidden</h1>
      <p className="text-slate-700">You do not have permission to access this page.</p>
      <p className="text-sm">
        <Link className="font-medium text-slate-900 underline" href="/">
          Go back home
        </Link>
      </p>
    </main>
  );
}
