"use client";

import { useParams } from "next/navigation";
import Navbar from "@/components/include/navbar";
import LeftSidebar from "@/components/include/leftSidebar";
import RightSidebar from "@/components/include/rightSidebar";

export default function ForumCategory() {
  const params = useParams();

  return (
    <div className="mt-[66px]">
      <Navbar selected={0} />
      <div className="flex flex-row">
        <LeftSidebar selected="forum" />
        <div className="flex-1"></div>
        <RightSidebar />
      </div>
    </div>
  );
}
