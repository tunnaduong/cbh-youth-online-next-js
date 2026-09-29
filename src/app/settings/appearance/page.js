import AppearanceClient from "./AppearanceClient";

export async function generateMetadata() {
  return {
    title: "Giao diện hồ sơ - Diễn đàn học sinh Chuyên Biên Hòa",
    description: "Tùy chỉnh giao diện trang cá nhân",
  };
}

export default function AppearancePage() {
  return <AppearanceClient />;
}
