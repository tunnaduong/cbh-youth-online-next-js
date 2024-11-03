import Navbar from "@/components/include/navbar";
import LeftSidebar from "@/components/include/leftSidebar";
import RightSidebar from "@/components/include/rightSidebar";

export default function Saved() {
  return (
    <div className="mt-[66px]">
      <Navbar selected={0} />
      <div className="flex flex-row">
        <LeftSidebar selected="saved" />
        <div className="flex-1"></div>
        <RightSidebar />
      </div>
    </div>
  );
}
