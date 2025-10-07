import { Chatbubbles } from "react-ionicons";

export default function SkeletonLoader() {
  return (
    <div>
      <div className="px-2.5 xl:min-h-screen py-6 flex justify-center">
        <div className="max-w-[775px] w-[100%] mb-6">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-2 w-[20%]"></div>
          <div className="bg-white dark:!bg-[var(--main-white)] long-shadow rounded-lg p-4 mb-5">
            <div className="animate-pulse">
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
            </div>
          </div>
          <div className="rounded-lg animate-pulse mb-6">
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
                    className="flex-1 bg-gray-100 dark:bg-[#2b2d2c] p-2 px-2 mr-2 rounded-md hidden sm:block"
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
      </div>
    </div>
  );
}
