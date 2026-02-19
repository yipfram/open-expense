import { redirect } from "next/navigation";

import { ExpenseManager } from "@/app/member/expense-manager";
import { WORKSPACE_PATH } from "@/src/lib/routes";
import { getUserRoles } from "@/src/lib/roles";
import { requireSession } from "@/src/lib/session";
import { canAccessWorkspaceView, getDefaultWorkspaceView, parseWorkspaceView } from "@/src/lib/workspace";

type WorkspacePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WorkspacePage({ searchParams }: WorkspacePageProps) {
  const session = await requireSession();
  const roles = await getUserRoles(session.user);
  const params = searchParams ? await searchParams : undefined;
  const requestedView = getSingleParam(params?.view);
  const parsedView = parseWorkspaceView(requestedView);
  const defaultView = getDefaultWorkspaceView(roles);

  if (requestedView && !parsedView) {
    redirect(`${WORKSPACE_PATH}?view=${defaultView}`);
  }

  const activeView = parsedView ?? defaultView;

  if (!canAccessWorkspaceView(activeView, roles)) {
    redirect("/forbidden");
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl min-w-0 flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-tight">Workspace</h1>
        <p className="break-all text-slate-700">Welcome {session.user.email}.</p>
      </header>

      {activeView === "member" ? <ExpenseManager /> : <FinanceWorkspace />}
    </main>
  );
}

function FinanceWorkspace() {
  return (
    <section className="w-full min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold tracking-tight">Process expenses</h2>
      <p className="mt-2 text-slate-700">Finance inbox UI is being finalized for Milestone 3.</p>
    </section>
  );
}

function getSingleParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0];
  }

  return undefined;
}
