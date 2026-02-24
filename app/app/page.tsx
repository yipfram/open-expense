import { redirect } from "next/navigation";

import { FinanceInbox } from "@/app/finance/finance-inbox";
import { ExpenseManager } from "@/app/member/expense-manager";
import { getUserRoles } from "@/src/lib/roles";
import { requireSession } from "@/src/lib/session";
import { canAccessWorkspaceView, getDefaultWorkspaceView, parseWorkspaceView } from "@/src/lib/workspace";

type WorkspacePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WorkspacePage({ searchParams }: WorkspacePageProps) {
  const session = await requireSession();
  const roles = await getUserRoles(session.user);
  const isAdmin = roles.includes("admin");
  const params = searchParams ? await searchParams : undefined;
  const requestedView = getSingleParam(params?.view);
  const parsedView = parseWorkspaceView(requestedView);
  const defaultView = getDefaultWorkspaceView(roles);
  const activeView = parsedView ?? defaultView;

  if (!canAccessWorkspaceView(activeView, roles)) {
    redirect("/forbidden");
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6 px-3 py-10 sm:px-4 md:px-6">
      {activeView === "member" ? (
        <ExpenseManager userEmail={session.user.email} userName={session.user.name} isAdmin={isAdmin} />
      ) : (
        <FinanceInbox userEmail={session.user.email} />
      )}
    </main>
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
