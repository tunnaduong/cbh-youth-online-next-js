// components/SkeletonPost.js
import React from "react";

const SkeletonPost = () => {
  return (
    <div className="max-w-[485px] mb-5 long-shadow w-[100%] h-min flex flex-row rounded-lg p-3.5 bg-white animate-pulse">
      <div className="min-w-[60px] items-center mt-1 flex-col flex ml-[-15px] text-[13px] font-semibold text-gray-400">
        <div className="h-12 w-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-6 w-6 bg-gray-200 rounded"></div>
      </div>
      <div className="flex-1 overflow-hidden break-words">
        <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 w-full bg-gray-200 rounded mb-2"></div>
        <hr className="my-3 border-t-2" />
        <div className="flex-row flex text-[9px] items-center">
          <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
          <span className="text-gray-500 ml-1.5">Đăng bởi</span>
          <div className="h-4 w-24 bg-gray-200 rounded ml-1"></div>
          <span className="mb-2 ml-0.5 text-sm text-gray-500">.</span>
          <div className="h-4 w-16 bg-gray-200 rounded ml-1"></div>
          <div className="flex flex-1 flex-row-reverse items-center text-gray-500">
            <div className="h-4 w-12 bg-gray-200 rounded mr-1"></div>
            <div className="h-4 w-12 bg-gray-200 rounded mr-1"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonPost;
