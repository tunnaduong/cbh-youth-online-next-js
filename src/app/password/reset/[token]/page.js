import PasswordResetTokenClient from "./PasswordResetTokenClient";

export const metadata = {
  title: "Đặt lại mật khẩu - Diễn đàn học sinh Chuyên Biên Hòa",
  description:
    "Đặt lại mật khẩu mới cho tài khoản diễn đàn học sinh Chuyên Biên Hòa. Nhập mật khẩu mới để hoàn tất quá trình khôi phục.",
  keywords:
    "đặt lại mật khẩu, mật khẩu mới, diễn đàn, học sinh, chuyên biên hòa, cbh",
};

export default function PasswordReset({ params }) {
  const { token } = params;
  return <PasswordResetTokenClient token={token} />;
}
