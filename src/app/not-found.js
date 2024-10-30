"use client";

import Navbar from "@/components/include/navbar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Custom404() {
  const router = useRouter();

  return (
    <div className="mt-[66px]">
      <Navbar opacity={0} />
      <div className="flex flex-row">
        <div
          className="flex flex-1 items-center justify-center"
          style={{
            zoom: "1.4",
            display: "block",
            position: "absolute",
            left: "50%",
            top: "50%",
            WebkitTransform: "translate(-50%, -50%)",
            transform: "translate(-50%, -50%)",
          }}
        >
          <center>
            <img
              src="/images/404.svg"
              alt={404}
              className="w-[80px] h-[80px] mb-2"
            />
            <h4 className="font-bold text-gray-500 text-[14px]">
              Bạn hiện không xem được nội dung này
            </h4>
            <p className="text-[12px] text-gray-500">
              Lỗi này thường do chủ sở hữu chỉ chia sẻ nội dung với một
              <br />
              nhóm nhỏ, thay đổi người được xem hoặc đã xóa nội dung.
            </p>
            <Button
              className="bg-[#319528] hover:bg-green-700 text-white text-[12px] font-semibold rounded-[5px] py-[5px] px-6 mt-3 h-7"
              onClick={() => router.push("/")}
            >
              Đi tới Bảng tin
            </Button>
            <br />
            <Link
              href="#"
              onClick={() => router.back()}
              className="text-[#319528] text-[12px] mt-2 inline-block font-semibold"
            >
              Quay lại
            </Link>
          </center>
        </div>
      </div>
    </div>
  );
}
