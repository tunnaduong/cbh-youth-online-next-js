import WithdrawClient from "./WithdrawClient";
import { enhanceMetadataWithURLs } from "@/utils/seo";

export const metadata = enhanceMetadataWithURLs(
  {
    title: "Rút tiền - Diễn đàn học sinh Chuyên Biên Hòa",
    description: "Yêu cầu rút tiền từ ví điểm",
  },
  "/wallet/withdraw"
);

export default function Withdraw() {
  return <WithdrawClient />;
}



