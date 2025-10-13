import RecordingsClient from "./RecordingsClient";
import { getServer } from "@/utils/serverFetch";

export const metadata = {
  title: "Loa lớn - Diễn đàn học sinh Chuyên Biên Hòa",
  openGraph: {
    title: "Loa lớn - Diễn đàn học sinh Chuyên Biên Hòa",
    images: ["/images/cyo_thumbnail.png"],
  },
};

// get recordings from api in server side in serverFetch
const recordings = await getServer("/v1.0/recordings");
console.log(recordings);

export default function Recordings() {
  return <RecordingsClient recordings={recordings} />;
}
