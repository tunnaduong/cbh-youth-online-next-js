"use client";

import { useState } from "react";
import Navbar from "@/components/include/navbar";
import Footer from "@/components/layout/Footer";
import LeftSidebar from "@/components/layout/LeftSidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import BottomCTA from "@/components/marketing/BottomCTA";

export default function HomeLayout({
  children,
  activeNav,
  activeBar,
  onHandleCreatePost,
}) {
  const [handleCreatePost, setHandleCreatePost] = useState(null);

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
          <LeftSidebar activeBar={activeBar} />
          <div className="flex-1 mt-[4.3rem]">{children}</div>
          <RightSidebar onHandleCreatePost={handleRightSidebarCallback} />
        </div>
        <Footer />
      </div>
      <BottomCTA />
    </div>
  );
}
