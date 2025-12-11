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
import Image from "next/image";

function HomeLayoutContent({
  children,
  activeNav,
  activeBar,
  onHandleCreatePost,
  sidebarItems,
  sidebarType,
  showRightSidebar = true,
  sidebarWidth = "260px",
  showLeftSidebar = true,
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
      <div>
        <div className="flex flex-col xl:flex-row flex-1">
          {showLeftSidebar && (
            <LeftSidebar
              activeBar={activeBar}
              items={sidebarItems}
              type={sidebarType}
              width={sidebarWidth}
            />
          )}
          <div
            className={`flex-1 ${loggedIn && !currentUser?.email_verified_at
              ? "mt-[calc(4.3rem+56px)] md:mt-[calc(4.3rem+30px)]"
              : "mt-[4.3rem]"
              }`}
          >
            <div className="px-3.5">
              <a href="https://chuyenbienhoa.download?utm_source=cyo_home">
                <div className="my-6 w-full shadow rounded-lg overflow-hidden md:max-w-[775px] mx-auto">
                  <Image
                    src="/images/mobile-app-download-banner.jpg"
                    alt="Tải ứng dụng Chuyên Biên Hòa Online"
                    width={1200}
                    height={400}
                    className="w-full h-auto"
                    priority
                  />
                </div>
              </a>
            </div>
            {children}
          </div>
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
