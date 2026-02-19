import type { AppRole } from "@/src/lib/roles";

export const WORKSPACE_VIEWS = ["member", "finance"] as const;
export type WorkspaceView = (typeof WORKSPACE_VIEWS)[number];

export function parseWorkspaceView(value: string | undefined): WorkspaceView | undefined {
  if (!value) {
    return undefined;
  }

  return value === "member" || value === "finance" ? value : undefined;
}

export function getDefaultWorkspaceView(roles: readonly AppRole[]): WorkspaceView {
  void roles;
  return "member";
}

export function canAccessWorkspaceView(view: WorkspaceView, roles: readonly AppRole[]): boolean {
  if (view === "member") {
    return roles.some((role) => role === "member" || role === "manager" || role === "finance" || role === "admin");
  }

  return roles.some((role) => role === "finance" || role === "admin");
}
