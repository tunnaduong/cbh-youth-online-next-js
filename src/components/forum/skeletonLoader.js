import React from "react";
import { Chatbubbles } from "react-ionicons";

const SkeletonLoader = () => {
  return (
    <div className="max-w-[775px] w-[100%]">
      <div className="rounded-lg animate-pulse mb-6">
        {/* Skeleton for the item title */}
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-2 w-[30%]"></div>
        <div className="bg-white dark:!bg-[var(--main-white)] rounded-lg long-shadow">
          {/* Skeleton for the subforum items */}
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="flex flex-row items-center min-h-[78px] pr-2"
            >
              <Chatbubbles
                color="#9CA3AF"
                height="32px"
                width="32px"
                className="p-4"
              />
              <div className="flex flex-col flex-1">
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-1 w-1/3"></div>
                <div className="flex items-center">
                  <span className="text-gray-400 dark:text-gray-500 text-sm"></span>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mr-1"></div>
                  <span className="text-gray-400 dark:text-gray-500 text-sm mr-1"></span>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                </div>
              </div>
              <div
                style={{ maxWidth: "calc(42%)" }}
                className="flex-1 bg-gray-100 dark:bg-[#2b2d2c] p-2 px-2 mr-2 rounded-md"
              >
                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded mb-1 w-2/3"></div>
                <div className="flex items-center mt-1 text-gray-400 dark:text-gray-500">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mr-1"></div>
                  <span className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></span>
                </div>
              </div>
              <hr className="border-gray-200 dark:border-[#545454]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;
