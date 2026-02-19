import type { WorkspaceView } from "@/src/lib/workspace";

export type WorkspaceNavItem = {
  key: "submit" | "process" | "settings" | "signout";
  label: string;
  href?: string;
  active?: boolean;
};

type WorkspaceNavInput = {
  activeView: WorkspaceView;
  canAccessMemberView: boolean;
  canAccessFinanceView: boolean;
  isAdmin: boolean;
  workspacePath: string;
  settingsPath: string;
};

export function buildWorkspaceNavItems(input: WorkspaceNavInput): WorkspaceNavItem[] {
  const items: WorkspaceNavItem[] = [];

  if (input.canAccessMemberView) {
    items.push({
      key: "submit",
      label: "Submit",
      href: input.workspacePath,
      active: input.activeView === "member",
    });
  }

  if (input.canAccessFinanceView) {
    items.push({
      key: "process",
      label: "Process",
      href: `${input.workspacePath}?view=finance`,
      active: input.activeView === "finance",
    });
  }

  if (input.isAdmin) {
    items.push({
      key: "settings",
      label: "Settings",
      href: input.settingsPath,
      active: false,
    });
  }

  items.push({
    key: "signout",
    label: "Sign out",
    active: false,
  });

  return items;
}
