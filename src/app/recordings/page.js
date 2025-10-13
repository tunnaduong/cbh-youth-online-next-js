import RecordingsClient from "./RecordingsClient";
import { getServer } from "@/utils/serverFetch";

export const metadata = {
  title: "Loa lớn - Diễn đàn học sinh Chuyên Biên Hòa",
  openGraph: {
    title: "Loa lớn - Diễn đàn học sinh Chuyên Biên Hòa",
    images: ["/images/cyo_thumbnail.png"],
  },
};

export default async function Recordings() {
  let recordings = null;
  let error = null;

  try {
    // get recordings from api in server side in serverFetch
    recordings = await getServer("/v1.0/recordings");
  } catch (err) {
    console.error("Failed to fetch recordings:", err);
    error = {
      message: "Không thể tải dữ liệu từ server. Vui lòng thử lại sau.",
      status: err.message || "Unknown error",
    };
  }

  return <RecordingsClient recordings={recordings} error={error} />;
}
