import Navbar from "@/components/include/navbar";
import LeftSidebar from "@/components/include/leftSidebar";
import RightSidebar from "@/components/include/rightSidebar";

export default function Explore() {
  return (
    <div className="mt-[66px]">
      <Navbar selected={3} />
      <div className="flex flex-row">
        <LeftSidebar selected="feed" />
        <div className="flex-1"></div>
        <RightSidebar />
      </div>
    </div>
  );
}
