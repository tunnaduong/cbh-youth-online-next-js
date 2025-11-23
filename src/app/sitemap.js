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

// Fetch recent posts (for sitemap)
async function getRecentPosts() {
  try {
    // Try to fetch with a large per_page, but API might paginate
    const response = await fetch(
      `${baseURL}/v1.0/topics?per_page=1000&page=1`,
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
      return [];
    }

    const data = await response.json();
    // Handle both paginated and non-paginated responses
    let posts = [];
    if (Array.isArray(data)) {
      posts = data;
    } else if (data.data && Array.isArray(data.data)) {
      posts = data.data;
    } else if (data.topics && Array.isArray(data.topics)) {
      posts = data.topics;
    }

    // Limit to 5000 most recent posts for sitemap
    return posts.slice(0, 5000);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
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
    // Generate slug from title if needed
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]+/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .replace(/(^-|-$)/g, ""); // Remove leading/trailing hyphens
    const postSlug = slug ? `${postId}-${slug}` : `${postId}`;

    // Handle different date formats
    let lastModified = new Date();
    if (post.updated_at) {
      lastModified = new Date(post.updated_at);
    } else if (post.created_at) {
      lastModified = new Date(post.created_at);
    }

    return {
      url: `${siteURL}/${username}/posts/${postSlug}`,
      lastModified: lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    };
  });

  return [...baseRoutes, ...forumRoutes, ...postRoutes];
}
