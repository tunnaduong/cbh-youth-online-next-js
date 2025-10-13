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
  // get recordings from api in server side in serverFetch
  const recordings = await getServer("/v1.0/recordings");

  return <RecordingsClient recordings={recordings} />;
}
