import { requireRole } from "@/src/lib/session";

export default async function AdminPage() {
  const session = await requireRole(["admin"]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Admin Area</h1>
      <p className="text-slate-700">Access granted for {session.user.email}.</p>
    </main>
  );
}
