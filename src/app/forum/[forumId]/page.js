import { getForumCategoriesServer } from "../serverData";
import { notFound } from "next/navigation";
import ForumCategoryClient from "./ForumCategoryClient";
import {
  applyOnPageSeoMetadata,
  enhanceMetadataWithURLs,
  getOgImageURL,
  OG_IMAGE_SIZE,
} from "@/utils/seo";
import { getOnPageSeo } from "@/data/onPageSeo";

// Generate metadata for SEO and social sharing
import { metadata as layoutMetadata } from "@/app/layout";

export async function generateMetadata({ params }) {
  try {
    const { forumId } = params;
    const response = await getForumCategoriesServer();
    const categories = response.data || response; // Handle both wrapped and unwrapped responses
    const category = categories.find((cat) => cat.slug === forumId);

    if (!category) {
      // Fallback to layout metadata if category not found
      return enhanceMetadataWithURLs(
        {
          title:
            layoutMetadata.title?.default ||
            layoutMetadata.title ||
            "Diễn đàn học sinh Chuyên Biên Hòa",
          description:
            layoutMetadata.description ||
            "Diễn đàn học sinh Chuyên Biên Hòa thuộc Trường THPT Chuyên Hà Nam",
          openGraph: layoutMetadata.openGraph,
          twitter: layoutMetadata.twitter,
        },
        `/forum/${forumId}`
      );
    }

    // NOTE: Next.js 13/14 expects the metadata object to be flat for title/description.
    // If you return { title: { default: ... } }, it will not override the <title>.
    // You must return { title: "..." } directly.
    // Also, make sure you do NOT spread ...layoutMetadata at the top level,
    // as it will override your dynamic title/description with the defaults.

    const path = `/forum/${forumId}`;
    const pageSeo = getOnPageSeo(path);
    const dynamicTitle =
      pageSeo?.metaTitle ??
      `${category.name} - Diễn đàn học sinh Chuyên Biên Hòa`;
    const dynamicDescription =
      pageSeo?.metaDescription ??
      (category.description ||
        "Diễn đàn học sinh Chuyên Biên Hòa thuộc Trường THPT Chuyên Hà Nam");

    const ogImage = {
      url: getOgImageURL("/page", {
        title: category.name,
        description: dynamicDescription,
        label: "Diễn đàn",
      }),
      ...OG_IMAGE_SIZE,
      alt: dynamicTitle,
    };

    const baseMetadata = {
      title: dynamicTitle,
      description: dynamicDescription,
      openGraph: {
        ...layoutMetadata.openGraph,
        title: dynamicTitle,
        description: dynamicDescription,
        images: [ogImage],
      },
      twitter: {
        ...layoutMetadata.twitter,
        title: dynamicTitle,
        description: dynamicDescription,
        images: [ogImage.url],
      },
    };

    return applyOnPageSeoMetadata(path, pageSeo, baseMetadata);
  } catch (error) {
    console.error("Error generating metadata:", error);
    // Fallback to layout metadata, but flatten title/description for Next.js
    return enhanceMetadataWithURLs(
      {
        title:
          layoutMetadata.title?.default ||
          layoutMetadata.title ||
          "Diễn đàn học sinh Chuyên Biên Hòa",
        description:
          layoutMetadata.description ||
          "Diễn đàn học sinh Chuyên Biên Hòa thuộc Trường THPT Chuyên Hà Nam",
        openGraph: layoutMetadata.openGraph,
        twitter: layoutMetadata.twitter,
      },
      `/forum/${params.forumId}`
    );
  }
}

export default async function ForumCategory({ params }) {
  let category = null;

  try {
    const { forumId } = params;
    const response = await getForumCategoriesServer();
    const categories = response.data || response; // Handle both wrapped and unwrapped responses
    category = categories.find((cat) => cat.slug === forumId);
  } catch (error) {
    console.error("Error fetching forum category:", error);
    // Continue with category = null, let client component handle it
  }

  return <ForumCategoryClient params={params} initialCategory={category} />;
}
