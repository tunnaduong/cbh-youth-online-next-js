import Navbar from "@/components/include/navbar";
import LeftSidebar from "@/components/include/leftSidebar";
import RightSidebar from "@/components/include/rightSidebar";
import { IoChatbubblesSharp, IoCheckmarkCircle } from "react-icons/io5";

export default function Forum() {
  return (
    <div className="mt-[66px]">
      <Navbar selected={0} />
      <div className="flex flex-row">
        <LeftSidebar selected="forum" />
        <div
          className="flex flex-1 p-5 items-center flex-col"
          style={{ zoom: "1.4" }}
        >
          {/* Section 1 */}
          <div className="max-w-lg w-[100%] mb-6">
            <p className="text-[13px] font-semibold px-4 mb-2">HỌC TẬP</p>
            <div className="bg-white long-shadow rounded-lg">
              <div className="flex flex-row items-center">
                <IoChatbubblesSharp className="text-[#319528] text-[23px] m-4" />
                <div className="flex flex-col flex-1">
                  <a
                    href="#"
                    className="text-[#319528] text-[12px] font-bold w-fit"
                  >
                    Trung học phổ thông
                  </a>
                  <span className="text-[10px] text-gray-500">
                    Bài viết:{" "}
                    <span className="mr-1 font-semibold text-black">28</span>{" "}
                    Bình luận:{" "}
                    <span className="text-black font-semibold">10</span>
                  </span>
                </div>
                <div
                  style={{ maxWidth: "calc(42%)" }}
                  className="flex-1 bg-[#E7FFE4] p-1 px-2 mr-2 rounded-md"
                >
                  <div className="leading-3 flex">
                    <span className="text-[10px] whitespace-nowrap mr-1">
                      Mới nhất:
                    </span>
                    <span className="text-[10px] text-[#319528] inline-block leading-3 text-ellipsis whitespace-nowrap overflow-hidden">
                      Cách khoanh bừa mà vẫn trúng 100% uy tín
                    </span>
                  </div>
                  <div className="leading-3 flex items-center mt-1 text-[#319528]">
                    <span className="text-[10px]">Hoàng Phát</span>
                    <IoCheckmarkCircle className="text-[11px] leading-5 ml-0.5" />
                    <span className="text-[10px] text-black">
                      , 1 ngày trước
                    </span>
                  </div>
                </div>
              </div>
              <hr />
              <div className="flex flex-row items-center">
                <IoChatbubblesSharp className="text-[#319528] text-[23px] m-4" />
                <div className="flex flex-col flex-1">
                  <a
                    href="#"
                    className="text-[#319528] text-[12px] font-bold w-fit"
                  >
                    Trung học cơ sở
                  </a>
                  <span className="text-[10px] text-gray-500">
                    Bài viết:{" "}
                    <span className="mr-1 font-semibold text-black">14</span>{" "}
                    Bình luận:{" "}
                    <span className="text-black font-semibold">4</span>
                  </span>
                </div>
                <div
                  style={{ maxWidth: "calc(42%)" }}
                  className="flex-1 bg-[#E7FFE4] p-1 px-2 mr-2 rounded-md"
                >
                  <div className="leading-3 flex">
                    <span className="text-[10px] whitespace-nowrap mr-1">
                      Mới nhất:
                    </span>
                    <span className="text-[10px] text-[#319528] inline-block leading-3 text-ellipsis whitespace-nowrap overflow-hidden">
                      Cho em hỏi học toán như nào để giỏi hơn ạ?
                    </span>
                  </div>
                  <div className="leading-3 flex items-center mt-1 text-[#319528]">
                    <span className="text-[10px]">Nguyễn Đặng Hải</span>
                    <span className="text-[10px] text-black">
                      , 1 ngày trước
                    </span>
                  </div>
                </div>
              </div>
              <hr />
              <div className="flex flex-row items-center">
                <IoChatbubblesSharp className="text-[#319528] text-[23px] m-4" />
                <div className="flex flex-col flex-1">
                  <a
                    href="#"
                    className="text-[#319528] text-[12px] font-bold w-fit"
                  >
                    Tiếng Anh
                  </a>
                  <span className="text-[10px] text-gray-500">
                    Bài viết:{" "}
                    <span className="mr-1 font-semibold text-black">9</span>{" "}
                    Bình luận:{" "}
                    <span className="text-black font-semibold">2</span>
                  </span>
                </div>
                <div
                  style={{ maxWidth: "calc(42%)" }}
                  className="flex-1 bg-[#E7FFE4] p-1 px-2 mr-2 rounded-md"
                >
                  <div className="leading-3 flex">
                    <span className="text-[10px] whitespace-nowrap mr-1">
                      Mới nhất:
                    </span>
                    <span className="text-[10px] text-[#319528] inline-block leading-3 text-ellipsis whitespace-nowrap overflow-hidden">
                      [THÔNG BÁO] Tổ chức cuộc thi Tiếng Anh
                    </span>
                  </div>
                  <div className="leading-3 flex items-center mt-1 text-[#319528]">
                    <span className="text-[10px]">Admin</span>
                    <IoCheckmarkCircle className="text-[11px] leading-5 ml-0.5" />
                    <span className="text-[10px] text-black">
                      , 1 ngày trước
                    </span>
                  </div>
                </div>
              </div>
              <hr />
              <div className="flex flex-row items-center">
                <IoChatbubblesSharp className="text-[#319528] text-[23px] m-4" />
                <div className="flex flex-col flex-1">
                  <a
                    href="#"
                    className="text-[#319528] text-[12px] font-bold w-fit"
                  >
                    Ebook - Giáo trình
                  </a>
                  <span className="text-[10px] text-gray-500">
                    Bài viết:{" "}
                    <span className="mr-1 font-semibold text-black">47</span>{" "}
                    Bình luận:{" "}
                    <span className="text-black font-semibold">36</span>
                  </span>
                </div>
                <div
                  style={{ maxWidth: "calc(42%)" }}
                  className="flex-1 bg-[#E7FFE4] p-1 px-2 mr-2 rounded-md"
                >
                  <div className="leading-3 flex">
                    <span className="text-[10px] whitespace-nowrap mr-1">
                      Mới nhất:
                    </span>
                    <span className="text-[10px] text-[#319528] inline-block leading-3 text-ellipsis whitespace-nowrap overflow-hidden">
                      [CHIA SẺ] 100 ebook miễn phí dành cho học sinh, sinh viên
                    </span>
                  </div>
                  <div className="leading-3 flex items-center mt-1 text-[#319528]">
                    <span className="text-[10px]">Dương Tùng Anh</span>
                    <IoCheckmarkCircle className="text-[11px] leading-5 ml-0.5" />
                    <span className="text-[10px] text-black">
                      , 1 ngày trước
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="max-w-lg w-[100%]">
            <p className="text-[13px] font-semibold px-4 mb-2">
              GIẢI TRÍ - XÃ HỘI
            </p>
            <div className="bg-white long-shadow rounded-lg">
              <div className="flex flex-row items-center">
                <IoChatbubblesSharp className="text-[#319528] text-[23px] m-4" />
                <div className="flex flex-col flex-1">
                  <a
                    href="#"
                    className="text-[#319528] text-[12px] font-bold w-fit"
                  >
                    Âm nhạc
                  </a>
                  <span className="text-[10px] text-gray-500">
                    Bài viết:{" "}
                    <span className="mr-1 font-semibold text-black">28</span>{" "}
                    Bình luận:{" "}
                    <span className="text-black font-semibold">10</span>
                  </span>
                </div>
                <div
                  style={{ maxWidth: "calc(42%)" }}
                  className="flex-1 bg-[#E7FFE4] p-1 px-2 mr-2 rounded-md"
                >
                  <div className="leading-3 flex">
                    <span className="text-[10px] whitespace-nowrap mr-1">
                      Mới nhất:
                    </span>
                    <span className="text-[10px] text-[#319528] inline-block leading-3 text-ellipsis whitespace-nowrap overflow-hidden">
                      List nhạc EDM cực xung
                    </span>
                  </div>
                  <div className="leading-3 flex items-center mt-1 text-[#319528]">
                    <span className="text-[10px]">Đức Duy N.</span>
                    <IoCheckmarkCircle className="text-[11px] leading-5 ml-0.5" />
                    <span className="text-[10px] text-black">
                      , 1 ngày trước
                    </span>
                  </div>
                </div>
              </div>
              <hr />
              <div className="flex flex-row items-center">
                <IoChatbubblesSharp className="text-[#319528] text-[23px] m-4" />
                <div className="flex flex-col flex-1">
                  <a
                    href="#"
                    className="text-[#319528] text-[12px] font-bold w-fit"
                  >
                    Hình ảnh đẹp
                  </a>
                  <span className="text-[10px] text-gray-500">
                    Bài viết:{" "}
                    <span className="mr-1 font-semibold text-black">28</span>{" "}
                    Bình luận:{" "}
                    <span className="text-black font-semibold">10</span>
                  </span>
                </div>
                <div
                  style={{ maxWidth: "calc(42%)" }}
                  className="flex-1 bg-[#E7FFE4] p-1 px-2 mr-2 rounded-md"
                >
                  <div className="leading-3 flex">
                    <span className="text-[10px] whitespace-nowrap mr-1">
                      Mới nhất:
                    </span>
                    <span className="text-[10px] text-[#319528] inline-block leading-3 text-ellipsis whitespace-nowrap overflow-hidden">
                      100 hình ảnh từ cuộc sống
                    </span>
                  </div>
                  <div className="leading-3 flex items-center mt-1 text-[#319528]">
                    <span className="text-[10px]">Anh em ơi</span>
                    <span className="text-[10px] text-black">
                      , 1 ngày trước
                    </span>
                  </div>
                </div>
              </div>
              <hr />
              <div className="flex flex-row items-center">
                <IoChatbubblesSharp className="text-[#319528] text-[23px] m-4" />
                <div className="flex flex-col flex-1">
                  <a
                    href="#"
                    className="text-[#319528] text-[12px] font-bold w-fit"
                  >
                    Thư giãn - Đố vui
                  </a>
                  <span className="text-[10px] text-gray-500">
                    Bài viết:{" "}
                    <span className="mr-1 font-semibold text-black">28</span>{" "}
                    Bình luận:{" "}
                    <span className="text-black font-semibold">10</span>
                  </span>
                </div>
                <div
                  style={{ maxWidth: "calc(42%)" }}
                  className="flex-1 bg-[#E7FFE4] p-1 px-2 mr-2 rounded-md"
                >
                  <div className="leading-3 flex">
                    <span className="text-[10px] whitespace-nowrap mr-1">
                      Mới nhất:
                    </span>
                    <span className="text-[10px] text-[#319528] inline-block leading-3 text-ellipsis whitespace-nowrap overflow-hidden">
                      Tuyển tập ảnh gái xinh
                    </span>
                  </div>
                  <div className="leading-3 flex items-center mt-1 text-[#319528]">
                    <span className="text-[10px]">MOD4R</span>
                    <IoCheckmarkCircle className="text-[11px] leading-5 ml-0.5" />
                    <span className="text-[10px] text-black">
                      , 1 ngày trước
                    </span>
                  </div>
                </div>
              </div>
              <hr />
              <div className="flex flex-row items-center">
                <IoChatbubblesSharp className="text-[#319528] text-[23px] m-4" />
                <div className="flex flex-col flex-1">
                  <a
                    href="#"
                    className="text-[#319528] text-[12px] font-bold w-fit"
                  >
                    Thế giới Game
                  </a>
                  <span className="text-[10px] text-gray-500">
                    Bài viết:{" "}
                    <span className="mr-1 font-semibold text-black">28</span>{" "}
                    Bình luận:{" "}
                    <span className="text-black font-semibold">10</span>
                  </span>
                </div>
                <div
                  style={{ maxWidth: "calc(42%)" }}
                  className="flex-1 bg-[#E7FFE4] p-1 px-2 mr-2 rounded-md"
                >
                  <div className="leading-3 flex">
                    <span className="text-[10px] whitespace-nowrap mr-1">
                      Mới nhất:
                    </span>
                    <span className="text-[10px] text-[#319528] inline-block leading-3 text-ellipsis whitespace-nowrap overflow-hidden">
                      [REVIEW] GTA V PC
                    </span>
                  </div>
                  <div className="leading-3 flex items-center mt-1 text-[#319528]">
                    <span className="text-[10px]">Dương Tùng Anh</span>
                    <IoCheckmarkCircle className="text-[11px] leading-5 ml-0.5" />
                    <span className="text-[10px] text-black">
                      , 1 ngày trước
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <RightSidebar />
      </div>
    </div>
  );
}
