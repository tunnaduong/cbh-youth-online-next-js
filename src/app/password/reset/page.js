import PasswordResetClient from "./PasswordResetClient";

export const metadata = {
  title: "Quên mật khẩu - Diễn đàn học sinh Chuyên Biên Hòa",
  description:
    "Khôi phục mật khẩu tài khoản diễn đàn học sinh Chuyên Biên Hòa. Nhập email để nhận liên kết đặt lại mật khẩu.",
  keywords:
    "quên mật khẩu, khôi phục mật khẩu, diễn đàn, học sinh, chuyên biên hòa, cbh",
};

export default function ForgotPassword() {
  return <PasswordResetClient />;
}
