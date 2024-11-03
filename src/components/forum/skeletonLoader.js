import React from "react";
import { IoChatbubblesSharp } from "react-icons/io5";

const SkeletonLoader = () => {
  return (
    <div className="max-w-lg w-[100%]">
      <div className="rounded-lg animate-pulse mb-6">
        {/* Skeleton for the item title */}
        <div className="h-4 bg-gray-300 rounded mb-2 w-[30%]"></div>
        <div className="bg-white rounded-lg long-shadow">
          {/* Skeleton for the subforum items */}
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex flex-row items-center mb-4">
              <IoChatbubblesSharp className="text-gray-400 text-[23px] m-4" />
              <div className="flex flex-col flex-1">
                <div className="h-4 bg-gray-300 rounded mb-1 w-1/3"></div>
                <div className="flex items-center">
                  <span className="text-gray-400 text-[10px]"></span>
                  <div className="h-3 bg-gray-300 rounded w-1/4 mr-1"></div>
                  <span className="text-gray-400 text-[10px] mr-1"></span>
                  <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                </div>
              </div>
              <div
                style={{ maxWidth: "calc(42%)" }}
                className="flex-1 bg-gray-100 p-1 px-2 mr-2 rounded-md"
              >
                <div className="h-4 bg-gray-300 rounded mb-1 w-2/3"></div>
                <div className="flex items-center mt-1 text-gray-400">
                  <div className="h-3 bg-gray-300 rounded w-1/4 mr-1"></div>
                  <span className="h-3 bg-gray-300 rounded w-1/3"></span>
                </div>
              </div>
              <hr />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg animate-pulse">
        {/* Skeleton for the item title */}
        <div className="h-4 bg-gray-300 rounded mb-2 w-[30%]"></div>
        <div className="bg-white rounded-lg long-shadow">
          {/* Skeleton for the subforum items */}
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex flex-row items-center mb-4">
              <IoChatbubblesSharp className="text-gray-400 text-[23px] m-4" />
              <div className="flex flex-col flex-1">
                <div className="h-4 bg-gray-300 rounded mb-1 w-1/3"></div>
                <div className="flex items-center">
                  <span className="text-gray-400 text-[10px]"></span>
                  <div className="h-3 bg-gray-300 rounded w-1/4 mr-1"></div>
                  <span className="text-gray-400 text-[10px] mr-1"></span>
                  <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                </div>
              </div>
              <div
                style={{ maxWidth: "calc(42%)" }}
                className="flex-1 bg-gray-100 p-1 px-2 mr-2 rounded-md"
              >
                <div className="h-4 bg-gray-300 rounded mb-1 w-2/3"></div>
                <div className="flex items-center mt-1 text-gray-400">
                  <div className="h-3 bg-gray-300 rounded w-1/4 mr-1"></div>
                  <span className="h-3 bg-gray-300 rounded w-1/3"></span>
                </div>
              </div>
              <hr />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;
