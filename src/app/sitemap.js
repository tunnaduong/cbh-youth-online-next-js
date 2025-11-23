import { generatePostSlug } from "@/utils/slugify";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.chuyenbienhoa.com";
const siteURL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.chuyenbienhoa.com";

// Fetch forum categories
async function getForumCategories() {
  try {
    const response = await fetch(`${baseURL}/v1.0/forum/categories`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error("Error fetching forum categories:", error);
    return [];
  }
}

// Fetch recent posts (for sitemap) with pagination
async function getRecentPosts() {
  let allPosts = [];
  let currentPage = 1;
  let hasMore = true;
  const postsPerPage = 100; // API default is 10, but we'll try to get more
  const maxPages = 50; // Limit to 50 pages to get up to 5000 posts

  while (hasMore && currentPage <= maxPages) {
    try {
      const response = await fetch(
        `${baseURL}/v1.0/topics?page=${currentPage}&per_page=${postsPerPage}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        console.error(
          `Error fetching posts page ${currentPage}:`,
          response.status
        );
        break;
      }

      const data = await response.json();
      // Handle paginated response from Laravel
      let posts = [];
      if (Array.isArray(data)) {
        posts = data;
      } else if (data.data && Array.isArray(data.data)) {
        posts = data.data;
        // Check if there are more pages
        hasMore = data.current_page < data.last_page;
      } else if (data.topics && Array.isArray(data.topics)) {
        posts = data.topics;
      }

      allPosts = allPosts.concat(posts);

      // If we got fewer posts than requested, we've reached the end
      if (posts.length < postsPerPage) {
        hasMore = false;
      }

      currentPage++;
    } catch (error) {
      console.error(`Error fetching posts page ${currentPage}:`, error);
      break;
    }
  }

  // Limit to 5000 most recent posts for sitemap
  return allPosts.slice(0, 5000);
}

export default async function sitemap() {
  const baseRoutes = [
    {
      url: siteURL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteURL}/feed`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${siteURL}/explore`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteURL}/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${siteURL}/youth-news`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteURL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteURL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteURL}/help`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  // Fetch forum categories and subforums
  const categories = await getForumCategories();
  const forumRoutes = [];

  for (const category of categories) {
    // Add category page
    forumRoutes.push({
      url: `${siteURL}/forum/${category.slug}`,
      lastModified: new Date(category.updated_at || category.created_at),
      changeFrequency: "daily",
      priority: 0.8,
    });

    // Add subforum pages
    if (category.subforums && Array.isArray(category.subforums)) {
      for (const subforum of category.subforums) {
        if (subforum.active) {
          forumRoutes.push({
            url: `${siteURL}/forum/${category.slug}/${subforum.slug}`,
            lastModified: new Date(subforum.updated_at || subforum.created_at),
            changeFrequency: "daily",
            priority: 0.8,
          });
        }
      }
    }
  }

  // Fetch recent posts
  const posts = await getRecentPosts();
  const postRoutes = posts.map((post) => {
    const username = post.anonymous
      ? "anonymous"
      : post.author?.username || "anonymous";
    const postId = post.id;
    const title = post.title || "";

    // Use generatePostSlug from slugify.js for consistent URL generation
    const postSlug = generatePostSlug(postId, title);

    // Handle different date formats
    let lastModified = new Date();
    if (post.updated_at) {
      lastModified = new Date(post.updated_at);
    } else if (post.created_at) {
      lastModified = new Date(post.created_at);
    }

    // Ensure full URL with siteURL
    return {
      url: `${siteURL}/${username}/posts/${postSlug}`,
      lastModified: lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    };
  });

  return [...baseRoutes, ...forumRoutes, ...postRoutes];
}
