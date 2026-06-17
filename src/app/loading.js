import LoadingScreen from "@/components/ui/LoadingScreen";

export default function Loading() {
  return (
    <LoadingScreen isLoading={true}>
      <div className="w-full min-h-screen bg-[#F8F8F8] dark:bg-neutral-800" />
    </LoadingScreen>
  );
}
