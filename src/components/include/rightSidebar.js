import Link from "next/link";
import { IoAddOutline, IoTrophy } from "react-icons/io5";
import { Button } from "../ui/button";

export default function RightSidebar() {
  return (
    <div
      style={{ zoom: "1.4" }}
      className="w-60 p-5 h-min sticky top-[48px]"
      id="right-sidebar"
    >
      <Button
        id="openModalBtn"
        className="mb-2 text-[11px] font-semibold bg-[#319527] hover:bg-green-700 flex items-center justify-center w-[100%] text-left leading-3 text-white rounded-lg p-1.5 h-7"
      >
        <IoAddOutline className="text-[16px] -mr-1" />
        Tạo bài viết mới
      </Button>
      <div className="bg-white text-[11px] p-2.5 mt-4 rounded-lg long-shadow">
        <span className="font-bold text-[#6B6B6B] block">Xếp hạng tháng</span>
        <div className="flex flex-row items-center mt-2">
          <span className="w-6 h-6 text-[10px] text-white bg-gray-300 rounded-full flex items-center justify-center">
            K63
          </span>
          <span className="flex flex-1 ml-1.5 font-semibold">12 Nga</span>
          <span className="mr-1.5 text-[#C1C1C1]">-12 điểm</span>
          <IoTrophy className="text-[15px] text-yellow-400" />
        </div>
        <div className="flex flex-row items-center mt-2">
          <span className="w-6 h-6 text-[10px] text-white bg-gray-300 rounded-full flex items-center justify-center">
            K64
          </span>
          <span className="flex flex-1 ml-1.5 font-semibold">11 Toán</span>
          <span className="mr-1.5 text-[#C1C1C1]">-6 điểm</span>
          <IoTrophy className="text-[15px] text-yellow-400" />
        </div>
        <div className="flex flex-row items-center mt-2">
          <span className="w-6 h-6 text-[10px] text-white bg-gray-300 rounded-full flex items-center justify-center">
            K65
          </span>
          <span className="flex flex-1 ml-1.5 font-semibold">10 Sử</span>
          <span className="mr-1.5 text-[#C1C1C1]">-18 điểm</span>
          <IoTrophy className="text-[15px] text-yellow-400" />
        </div>
        <div className="flex flex-row items-center mt-2">
          <span className="w-6 h-6 text-[10px] text-white bg-gray-300 rounded-full flex items-center justify-center">
            K9
          </span>
          <span className="flex flex-1 ml-1.5 font-semibold">9A1</span>
          <span className="mr-1.5 text-[#C1C1C1]">-4 điểm</span>
          <IoTrophy className="text-[15px] text-yellow-400" />
        </div>
        <div className="flex flex-row items-center mt-2">
          <span className="w-6 h-6 text-[10px] text-white bg-gray-300 rounded-full flex items-center justify-center">
            K10
          </span>
          <span className="flex flex-1 ml-1.5 font-semibold">8A2</span>
          <span className="mr-1.5 text-[#C1C1C1]">-6 điểm</span>
          <IoTrophy className="text-[15px] text-yellow-400" />
        </div>
        <div className="flex flex-row items-center mt-2">
          <span className="w-6 h-6 text-[10px] text-white bg-gray-300 rounded-full flex items-center justify-center">
            K11
          </span>
          <span className="flex flex-1 ml-1.5 font-semibold">7A1</span>
          <span className="mr-1.5 text-[#C1C1C1]">-10 điểm</span>
          <IoTrophy className="text-[15px] text-yellow-400" />
        </div>
        <div className="flex flex-row items-center mt-2">
          <span className="w-6 h-6 text-[10px] text-white bg-gray-300 rounded-full flex items-center justify-center">
            K12
          </span>
          <span className="flex flex-1 ml-1.5 font-semibold">6A2</span>
          <span className="mr-1.5 text-[#C1C1C1]">-14 điểm</span>
          <IoTrophy className="text-[15px] text-yellow-400" />
        </div>
        <hr className="my-2" />
        <div className="flex flex-row items-center">
          <span className="w-6 h-6 text-[10px] text-white bg-gray-300 rounded-full flex items-center justify-center">
            K63
          </span>
          <span className="flex flex-1 ml-1.5 font-semibold">Lớp bạn</span>
          <span className="mr-1.5 text-[#C1C1C1]">-35 điểm</span>
          <span className="text-green-500 font-bold">#3</span>
        </div>
      </div>
      <div className="flex flex-row text-[10px] font-semibold p-3 text-[#BCBCBC]">
        <div className="flex flex-1 flex-col gap-y-0.5">
          <Link href="#" className="w-fit">
            Hỗ trợ
          </Link>
          <Link href="#" className="w-fit">
            Liên hệ
          </Link>
          <Link href="#" className="w-fit">
            Blog
          </Link>
          <Link href="#" className="w-fit">
            Quảng cáo
          </Link>
        </div>
        <div className="flex flex-1 flex-col ml-5 gap-y-0.5">
          <Link href="#" className="w-fit">
            Giới thiệu
          </Link>
          <Link href="#" className="w-fit">
            Việc làm
          </Link>
          <Link href="#" className="w-fit">
            Điều khoản
          </Link>
          <Link href="#" className="w-fit">
            Quyền riêng tư
          </Link>
        </div>
      </div>
      <p className="text-[8.5px] text-center text-[#BCBCBC]">
        Fatties Software © 2022
      </p>
    </div>
  );
}
