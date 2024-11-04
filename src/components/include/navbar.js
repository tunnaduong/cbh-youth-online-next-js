"use client";

import React from "react";
import Link from "next/link";
import {
  User,
  LogOut,
  Settings,
  HelpCircle,
  Menu,
  ChevronDown,
} from "lucide-react";
import {
  IoSearch,
  IoNotificationsOutline,
  IoChatbubbleOutline,
  IoFlash,
  IoSearchOutline,
} from "react-icons/io5";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthContext } from "@/contexts/Support";
import { logoutRequest } from "@/app/Api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "../ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const menuItems = [
  { name: "Cộng đồng", href: "/" },
  { name: "Báo cáo", href: "/reports" },
  { name: "Tra cứu", href: "/lookup" },
  { name: "Khám phá", href: "/explore" },
];

export default function Navbar({ selected = null }) {
  const { loggedIn, currentUser, setCurrentUser, setUserToken } =
    useAuthContext();
  const [activeItem, setActiveItem] = React.useState(selected);
  const navRef = React.useRef(null);

  const onLogout = (ev) => {
    ev.preventDefault();
    logoutRequest();
    setCurrentUser({});
    setUserToken(null);
    localStorage.clear();
    location.href = "/login";
  };

  const menuItems2 = [
    {
      label: "Cộng đồng",
      icon: "👥",
      href: "/",
      subItems: [
        { icon: "🏠", href: "/", label: "Bảng tin", active: true },
        { icon: "💬", href: "/forum", label: "Diễn đàn" },
        { icon: "📢", href: "/recordings", label: "Loa lớn" },
        { icon: "ℹ️", href: "/youth-news", label: "Tin tức Đoàn" },
        { icon: "🔖", href: "/saved", label: "Đã lưu" },
      ],
    },
    { label: "Báo cáo", icon: "📊", href: "/reports" },
    { label: "Tra cứu", icon: "🔍", href: "/lookup" },
    { label: "Khám phá", icon: "🌟", href: "/explore" },
  ];

  const renderMenuItems = (items, mobile = false) => {
    return items.map((item, index) =>
      item.subItems ? (
        <Collapsible key={index}>
          <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100">
            <span className="flex items-center">
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </span>
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            {item.subItems.map((subItem, subIndex) => (
              <Link
                key={subIndex}
                href={subItem.href}
                className={`flex items-center px-4 py-3 pl-8 text-gray-700 hover:bg-gray-100 ${
                  subItem.active ? "bg-green-50 text-green-600" : ""
                }`}
              >
                <span className="mr-3">{subItem.icon}</span>
                {subItem.label}
              </Link>
            ))}
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <Link
          key={index}
          href={item.href}
          className={`flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 ${
            mobile ? "text-base" : ""
          }`}
        >
          <span className="mr-3">{item.icon}</span>
          {item.label}
        </Link>
      )
    );
  };

  return (
    <>
      {/* Navbar */}
      <nav className="fixed w-[100%] overflow-hidden top-0 bg-white shadow-md leading-[0] flex justify-between">
        <div className="flex flex-row px-6 py-3.5">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden mr-3 min-w-[36px]"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-6">{renderMenuItems(menuItems2, true)}</nav>
            </SheetContent>
          </Sheet>
          {/* Logo */}
          <Link id="logo" href="/" className="inline-block">
            <div className="flex gap-x-1 items-center min-w-max">
              <img
                src="/images/logo.png"
                alt="CYO's Logo"
                className="w-10 h-10"
              />
              <div className="text-[14.5px] font-light text-[#319527] leading-4 hidden lg:block">
                <h1>Thanh niên</h1>
                <h1 className="font-bold">Chuyên Biên Hòa Online</h1>
              </div>
            </div>
          </Link>
          {/* Search box */}
          <div className="w-52 lg:flex flex-row items-center bg-[#F7F7F7] rounded-lg pr-1 ml-7 pl-1 hidden">
            <input
              type="text"
              placeholder="Tìm kiếm"
              className="w-full bg-[#F7F7F7] text-[13px] p-2 rounded-lg pr-1"
            />
            <div className="bg-white rounded-lg min-w-[30px] h-[30px] border-[#F0F0F0] border-[2px] flex items-center justify-center cursor-pointer search-btn">
              <IoSearch className="text-[16px] text-[#6B6B6B]" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-x-5">
          {/* Main menu */}
          <div
            className="h-full items-center flex flex-row gap-x-3 relative"
            ref={navRef}
          >
            {menuItems.map((item, index) => (
              <Link
                href={item.href}
                className={`lg:flex px-3 py-2 mr-5 hidden h-full items-center text-center text-sm font-medium transition-colors duration-200 ${
                  index === activeItem
                    ? "text-green-600 nav-active"
                    : "text-gray-600 menu-btn hover:text-gray-900"
                }`}
                onClick={(e) => {
                  setActiveItem(index);
                }}
                key={index}
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="flex flex-row items-center gap-x-5 mr-4">
            <IoSearchOutline className="lg:hidden cursor-pointer text-[23px] text-[#6B6B6B]" />
            {loggedIn && (
              <>
                <div className="cursor-pointer">
                  <IoChatbubbleOutline className="text-[#6B6B6B] text-[23px]" />
                  <IoFlash className="paw text-[#6B6B6B] text-[23px]" />
                </div>
                <div className="cursor-pointer">
                  <IoNotificationsOutline className="text-[#6B6B6B] text-[23px]" />
                </div>
                {/* new noti icon <div className="bg-red-500 w-[6px] h-[6px] rounded-full absolute translate-x-[13px] -translate-y-5" /> */}
              </>
            )}
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
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
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {loggedIn ? (
                    <>
                      <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
                      <DropdownMenuItem className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Trang cá nhân</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Cài đặt</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
                        <HelpCircle className="mr-2 h-4 w-4" />
                        <span>Trợ giúp</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={onLogout}
                        className="cursor-pointer"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Đăng xuất</span>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <Link href={"/login"}>
                      <DropdownMenuItem className="cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Đăng nhập</span>
                      </DropdownMenuItem>
                    </Link>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        {/* <div id="myModal" class="modal"></div> */}
      </nav>
    </>
  );
}
