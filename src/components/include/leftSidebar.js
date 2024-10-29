import Link from "next/link";
import {
  IoHome,
  IoChatboxEllipses,
  IoMegaphone,
  IoNewspaper,
  IoBookmark,
} from "react-icons/io5";

export default function LeftSidebar({ selected = "feed" }) {
  return (
    <div
      className="w-60 p-5 h-min sticky top-[48px]"
      style={{ zoom: "1.4" }}
      id="left-sidebar"
    >
      <p className="text-[10px] font-semibold text-[#6b6b6b] pb-2.5 ml-1.5">
        MENU
      </p>
      {selected == "feed" ? (
        <Link
          href="/"
          className="mb-2 text-[11px] font-semibold bg-[#E4EEE3] flex items-center w-[100%] text-left text-[#319527] rounded-lg p-1.5"
        >
          <div
            className="bg-[#CDEBCA] rounded-md w-[19px] h-[19px] mr-2 border-[#BFE5BB] border-[1.5px] flex items-center justify-center"
            style={{ zoom: "1.2" }}
          >
            <IoHome />
          </div>
          <div className="text-[#319527]">Bảng tin</div>
        </Link>
      ) : (
        <Link
          href="/"
          className="mb-2 text-[11px] font-semibold flex items-center w-[100%] text-left text-[#CACACA] rounded-lg p-1.5"
        >
          <div
            className="rounded-md w-[19px] h-[19px] mr-2 border-[1.5px] flex items-center justify-center"
            style={{ zoom: "1.2" }}
          >
            <IoHome />
          </div>
          <div className="text-[#6B6B6B]">Bảng tin</div>
        </Link>
      )}
      {selected == "forum" ? (
        <Link
          href="/forum"
          className="mb-2 text-[11px] font-semibold bg-[#E4EEE3] flex items-center w-[100%] text-left text-[#319527] rounded-lg p-1.5"
        >
          <div
            className="bg-[#CDEBCA] rounded-md w-[19px] h-[19px] mr-2 border-[#BFE5BB] border-[1.5px] flex items-center justify-center"
            style={{ zoom: "1.2" }}
          >
            <IoChatboxEllipses />
          </div>
          <div className="text-[#319527]">Diễn đàn</div>
        </Link>
      ) : (
        <Link
          href="/forum"
          className="mb-2 text-[11px] font-semibold flex items-center w-[100%] text-left text-[#CACACA] rounded-lg p-1.5"
        >
          <div
            className="rounded-md w-[19px] h-[19px] mr-2 border-[1.5px] flex items-center justify-center"
            style={{ zoom: "1.2" }}
          >
            <IoChatboxEllipses />
          </div>
          <div className="text-[#6B6B6B]">Diễn đàn</div>
        </Link>
      )}
      {selected == "recording" ? (
        <Link
          href="/recordings"
          className="mb-2 text-[11px] font-semibold bg-[#E4EEE3] flex items-center w-[100%] text-left text-[#319527] rounded-lg p-1.5"
        >
          <div
            className="bg-[#CDEBCA] rounded-md w-[19px] h-[19px] mr-2 border-[#BFE5BB] border-[1.5px] flex items-center justify-center"
            style={{ zoom: "1.2" }}
          >
            <IoMegaphone />
          </div>
          <div className="text-[#319527]">Loa lớn</div>
        </Link>
      ) : (
        <Link
          href="/recordings"
          className="mb-2 text-[11px] font-semibold flex items-center w-[100%] text-left text-[#CACACA] rounded-lg p-1.5"
        >
          <div
            className="rounded-md w-[19px] h-[19px] mr-2 border-[1.5px] flex items-center justify-center"
            style={{ zoom: "1.2" }}
          >
            <IoMegaphone />
          </div>
          <div className="text-[#6B6B6B]">Loa lớn</div>
        </Link>
      )}
      {selected == "news" ? (
        <Link
          href="/youth-news"
          className="mb-2 text-[11px] font-semibold bg-[#E4EEE3] flex items-center w-[100%] text-left text-[#319527] rounded-lg p-1.5"
        >
          <div
            className="bg-[#CDEBCA] rounded-md w-[19px] h-[19px] mr-2 border-[#BFE5BB] border-[1.5px] flex items-center justify-center"
            style={{ zoom: "1.2" }}
          >
            <IoNewspaper />
          </div>
          <div className="text-[#319527]">Tin tức Đoàn</div>
        </Link>
      ) : (
        <Link
          href="/youth-news"
          className="mb-2 text-[11px] font-semibold flex items-center w-[100%] text-left text-[#CACACA] rounded-lg p-1.5"
        >
          <div
            className="rounded-md w-[19px] h-[19px] mr-2 border-[1.5px] flex items-center justify-center"
            style={{ zoom: "1.2" }}
          >
            <IoNewspaper />
          </div>
          <div className="text-[#6B6B6B]">Tin tức Đoàn</div>
        </Link>
      )}
      {selected == "saved" ? (
        <Link
          href="/saved"
          className="mb-2 text-[11px] font-semibold bg-[#E4EEE3] flex items-center w-[100%] text-left text-[#319527] rounded-lg p-1.5"
        >
          <div
            className="bg-[#CDEBCA] rounded-md w-[19px] h-[19px] mr-2 border-[#BFE5BB] border-[1.5px] flex items-center justify-center"
            style={{ zoom: "1.2" }}
          >
            <IoBookmark />
          </div>
          <div className="text-[#319527]">Đã lưu</div>
        </Link>
      ) : (
        <Link
          href="/saved"
          className="mb-2 text-[11px] font-semibold flex items-center w-[100%] text-left text-[#CACACA] rounded-lg p-1.5"
        >
          <div
            className="rounded-md w-[19px] h-[19px] mr-2 border-[1.5px] flex items-center justify-center"
            style={{ zoom: "1.2" }}
          >
            <IoBookmark />
          </div>
          <div className="text-[#6B6B6B]">Đã lưu</div>
        </Link>
      )}
    </div>
  );
}
