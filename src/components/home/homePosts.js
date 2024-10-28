import Link from "next/link";
import {
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoBookmark,
  IoEyeOutline,
  IoChatboxOutline,
} from "react-icons/io5";

export default function HomePosts() {
  return (
    <div
      className="flex flex-1 p-5 items-center flex-col"
      style={{ zoom: "1.4" }}
    >
      {/* Post 1 */}
      <div className="max-w-lg mb-5 long-shadow w-[100%] h-min flex flex-row rounded-lg p-3.5 bg-white">
        <div className="min-w-[60px] items-center mt-1 flex-col flex ml-[-15px] text-[13px] font-semibold text-[#319527]">
          <IoArrowUpOutline className="text-[19px] cursor-pointer" />
          <span>17</span>
          <IoArrowDownOutline className="text-[19px] text-gray-400 cursor-pointer" />
          <div
            className="bg-[#CDEBCA] cursor-pointer rounded-md w-[19px] h-[19px] mt-2 border-[#BFE5BB] border-[1.5px] flex items-center justify-center"
            style={{ zoom: "1.2" }}
          >
            <IoBookmark style={{ zoom: "0.9" }} />
          </div>
        </div>
        <div>
          <h1 className="text-[14px] font-semibold mb-1">
            Bí kíp để &quot;xử lí gọn&quot; 50 câu Tiếng Anh trong 60 phút
          </h1>
          <p className="text-[11px]">
            Có chiến lược làm bài thi rõ ràng, hiệu quả sẽ giúp sức rất nhiều
            cho bạn bên cạnh kiến thức và kỹ năng tốt. Để trả lời được những câu
            hỏi: làm sao để không bị áp lực thời gian đè bẹp? Làm sao để trong
            60 phút “xử lí gọn” 50 câu Tiếng Anh? Hãy cùng lắng nghe những chia
            sẻ của cô Hương Fiona cách phân bổ thời gian làm bài thi dưới đây.
          </p>
          <hr className="my-3 border-t-2" />
          <div className="flex-row flex text-[9px] items-center">
            <img
              src="/static/img/tunganh.png"
              className="rounded-full w-6"
              alt="tunnaduong's avatar"
            />
            <span className="text-gray-500 ml-1.5">Đăng bởi</span>
            <Link href="#" className="text-[#319527] font-bold ml-0.5">
              Dương Tùng Anh
            </Link>
            <span className="mb-2 ml-0.5 text-sm text-gray-500">.</span>
            <span className="ml-0.5 text-gray-500">12 giờ trước</span>
            <div className="flex flex-1 flex-row-reverse items-center text-gray-500">
              <span>243</span>
              <IoEyeOutline className="text-[15px] mr-1 ml-2" />
              <span>20+</span>
              <IoChatboxOutline className="text-[15px] mr-1" />
            </div>
          </div>
        </div>
      </div>
      {/* Post 2 */}
      <div className="max-w-lg mb-5 long-shadow w-[100%] h-min flex flex-row rounded-lg p-3.5 bg-white">
        <div className="min-w-[60px] items-center mt-1 flex-col flex ml-[-15px] text-[13px] font-semibold">
          <IoArrowUpOutline className="text-[19px] text-gray-400 cursor-pointer" />
          <span className="text-red-600">-5</span>
          <IoArrowDownOutline className="text-[19px] text-red-600 cursor-pointer" />
          <div
            className="bg-[#EAEAEA] cursor-pointer rounded-md w-[19px] h-[19px] mt-2 flex items-center justify-center"
            style={{ zoom: "1.2" }}
          >
            <IoBookmark className="text-[#CACACA]" style={{ zoom: "0.9" }} />
          </div>
        </div>
        <div>
          <h1 className="text-[14px] font-semibold mb-1">
            Cho em hỏi học toán như nào để giỏi hơn ạ?
          </h1>
          <p className="text-[11px]">
            Em năm nay lớp 12, vì nhà cũng khá giả nên cho đi học thêm. Nhưng mà
            học thêm thì giải bài hơi bị rặp khuôn và em cảm thấy chưa thỏa mãn
            với bản thân, nên là đầu năm lớp 11 em có mua sách về giải nhưng sau
            1 năm thì chả thấy bản thân em có tiến bộ gì.
          </p>
          <hr className="my-3 border-t-2" />
          <div className="flex-row flex text-[9px] items-center">
            <img
              src="/static/img/danghai.png"
              className="rounded-full w-6"
              alt="ndhai1012's avatar"
            />
            <span className="text-gray-500 ml-1.5">Đăng bởi</span>
            <Link href="#" className="text-[#319527] font-bold ml-0.5">
              Nguyễn Đặng Hải
            </Link>
            <span className="mb-2 ml-0.5 text-sm text-gray-500">.</span>
            <span className="ml-0.5 text-gray-500">1 ngày trước</span>
            <div className="flex flex-1 flex-row-reverse items-center text-gray-500">
              <span>23</span>
              <IoEyeOutline className="text-[15px] mr-1 ml-2" />
              <span>05+</span>
              <IoChatboxOutline className="text-[15px] mr-1" />
            </div>
          </div>
        </div>
      </div>
      {/* Post 3 */}
      <div className="max-w-lg mb-5 long-shadow w-[100%] h-min flex flex-row rounded-lg p-3.5 bg-white">
        <div className="min-w-[60px] items-center mt-1 flex-col flex ml-[-15px] text-[13px] font-semibold">
          <IoArrowUpOutline className="text-[19px] text-gray-400 cursor-pointer" />
          <span className="text-gray-400">1K</span>
          <IoArrowDownOutline className="text-[19px] text-gray-400 cursor-pointer" />
          <div
            className="bg-[#EAEAEA] cursor-pointer rounded-md w-[19px] h-[19px] mt-2 flex items-center justify-center"
            style={{ zoom: "1.2" }}
          >
            <IoBookmark className="text-[#CACACA]" style={{ zoom: "0.9" }} />
          </div>
        </div>
        <div>
          <h1 className="text-[14px] font-semibold mb-1">
            Thông báo về việc đi học lại sau kì nghỉ dịch COVID-19
          </h1>
          <p className="text-[11px]">
            THPT Chuyên Biên Hòa đã tổ chức dạy học trực tiếp trở lại cho học
            sinh khối lớp 11 và 12 thuộc địa bàn có dịch COVID-19 cấp độ 1, 2.
            Từ 10/1 tổ chức dạy học trực tiếp cho học sinh khối lớp 7, 8, 9
          </p>
          <hr className="my-3 border-t-2" />
          <div className="flex-row flex text-[9px] items-center">
            <img
              src="/static/img/cbh.jpeg"
              className="rounded-full w-6"
              alt="bienhoadoantruong's avatar"
            />
            <span className="text-gray-500 ml-1.5">Đăng bởi</span>
            <Link href="#" className="text-[#319527] font-bold ml-0.5">
              Biên Hòa Đoàn Trường
            </Link>
            <span className="mb-2 ml-0.5 text-sm text-gray-500">.</span>
            <span className="ml-0.5 text-gray-500">1 tuần trước</span>
            <div className="flex flex-1 flex-row-reverse items-center text-gray-500">
              <span>3976</span>
              <IoEyeOutline className="text-[15px] mr-1 ml-2" />
              <span>45+</span>
              <IoChatboxOutline className="text-[15px] mr-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
