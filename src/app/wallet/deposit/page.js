import DepositClient from "./DepositClient";
import { enhanceMetadataWithURLs } from "@/utils/seo";

export const metadata = enhanceMetadataWithURLs(
  {
    title: "Nạp tiền - Diễn đàn học sinh Chuyên Biên Hòa",
    description: "Nạp tiền vào ví điểm",
  },
  "/wallet/deposit"
);

export default function Deposit() {
  return <DepositClient />;
}



