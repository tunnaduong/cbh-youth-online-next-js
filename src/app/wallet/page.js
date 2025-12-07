import WalletClient from "./WalletClient";
import { enhanceMetadataWithURLs } from "@/utils/seo";

export const metadata = enhanceMetadataWithURLs(
  {
    title: "Ví điểm - Diễn đàn học sinh Chuyên Biên Hòa",
    description: "Quản lý ví điểm và lịch sử giao dịch",
  },
  "/wallet"
);

export default function Wallet() {
  return <WalletClient />;
}



