"use client";

import React from "react";
import Link from "next/link";
import { User, LogOut, Settings, HelpCircle } from "lucide-react";
import {
  IoSearch,
  IoNotificationsOutline,
  IoChatbubbleOutline,
  IoFlash,
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

export default function Navbar() {
  const { loggedIn, currentUser, setCurrentUser, setUserToken } =
    useAuthContext();

  const onLogout = (ev) => {
    ev.preventDefault();
    logoutRequest();
    setCurrentUser({});
    setUserToken(null);
    localStorage.clear();
    location.href = "/login";
  };

  return (
    <>
      {/* Navbar */}
      <nav className="px-6 py-3.5 fixed w-[100%] overflow-hidden top-0 bg-white shadow-md leading-[0] flex justify-between">
        <div className="flex flex-row">
          {/* Logo */}
          <Link id="logo" href="/" className="inline-block">
            <div className="flex gap-x-1 items-center">
              <img
                src="/images/logo.png"
                alt="CYO's Logo"
                className="w-10 h-10"
              />
              <div className="text-[14.5px] font-light text-[#319527] leading-4">
                <h1>Thanh niên</h1>
                <h1 className="font-bold">Chuyên Biên Hòa Online</h1>
              </div>
            </div>
          </Link>
          {/* Search box */}
          <div className="w-52 flex flex-row items-center bg-[#F7F7F7] rounded-lg pr-1 ml-7 pl-1">
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
        <div className="flex flex-row-reverse items-center gap-x-5">
          <div className="flex flex-row-reverse items-center gap-x-5 w-24">
            <div>
              {/* <Image
                src="/images/hoangphat.jpeg"
                alt="Account"
                width={70}
                height={70}
                className="min-w-8 min-h-8 rounded-full"
              /> */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="cursor-pointer">
                    {loggedIn && (
                      <AvatarImage
                        src={`${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${currentUser.username}/avatar`}
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
            <div className="cursor-pointer">
              <IoNotificationsOutline className="text-[#6B6B6B] text-[23px]" />
              {/* <div className="bg-red-500 w-[6px] h-[6px] rounded-full absolute translate-x-[13px] -translate-y-5" /> */}
            </div>
            <div className="cursor-pointer">
              <IoChatbubbleOutline className="text-[#6B6B6B] text-[23px]" />
              <IoFlash className="paw text-[#6B6B6B] text-[23px]" />
              {/* <div className="bg-red-500 w-[6px] h-[6px] rounded-full absolute translate-x-[16px] -translate-y-5" /> */}
            </div>
          </div>
          {/* Main menu */}
          <div className="flex flex-row-reverse gap-x-3">
            <Link href="/explore" className="menu-btn mr-14">
              Khám phá
            </Link>
            <Link href="/lookup" className="menu-btn mr-5">
              Tra cứu
            </Link>
            <Link href="/report" className="menu-btn mr-5">
              Báo cáo
            </Link>
            <Link href="/" className="menu-btn nav-active mr-5">
              Cộng đồng
            </Link>
          </div>
        </div>
        {/* <div id="myModal" class="modal"></div> */}
      </nav>
    </>
  );
}
