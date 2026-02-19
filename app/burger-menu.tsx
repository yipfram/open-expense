import { BurgerMenuClient } from "@/app/burger-menu-client";
import { SETTINGS_PATH, WORKSPACE_PATH } from "@/src/lib/routes";
import { getUserRoles } from "@/src/lib/roles";
import { getSessionSafe } from "@/src/lib/session";

export async function BurgerMenu() {
  const session = await getSessionSafe();
  const roles = session ? await getUserRoles(session.user) : [];
  const isAdmin = roles.includes("admin");
  const items = [{ href: "/", label: "Home" }];

  if (session) {
    items.push({ href: WORKSPACE_PATH, label: "Workspace" });
    if (isAdmin) {
      items.push({ href: SETTINGS_PATH, label: "Settings" });
    }
  } else {
    items.push({ href: "/sign-in", label: "Sign in" });
    items.push({ href: "/sign-up", label: "Sign up" });
  }

  return <BurgerMenuClient items={items} isAuthenticated={Boolean(session)} />;
}
