const SkeletonPost = () => {
  return (
    <div className="w-full md:max-w-[775px] mb-4 !p-6 long-shadow h-min flex flex-row rounded-lg bg-white dark:!bg-[var(--main-white)] animate-pulse">
      <div className="min-w-[80px] items-center mt-1 flex-col md:flex ml-[-15px] text-[13px] font-semibold text-gray-400 hidden">
        <div className="h-16 w-6 bg-gray-200 dark:bg-neutral-600 rounded mb-3" />
        <div className="h-8 w-8 bg-gray-200 dark:bg-neutral-600 rounded" />
      </div>
      <div className="flex-1 overflow-hidden break-words">
        <div className="h-6 w-64 bg-gray-200 dark:bg-neutral-600 rounded mb-2" />
        <div className="h-6 w-full bg-gray-200 dark:bg-neutral-600 rounded mb-2" />
        <hr className="my-3 border-t-2" />
        <div className="flex-row flex text-[14px] items-center">
          <div className="min-h-7 min-w-7 bg-gray-200 dark:bg-neutral-600 rounded-full" />
          <div className="h-5 w-24 bg-gray-200 dark:bg-neutral-600 rounded ml-2" />
          <span className="mb-2 ml-1 text-sm text-gray-500">.</span>
          <div className="h-5 w-24 bg-gray-200 dark:bg-neutral-600 rounded ml-1" />
          <div className="flex-1 flex-row-reverse items-center text-gray-500 md:flex hidden">
            <div className="h-5 w-12 bg-gray-200 dark:bg-neutral-600 rounded mr-1" />
            <div className="h-5 w-12 bg-gray-200 dark:bg-neutral-600 rounded mr-1" />
          </div>
        </div>
        <div className="flex md:hidden mt-3 items-center">
          <div className="h-6 w-20 bg-gray-200 dark:bg-neutral-600 rounded mr-3" />
          <div className="h-8 w-8 bg-gray-200 dark:bg-neutral-600 rounded" />
          <div className="flex-1 flex-row-reverse items-center text-gray-500 md:hidden flex">
            <div className="h-5 w-12 bg-gray-200 dark:bg-neutral-600 rounded mr-1" />
            <div className="h-5 w-12 bg-gray-200 dark:bg-neutral-600 rounded mr-1" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonPost;
