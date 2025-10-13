import RegisterClient from "./RegisterClient";

export const metadata = {
  title: "Đăng ký - Diễn đàn học sinh Chuyên Biên Hòa",
  description:
    "Đăng ký tài khoản mới trên diễn đàn học sinh Chuyên Biên Hòa để tham gia cộng đồng và kết nối với bạn bè.",
  keywords: "đăng ký, tạo tài khoản, diễn đàn, học sinh, chuyên biên hòa, cbh",
  openGraph: {
    title: "Đăng ký - Diễn đàn học sinh Chuyên Biên Hòa",
    description:
      "Đăng ký tài khoản mới trên diễn đàn học sinh Chuyên Biên Hòa để tham gia cộng đồng và kết nối với bạn bè.",
    images: ["/images/cyo_thumbnail.png"],
    type: "website",
  },
};

export default function RegisterScreen() {
  return <RegisterClient />;
}
