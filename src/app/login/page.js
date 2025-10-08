import LoginClient from "./LoginClient";

export const metadata = {
  title: "Đăng nhập - Diễn đàn học sinh Chuyên Biên Hòa",
  description:
    "Đăng nhập vào diễn đàn học sinh Chuyên Biên Hòa để tham gia thảo luận và kết nối với cộng đồng.",
  keywords: "đăng nhập, diễn đàn, học sinh, chuyên biên hòa, cbh",
};

export default function Login() {
  return <LoginClient />;
}
