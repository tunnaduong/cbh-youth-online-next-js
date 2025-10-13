import YouthNewsClient from "./YouthNewsClient";

export const metadata = {
  title: "Tin tức Đoàn - Diễn đàn học sinh Chuyên Biên Hòa",
  description:
    "Cập nhật tin tức mới nhất về Đoàn trường, hoạt động học sinh và các sự kiện tại trường Chuyên Biên Hòa.",
  keywords:
    "tin tức Đoàn, hoạt động học sinh, sự kiện, chuyên biên hòa, cbh, Đoàn",
  openGraph: {
    title: "Tin tức Đoàn - Diễn đàn học sinh Chuyên Biên Hòa",
    description:
      "Cập nhật tin tức mới nhất về Đoàn trường, hoạt động học sinh và các sự kiện tại trường Chuyên Biên Hòa.",
    images: ["/images/cyo_thumbnail.png"],
    type: "website",
  },
};

export default function YouthNews() {
  return <YouthNewsClient />;
}
