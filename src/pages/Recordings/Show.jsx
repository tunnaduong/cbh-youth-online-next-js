import HomeLayout from "@/layouts/HomeLayout";
import Head from "next/head";

export default function Show({ recording }) {
  return (
    <HomeLayout>
      <Head title="Loa lớn" />
      <div className="px-1 xl:min-h-screen pt-4 md:max-w-[775px] mx-auto"></div>
    </HomeLayout>
  );
}
