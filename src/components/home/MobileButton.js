"use client";

import { Button } from "antd";
import { AddOutline } from "react-ionicons";

export default function MobileButton({ handleCreatePost }) {
  return (
    <Button
      type="primary"
      className="text-sm text-white font-semibold h-9 xl:hidden bg-primary-500 hover:bg-[#36aa2c] active:bg-[#298221] disabled:bg-primary-300 "
      onClick={handleCreatePost}
    >
      <div className="flex items-center gap-x-2">
        <AddOutline
          color="#FFFFFF"
          height={"20px"}
          width={"20px"}
          cssClasses="-mr-1"
        />
        Tạo cuộc thảo luận
      </div>
    </Button>
  );
}
