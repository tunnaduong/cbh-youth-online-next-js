"use client";

import { useAuthContext } from "@/contexts/Support";
import SidebarNav, { MAIN_NAV_ITEMS } from "./SidebarNav";

export default function LeftSidebar({
  activeBar = "forum",
  width = "260px",
  items = MAIN_NAV_ITEMS,
}) {
  const { loggedIn, currentUser } = useAuthContext();

  // Keep the sidebar below the fixed navbar (and the email verification alert).
  // It's applied as both margin and sticky `top`, so short pages that never
  // scroll don't leave the sidebar tucked under the navbar.
  const offset = loggedIn && !currentUser?.email_verified_at ? 99 : 69;

  return (
    <aside
      id="left-sidebar"
      className="scrollbar-hide sticky hidden flex-col overflow-y-auto px-4 pb-5 pt-6 xl:flex"
      style={{
        top: `${offset}px`,
        marginTop: `${offset}px`,
        height: `calc(100vh - ${offset}px)`,
        width,
        minWidth: width,
        borderRight: "1px"
      }}
    >
      <SidebarNav items={items} activeKey={activeBar} />
    </aside>
  );
}
