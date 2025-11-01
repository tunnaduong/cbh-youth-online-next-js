"use client";

import {
  CreatePostProvider,
  useCreatePost,
} from "@/contexts/CreatePostContext";
import Navbar from "@/components/include/navbar";
import Footer from "@/components/layout/Footer";
import LeftSidebar from "@/components/layout/LeftSidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import BottomCTA from "@/components/marketing/BottomCTA";
import { useAuthContext } from "@/contexts/Support";

function HomeLayoutContent({
  children,
  activeNav,
  activeBar,
  onHandleCreatePost,
  sidebarItems,
  sidebarType,
  showRightSidebar = true,
  sidebarWidth = "260px",
}) {
  const { setHandleCreatePost } = useCreatePost();
  const { loggedIn, currentUser } = useAuthContext();

  const handleRightSidebarCallback = (fn) => {
    setHandleCreatePost(() => fn);
    if (onHandleCreatePost) {
      onHandleCreatePost(fn);
    }
  };
  return (
    <div>
      <Navbar activeNav={activeNav} />
      <div
      // className={`${
      //   loggedIn && !currentUser?.email_verified_at ? "mt-[69px]" : ""
      // }`}
      >
        <div className="flex flex-col xl:flex-row flex-1">
          <LeftSidebar
            activeBar={activeBar}
            items={sidebarItems}
            type={sidebarType}
            width={sidebarWidth}
          />
          <div className="flex-1 mt-[4.3rem]">{children}</div>
          {showRightSidebar && (
            <RightSidebar onHandleCreatePost={handleRightSidebarCallback} />
          )}
        </div>
        <Footer />
      </div>
      <BottomCTA />
    </div>
  );
}

export default function HomeLayout(props) {
  return (
    <CreatePostProvider>
      <HomeLayoutContent {...props} />
    </CreatePostProvider>
  );
}
