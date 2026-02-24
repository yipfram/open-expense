import { InviteManager } from "@/app/admin/invite-manager";
import { requireRole } from "@/src/lib/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireRole(["admin"]);

  return (
    <main className="mx-auto flex w-full max-w-5xl min-w-0 flex-col gap-6 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <p className="break-all text-slate-700">Access granted for {session.user.email}.</p>
      <InviteManager />
    </main>
  );
}
