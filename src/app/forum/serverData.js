// Server-side data fetching functions for forum pages
// These functions run on the server and don't require authentication

const baseURL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.chuyenbienhoa.com";

// Fetch forum categories server-side
export const getForumCategoriesServer = async () => {
  console.log(
    "🔍 Fetching forum categories from:",
    `${baseURL}/v1.0/forum/categories`
  );

  const response = await fetch(`${baseURL}/v1.0/forum/categories`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    cache: "no-store", // Ensure fresh data
  });

  console.log("📊 Response status:", response.status);
  console.log(
    "📊 Response headers:",
    Object.fromEntries(response.headers.entries())
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ API Error:", response.status, errorText);
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log("✅ API Response data:", data);
  return data;
};

// Fetch subforum posts server-side
export const getSubforumPostsServer = async (subforumId) => {
  console.log(
    "🔍 Fetching subforum posts from:",
    `${baseURL}/v1.0/forum/subforums/${subforumId}/topics`
  );

  const response = await fetch(
    `${baseURL}/v1.0/forum/subforums/${subforumId}/topics`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store", // Ensure fresh data
    }
  );

  console.log("📊 Subforum response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Subforum API Error:", response.status, errorText);
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log("✅ Subforum API Response data:", data);
  return data;
};
