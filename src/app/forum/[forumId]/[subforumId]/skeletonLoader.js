export default function SkeletonLoader() {
  return (
    <div className="px-2.5 min-h-screen py-6 flex justify-center">
      <div className="max-w-[775px] w-full">
        {/* Breadcrumb skeleton */}
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-2 w-[40%]"></div>

        {/* Forum Header skeleton */}
        <div className="bg-white dark:!bg-[var(--main-white)] long-shadow rounded-lg mt-2 p-4 mb-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
          </div>
        </div>

        {/* Forum Topics Table skeleton */}
        <div className="bg-white dark:!bg-[var(--main-white)] rounded-lg long-shadow overflow-hidden">
          <div className="bg-gray-100 dark:!bg-neutral-600 p-3">
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/6 hidden sm:block"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/6 hidden sm:block"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4"></div>
            </div>
          </div>

          {/* Skeleton for topic rows */}
          {[...Array(5)].map((_, index) => (
            <div
              key={index}
              className="border-b border-gray-200 dark:border-neutral-600 p-3"
            >
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                  <div className="flex items-center gap-x-2">
                    <div className="h-6 w-6 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/6"></div>
                  </div>
                  <div className="flex sm:hidden mt-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4 ml-auto"></div>
                  </div>
                </div>
                <div className="hidden sm:block text-center w-16">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-8 mx-auto"></div>
                </div>
                <div className="hidden sm:block text-center w-16">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-8 mx-auto"></div>
                </div>
                <div className="hidden sm:block text-right w-32">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 ml-auto mb-1"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-20 ml-auto"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
