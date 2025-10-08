import RegisterClient from "./RegisterClient";

export const metadata = {
  title: "Đăng ký - Diễn đàn học sinh Chuyên Biên Hòa",
  description:
    "Đăng ký tài khoản mới trên diễn đàn học sinh Chuyên Biên Hòa để tham gia cộng đồng và kết nối với bạn bè.",
  keywords: "đăng ký, tạo tài khoản, diễn đàn, học sinh, chuyên biên hòa, cbh",
};

export default function RegisterScreen() {
  return <RegisterClient />;
}
