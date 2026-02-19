import { requireRole } from "@/src/lib/session";
import { ExpenseManager } from "@/app/member/expense-manager";

export default async function MemberPage() {
  const session = await requireRole(["member", "manager", "finance", "admin"]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Member Area</h1>
      <p className="text-slate-700">Welcome {session.user.email}.</p>
      <ExpenseManager />
    </main>
  );
}
