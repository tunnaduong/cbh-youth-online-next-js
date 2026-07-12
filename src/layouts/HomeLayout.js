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
import { useState, useEffect } from "react";

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
  showAds = true,
}) {
  const { setHandleCreatePost } = useCreatePost();
  const { loggedIn, currentUser } = useAuthContext();
  const [showAppBanner, setShowAppBanner] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent;
    const isAndroidOrIOS =
      /Android/i.test(ua) || /iPhone|iPad|iPod/i.test(ua);
    if (
      isAndroidOrIOS &&
      !sessionStorage.getItem("home_app_banner_closed")
    ) {
      setShowAppBanner(true);
    }
  }, []);

  const handleCloseAppBanner = () => {
    setShowAppBanner(false);
    sessionStorage.setItem("home_app_banner_closed", "1");
  };

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
            {showAds && showAppBanner && (
              <div className="px-3.5">
                <div className="relative mt-6 mb-2 w-full shadow rounded-lg overflow-hidden md:max-w-[775px] mx-auto">
                  <a href="https://chuyenbienhoa.download?utm_source=cyo_home">
                    <Image
                      src="/images/mobile-app-download-banner.webp"
                      alt="Tải ứng dụng Chuyên Biên Hòa Online"
                      width={1200}
                      height={400}
                      className="w-full h-auto"
                      priority
                    />
                  </a>
                  <button
                    onClick={handleCloseAppBanner}
                    aria-label="Đóng"
                    className="absolute top-2 right-2 flex items-center justify-center bg-black/50 text-white rounded-full"
                    style={{
                      width: "32px",
                      height: "32px",
                      fontSize: "16px",
                      lineHeight: 1,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
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
