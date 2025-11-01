"use client";

import React from "react";
import {
  HomeOutline,
  BookOutline,
  SearchOutline,
  MapOutline,
  PrintOutline,
  HelpCircle,
  GameControllerOutline,
  TrophyOutline,
  PeopleOutline,
} from "react-ionicons";

export default function ExploreClient() {
  const features = [
    { icon: HomeOutline, title: "Trang chủ" },
    { icon: BookOutline, title: "Tài liệu ôn thi" },
    { icon: SearchOutline, title: "Tra cứu điểm thi" },
    { icon: MapOutline, title: "Tìm trường ĐH-CĐ" },
    { icon: PrintOutline, title: "In ấn tài liệu" },
    { icon: HelpCircle, title: "Đố vui" },
    { icon: GameControllerOutline, title: "Game" },
    { icon: TrophyOutline, title: "Xếp hạng thành viên" },
    { icon: PeopleOutline, title: "Xếp hạng lớp" },
  ];

  return (
    <main className="flex-1 p-8 ml-64">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <div
              key={index}
              className="feature-card bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md p-6 flex flex-col items-center cursor-pointer hover:scale-105 transition-all duration-200"
            >
              <div className="icon-circle bg-green-50 dark:bg-green-900/20 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <IconComponent color="#319527" height="28px" width="28px" />
              </div>
              <h3 className="mt-4 text-center text-gray-900 dark:text-gray-100 font-medium">
                {feature.title}
              </h3>
            </div>
          );
        })}
      </div>
    </main>
  );
}
