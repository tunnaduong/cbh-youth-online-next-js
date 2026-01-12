"use client";

import HomeLayout from "@/layouts/HomeLayout";
import React from "react";
import Image from "next/image";
import { message } from "antd";
import {
  HomeOutline,
  Home,
  BookOutline,
  Book,
  SearchOutline,
  Search,
  MapOutline,
  Map,
  PrintOutline,
  Print,
  HelpCircle,
  GameControllerOutline,
  GameController,
  TrophyOutline,
  Trophy,
  PeopleOutline,
  People,
} from "react-ionicons";

export default function ExploreClient() {
  const features = [
    {
      icon: HomeOutline,
      sidebarIcon: Home,
      title: "Trang chủ",
      key: "home",
      href: "/explore",
    },
    {
      icon: BookOutline,
      sidebarIcon: Book,
      title: "Chợ tài liệu",
      key: "study",
      href: "/explore/study-materials",
    },
    {
      icon: SearchOutline,
      sidebarIcon: Search,
      title: "Tra cứu điểm thi",
      key: "grades",
      href: "/lookup/grades",
    },
    {
      icon: MapOutline,
      sidebarIcon: Map,
      title: "Tìm trường ĐH-CĐ",
      key: "universities",
      href: "#",
    },
    {
      icon: PrintOutline,
      sidebarIcon: Print,
      title: "In ấn tài liệu",
      key: "print",
      href: "#",
    },
    {
      icon: HelpCircle,
      sidebarIcon: HelpCircle,
      title: "Đố vui",
      key: "quiz",
      href: "#",
    },
    {
      icon: GameControllerOutline,
      sidebarIcon: GameController,
      title: "Game",
      key: "game",
      href: "#",
    },
    {
      icon: TrophyOutline,
      sidebarIcon: Trophy,
      title: "Xếp hạng thành viên",
      key: "ranking",
      href: "/users/ranking",
    },
    {
      icon: PeopleOutline,
      sidebarIcon: People,
      title: "Xếp hạng lớp",
      key: "class-ranking",
      href: "#",
    },
  ];

  const handleFeatureClick = (e, feature) => {
    if (feature.href === "#") {
      e.preventDefault();
      message.info("Chức năng đang phát triển");
    }
  };

  // Convert features to LeftSidebar items format (using non-outline icons)
  const sidebarItems = features.map((feature) => ({
    key: feature.key,
    href: feature.href,
    label: feature.title,
    Icon: feature.sidebarIcon,
    isExternal: false,
    onClick: (e) => handleFeatureClick(e, feature),
  }));

  return (
    <HomeLayout
      activeNav="explore"
      activeBar="home"
      sidebarItems={sidebarItems}
      sidebarType="all"
      showRightSidebar={false}
      sidebarWidth="306px"
    >
      <div className="px-2.5">
        <main className="px-1 xl:min-h-screen py-4 md:max-w-[936px] mx-auto">
          {/* <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Khám phá
          </h1> */}

          {/* Welcome Section */}
          <div className="relative">
            <div className="relative flex flex-col md:flex-row items-center justify-between">
              {/* Left side - Welcome message */}
              <div className="flex-1 mb-6 md:mb-0 md:mr-8 px-8">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                  Chào bạn, <br /> hôm nay bạn muốn{" "}
                  <span className="text-orange-500 dark:text-orange-400">
                    làm gì...?
                  </span>
                </h2>
              </div>

              {/* Right side - Student image */}
              <div className="relative flex-shrink-0 w-full md:w-auto md:mr-8">
                <div className="relative w-64 h-64 mx-auto my-4 md:mx-0">
                  <Image
                    src="/images/student_girl.png"
                    alt="Học sinh"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {features
              .filter((feature) => feature.key !== "home")
              .map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <a
                    key={index}
                    href={feature.href}
                    onClick={(e) => handleFeatureClick(e, feature)}
                    className="feature-card bg-white dark:bg-neutral-800 rounded-xl shadow-sm hover:shadow-md p-6 flex flex-col items-center cursor-pointer hover:scale-105 transition-all duration-200"
                  >
                    <div className="icon-circle bg-green-50 dark:bg-green-900/20 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                      <IconComponent
                        color="#319527"
                        height="28px"
                        width="28px"
                      />
                    </div>
                    <h3 className="mt-4 text-center text-gray-900 dark:text-gray-100 font-medium">
                      {feature.title}
                    </h3>
                  </a>
                );
              })}
          </div>
        </main>
      </div>
    </HomeLayout>
  );
}
