import HomeLayout from "@/layouts/HomeLayout";
import SavedClient from "./SavedClient";
import { getServer } from "@/utils/serverFetch";

async function getSavedTopics() {
  try {
    const data = await getServer("/v1.0/user/saved-topics");

    // Try different possible data structures
    if (Array.isArray(data)) {
      return data;
    } else if (data.data && Array.isArray(data.data)) {
      return data.data;
    } else if (data.savedTopics && Array.isArray(data.savedTopics)) {
      return data.savedTopics;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching saved topics:", error);
    return [];
  }
}

export default async function Saved() {
  const savedTopics = await getSavedTopics();

  return (
    <HomeLayout activeNav="home" activeBar="saved">
      <SavedClient savedTopics={savedTopics} />
    </HomeLayout>
  );
}
