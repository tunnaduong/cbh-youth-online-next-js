import EmailVerifyClient from "./EmailVerifyClient";

export const metadata = {
  title: "Xác minh email - Diễn đàn học sinh Chuyên Biên Hòa",
  description:
    "Xác minh địa chỉ email tài khoản diễn đàn học sinh Chuyên Biên Hòa để kích hoạt đầy đủ các tính năng.",
  keywords:
    "xác minh email, kích hoạt tài khoản, diễn đàn, học sinh, chuyên biên hòa, cbh",
  openGraph: {
    title: "Xác minh email - Diễn đàn học sinh Chuyên Biên Hòa",
    description:
      "Xác minh địa chỉ email tài khoản diễn đàn học sinh Chuyên Biên Hòa để kích hoạt đầy đủ các tính năng.",
    images: ["/images/cyo_thumbnail.png"],
    type: "website",
  },
};

const EmailVerify = ({ params }) => {
  const { token } = params;
  return <EmailVerifyClient token={token} />;
};

export default EmailVerify;
