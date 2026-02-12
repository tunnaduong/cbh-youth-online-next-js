import ShopClient from "./ShopClient";
import { enhanceMetadataWithURLs } from "@/utils/seo";

export async function generateMetadata() {
  const baseMetadata = {
    title: "CBH Gift Shop - Quà tặng Chuyên Biên Hòa",
    description: "Sở hữu ngay những món quà lưu niệm độc quyền từ Chuyên Biên Hòa. Từ móc chìa khóa đến áo thun thiết kế riêng.",
    keywords: "gift shop, quà tặng, chuyên biên hòa, cbh, áo thun cbh, móc chìa khóa cbh",
    openGraph: {
      title: "CBH Gift Shop - Quà tặng Chuyên Biên Hòa",
      description: "Sở hữu ngay những món quà lưu niệm độc quyền từ Chuyên Biên Hòa. Từ móc chìa khóa đến áo thun thiết kế riêng.",
      images: ["/images/cyo_thumbnail.png"],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "CBH Gift Shop - Quà tặng Chuyên Biên Hòa",
      description: "Sở hữu ngay những món quà lưu niệm độc quyền từ Chuyên Biên Hòa. Từ móc chìa khóa đến áo thun thiết kế riêng.",
      images: ["/images/cyo_thumbnail.png"],
    },
  };

  return enhanceMetadataWithURLs(baseMetadata, "/shop");
}

export default function ShopPage() {
  return <ShopClient />;
}
