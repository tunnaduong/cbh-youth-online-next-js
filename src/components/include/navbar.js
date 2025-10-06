"use client";

import React from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthContext } from "@/contexts/Support";
import { logoutRequest } from "@/app/Api";
import Dropdown from "../ui/Dropdown";
import { message } from "antd";
import DarkmodeToggle from "../ui/DarkmodeToggle";
import Tooltip from "../ui/Tooltip";
import {
  LogInOutline,
  ChatboxEllipsesOutline,
  TelescopeOutline,
  MegaphoneOutline,
  NewspaperOutline,
  BookmarkOutline,
  PeopleOutline,
  PersonOutline,
  CalendarOutline,
  TrophyOutline,
  AppsOutline,
  FlagOutline,
  SearchOutline,
} from "react-ionicons";
import { useTheme } from "@/contexts/themeContext";
import {
  BsBoxArrowRight,
  BsGear,
  BsPersonCircle,
  BsQuestionCircle,
} from "react-icons/bs";
import { Drawer } from "antd";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar({ activeNav = null }) {
  const { loggedIn, currentUser, setCurrentUser, setUserToken } =
    useAuthContext();
  const router = useRouter();

  const { theme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSavedClick = (e) => {
    if (!loggedIn) {
      e.preventDefault();
      message.error("Vui lòng đăng nhập để xem các bài viết đã lưu của bạn.");
      router.visit(
        `/login?continue=${encodeURIComponent(window.location.href)}`,
        {
          preserveScroll: true,
        }
      );
    }
  };

  const ioniconDefaultColor = theme === "dark" ? "#FFF" : "#000";
  const ioniconSize = "20px";

  const onLogout = (ev) => {
    ev.preventDefault();
    logoutRequest();
    setCurrentUser({});
    setUserToken(null);
    localStorage.clear();
    location.href = "/login";
  };

  const mobileSidebarItems = [
    {
      label: "Cộng đồng",
      icon: PeopleOutline,
      href: "/",
      subItems: [
        {
          icon: ChatboxEllipsesOutline,
          href: "/",
          label: "Diễn đàn",
          active: true,
        },
        { icon: TelescopeOutline, href: "/feed", label: "Bảng tin" },
        { icon: MegaphoneOutline, href: "/recordings", label: "Loa lớn" },
        { icon: NewspaperOutline, href: "/youth-news", label: "Tin tức Đoàn" },
        { icon: BookmarkOutline, href: "/saved", label: "Đã lưu" },
      ],
    },
    {
      label: "Báo cáo",
      icon: FlagOutline,
      href: "/report",
      subItems: [
        {
          icon: PeopleOutline,
          href: "/report/class",
          label: "Báo cáo tập thể lớp",
        },
        {
          icon: PersonOutline,
          href: "/report/student",
          label: "Báo cáo học sinh",
        },
      ],
    },
    {
      label: "Tra cứu",
      icon: SearchOutline,
      href: "/lookup",
      subItems: [
        {
          icon: CalendarOutline,
          href: "/lookup/timetable",
          label: "Thời khóa biểu",
        },
        {
          icon: TrophyOutline,
          href: "/lookup/class-ranking",
          label: "Xếp hạng thi đua lớp",
        },
      ],
    },
    { label: "Khám phá", icon: AppsOutline, href: "/explore" },
  ];

  const menuItems = [
    { name: "Cộng đồng", href: "/", activeNav: "home" },
    { name: "Báo cáo", href: "/report", activeNav: "report" },
    { name: "Tra cứu", href: "/lookup", activeNav: "lookup" },
    { name: "Khám phá", href: "/explore", activeNav: "explore" },
  ];

  const renderMenuItems = (items) => {
    return items.map((item, index) => {
      const IconComponent = item.icon;

      return (
        <div key={index}>
          <Link
            className="flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-neutral-500 text-base active:bg-green-600 active:text-white"
            href={item.href}
          >
            <IconComponent
              color={ioniconDefaultColor}
              height={ioniconSize}
              width={ioniconSize}
              cssClasses="mr-3"
            />
            {item.label}
          </Link>
          {item.subItems && (
            <ul className="pl-8">
              {item.subItems.map((subItem, subIndex) => {
                const SubIconComponent = subItem.icon;
                return (
                  <li key={subIndex}>
                    <Link
                      className="flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-neutral-500 text-base active:bg-green-600 active:text-white"
                      href={subItem.href}
                      onClick={
                        subItem.href === "/saved" ? handleSavedClick : undefined
                      }
                    >
                      <SubIconComponent
                        color={ioniconDefaultColor}
                        height={ioniconSize}
                        width={ioniconSize}
                        cssClasses="mr-3"
                      />
                      {subItem.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      );
    });
  };

  return (
    <>
      <nav className="fixed w-[100%] top-0 bg-white dark:bg-neutral-700 shadow-md leading-[0] flex justify-between glass-card">
        <div className="flex flex-row px-6 py-3.5">
          <button
            className="inline-flex dark:!border-neutral-500 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input shadow-sm h-9 w-9 xl:hidden mr-3 min-w-[36px]"
            type="button"
            onClick={() => setDrawerOpen(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={24}
              height={24}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-menu h-6 w-6"
            >
              <line x1={4} x2={20} y1={12} y2={12} />
              <line x1={4} x2={20} y1={6} y2={6} />
              <line x1={4} x2={20} y1={18} y2={18} />
            </svg>
          </button>
          <Link id="logo" className="inline-block" href="/">
            <div className="flex gap-x-1 items-center min-w-max">
              <img
                src="/images/logo.png"
                alt="CYO's Logo"
                className="w-10 h-10"
              />
              <div className="text-[14.2px] font-light text-[#319527] leading-4 hidden xl:block">
                <h1>Diễn đàn học sinh</h1>
                <h1 className="font-bold">Chuyên Biên Hòa</h1>
              </div>
              <Tooltip
                content={
                  <>
                    Diễn đàn đang trong giai đoạn thử nghiệm.
                    <br />
                    <br />
                    Phiên bản 3.0
                  </>
                }
              >
                <div className="bg-yellow-400 text-black text-[14px] font-semibold rounded-full !px-3 !py-3 ml-2 hidden xl:block">
                  <span>Beta</span>
                </div>
              </Tooltip>
            </div>
          </Link>
          <div className="border dark:!border-neutral-500 max-w-52 xl:flex flex-row items-center bg-[#F7F7F7] dark:!bg-neutral-600 rounded-lg pr-1 ml-7 pl-1 hidden">
            <input
              type="text"
              placeholder="Tìm kiếm"
              className="border-0 w-full bg-[#F7F7F7] dark:!bg-neutral-600 text-[13px] p-2 rounded-lg pr-1 focus:ring-0"
            />
            <div className="bg-white dark:!bg-neutral-700 rounded-lg min-w-[30px] h-[30px] flex items-center justify-center cursor-pointer search-btn dark:!border-neutral-500">
              <svg
                stroke="currentColor"
                fill="currentColor"
                strokeWidth={0}
                viewBox="0 0 512 512"
                className="text-[16px] text-[#6B6B6B] dark:!text-neutral-400"
                height="1em"
                width="1em"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M456.69 421.39 362.6 327.3a173.81 173.81 0 0 0 34.84-104.58C397.44 126.38 319.06 48 222.72 48S48 126.38 48 222.72s78.38 174.72 174.72 174.72A173.81 173.81 0 0 0 327.3 362.6l94.09 94.09a25 25 0 0 0 35.3-35.3zM97.92 222.72a124.8 124.8 0 1 1 124.8 124.8 124.95 124.95 0 0 1-124.8-124.8z"></path>
              </svg>
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <div className="h-full items-center flex flex-row gap-x-3 relative nav-item">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                className={`xl:flex px-3 py-2 mr-5 dark:text-neutral-300 dark:hover:text-white hidden h-full items-center min-w-max text-center text-sm font-medium transition-colors duration-200 ${
                  activeNav === item.activeNav ? "nav-active" : ""
                }`}
                href={item.href}
              >
                {item.name}
              </Link>
            ))}
            <div className="w-[1px] -ml-5 mr-3 h-6 bg-[#e2e2e3] dark:bg-[#585858] hidden xl:block" />
            <DarkmodeToggle />
            <div className="w-[1px] h-6 ml-3 mr-6 bg-[#e2e2e3] dark:bg-[#585858] hidden xl:block" />
          </div>
          {!loggedIn ? (
            <div className="min-w-max mr-4">
              <Link
                href={`/login?continue=${
                  typeof window !== "undefined"
                    ? encodeURIComponent(window.location.href)
                    : "/"
                }`}
                className="flex items-center gap-x-1 text-sm font-medium transition-colors duration-200 text-[#319527] hover:text-[#3dbb31]"
                style={{ borderBottom: "3px solid transparent" }}
              >
                <LogInOutline
                  color={theme === "dark" ? "#3dbb31" : "#319527"}
                  height={ioniconSize}
                  width={ioniconSize}
                  cssClasses="flex-shrink-0"
                />
                <span className="flex-shrink-0">Đăng nhập/Đăng ký</span>
              </Link>
            </div>
          ) : (
            <div className="flex flex-row items-center gap-x-5 mr-4">
              <svg
                stroke="currentColor"
                fill="currentColor"
                strokeWidth={0}
                viewBox="0 0 512 512"
                className="xl:hidden cursor-pointer text-[23px] text-[#6B6B6B] dark:text-neutral-300"
                height="1em"
                width="1em"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="none"
                  strokeMiterlimit={10}
                  strokeWidth={32}
                  d="M221.09 64a157.09 157.09 0 1 0 157.09 157.09A157.1 157.1 0 0 0 221.09 64z"
                />
                <path
                  fill="none"
                  strokeLinecap="round"
                  strokeMiterlimit={10}
                  strokeWidth={32}
                  d="M338.29 338.29 448 448"
                />
              </svg>
              <div className="cursor-pointer">
                <svg
                  stroke="currentColor"
                  fill="currentColor"
                  strokeWidth={0}
                  viewBox="0 0 512 512"
                  className="text-[#6B6B6B] dark:text-neutral-300 text-[23px]"
                  height="1em"
                  width="1em"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill="none"
                    strokeLinecap="round"
                    strokeMiterlimit={10}
                    strokeWidth={32}
                    d="M87.49 380c1.19-4.38-1.44-10.47-3.95-14.86a44.86 44.86 0 0 0-2.54-3.8 199.81 199.81 0 0 1-33-110C47.65 139.09 140.73 48 255.83 48 356.21 48 440 117.54 459.58 209.85a199 199 0 0 1 4.42 41.64c0 112.41-89.49 204.93-204.59 204.93-18.3 0-43-4.6-56.47-8.37s-26.92-8.77-30.39-10.11a31.09 31.09 0 0 0-11.12-2.07 30.71 30.71 0 0 0-12.09 2.43l-67.83 24.48a16 16 0 0 1-4.67 1.22 9.6 9.6 0 0 1-9.57-9.74 15.85 15.85 0 0 1 .6-3.29z"
                  ></path>
                </svg>
                <svg
                  stroke="currentColor"
                  fill="currentColor"
                  strokeWidth={0}
                  viewBox="0 0 512 512"
                  className="paw text-[#6B6B6B] dark:text-neutral-300 text-[23px]"
                  height="1em"
                  width="1em"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M194.82 496a18.36 18.36 0 0 1-18.1-21.53v-.11L204.83 320H96a16 16 0 0 1-12.44-26.06L302.73 23a18.45 18.45 0 0 1 32.8 13.71c0 .3-.08.59-.13.89L307.19 192H416a16 16 0 0 1 12.44 26.06L209.24 489a18.45 18.45 0 0 1-14.42 7z"></path>
                </svg>
              </div>
              <div className="cursor-pointer">
                <svg
                  stroke="currentColor"
                  fill="currentColor"
                  strokeWidth={0}
                  viewBox="0 0 512 512"
                  className="text-[#6B6B6B] dark:text-neutral-300 text-[23px]"
                  height="1em"
                  width="1em"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={32}
                    d="M427.68 351.43C402 320 383.87 304 383.87 217.35 383.87 138 343.35 109.73 310 96c-4.43-1.82-8.6-6-9.95-10.55C294.2 65.54 277.8 48 256 48s-38.21 17.55-44 37.47c-1.35 4.6-5.52 8.71-9.95 10.53-33.39 13.75-73.87 41.92-73.87 121.35C128.13 304 110 320 84.32 351.43 73.68 364.45 83 384 101.61 384h308.88c18.51 0 27.77-19.61 17.19-32.57zM320 384v16a64 64 0 0 1-128 0v-16"
                  ></path>
                </svg>
              </div>
              <Dropdown>
                <Dropdown.Trigger>
                  <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full cursor-pointer">
                    <Avatar className="cursor-pointer">
                      {loggedIn && (
                        <AvatarImage
                          src={`${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${currentUser?.username}/avatar`}
                          alt="User"
                        />
                      )}
                      <AvatarFallback>
                        <User />
                      </AvatarFallback>
                    </Avatar>
                  </span>
                </Dropdown.Trigger>
                <Dropdown.Content>
                  <Dropdown.Link
                    className="flex items-center gap-2 py-2"
                    href={`/${currentUser?.username}`}
                  >
                    <BsPersonCircle />
                    Trang cá nhân
                  </Dropdown.Link>
                  <Dropdown.Link
                    className="flex items-center gap-2 py-2"
                    href="/settings"
                  >
                    <BsGear /> Cài đặt
                  </Dropdown.Link>
                  <Dropdown.Link
                    className="flex items-center gap-2 py-2"
                    href="https://facebook.com/cbhyouthonline"
                  >
                    <BsQuestionCircle /> Trợ giúp
                  </Dropdown.Link>
                  <hr className="dropdown-divider" />
                  <Dropdown.Link
                    className="flex items-center gap-2 py-2 cursor-pointer"
                    onClick={onLogout}
                  >
                    <BsBoxArrowRight /> Đăng xuất
                  </Dropdown.Link>
                </Dropdown.Content>
              </Dropdown>
            </div>
          )}

          {/* Mobile menu */}
          <Drawer
            title="Menu"
            placement="left"
            onClose={() => setDrawerOpen(false)}
            open={drawerOpen}
            width={288}
            className="dark:bg-[#3C3C3C]"
            styles={{
              header: {
                padding: 16,
              },
              body: {
                paddingBottom: 20,
                paddingLeft: 0,
                paddingRight: 0,
                paddingTop: 5,
              },
            }}
          >
            <nav className="text-gray-700 dark:text-gray-300">
              {renderMenuItems(mobileSidebarItems)}
            </nav>
            <div className="flex justify-between items-center !mt-4 !mx-3 !p-3 bg-gray-200 dark:bg-neutral-600 rounded-lg">
              <div>Giao diện</div>
              <DarkmodeToggle mobile={true} />
            </div>
          </Drawer>
        </div>
      </nav>
    </>
  );
}
