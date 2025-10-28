"use client";

import { useState, useEffect } from "react";
import { message, Modal } from "antd";
import SavedPostItem from "./partials/SavedPostItem";
import { unsavePost } from "@/app/Api";
import Image from "next/image";

export default function SavedClient({ savedTopics }) {
  const [topics, setTopics] = useState(savedTopics);

  // Update topics when savedTopics prop changes
  useEffect(() => {
    setTopics(savedTopics);
  }, [savedTopics]);

  const handleRemove = async (savedPostId) => {
    Modal.confirm({
      title: "Xác nhận bỏ lưu",
      content: "Bạn có chắc chắn muốn bỏ lưu bài viết này không?",
      okText: "Bỏ lưu",
      cancelText: "Hủy",
      okType: "danger",
      onOk: async () => {
        try {
          await unsavePost(savedPostId);
          message.success("Đã bỏ lưu bài viết");
          // Remove from local state
          setTopics(topics.filter((topic) => topic.topic.id !== savedPostId));
        } catch (error) {
          console.error("Error removing saved post:", error);
          message.error("Có lỗi xảy ra khi bỏ lưu bài viết");
        }
      },
    });
  };

  return (
    <div className="px-3 xl:min-h-screen py-4 md:max-w-[775px] mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Đã lưu
      </h1>

      {topics.length === 0 ? (
        <div className="text-center py-12">
          <Image
            src="/images/sad_frog.png"
            alt="Empty state"
            width={136}
            height={136}
            className="mx-auto"
          />
          <p className="text-gray-500 dark:text-gray-400">
            Chưa có bài viết nào được lưu
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {topics.map((topic) => (
            <SavedPostItem
              key={topic.id}
              post={topic}
              onUnsave={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
