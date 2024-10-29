import Navbar from "@/components/include/navbar";
import LeftSidebar from "@/components/include/leftSidebar";
import RightSidebar from "@/components/include/rightSidebar";
import HomePosts from "@/components/home/homePosts";

export default function Home() {
  return (
    <div className="mt-[66px]">
      <Navbar />
      <div className="flex flex-row">
        <LeftSidebar />
        <HomePosts />
        <RightSidebar />
      </div>
    </div>
  );
}
