import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// ==========================================
// 1. SITE SETTINGS CACHE
// ==========================================
export const getCachedSiteSettings = unstable_cache(
  async () => {
    try {
      const settings = await prisma.siteSettings.findUnique({
        where: { id: "default" },
      });
      if (settings) return settings;

      return await prisma.siteSettings.create({
        data: {
          id: "default",
          siteName: "Blog",
          metaDescription: "Информационный портал о последних новостях и разработках в области искусственного интеллекта",
        },
      });
    } catch {
      return {
        id: "default",
        siteName: "Blog",
        metaDescription: "Информационный портал о последних новостях и разработках в области искусственного интеллекта",
        logoUrl: null,
        faviconUrl: null,
        footerText: null,
        homeSubtitle: null,
      };
    }
  },
  ["site-settings-global"],
  {
    revalidate: 3600, // 1 hour
    tags: ["settings"],
  }
);

// ==========================================
// 2. POSTS LIST CACHE
// ==========================================
interface GetPostsOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
}

export const getCachedPosts = async (options: GetPostsOptions = {}) => {
  const page = options.page || 1;
  const limit = options.limit || 9;
  const search = options.search || "";
  const sortBy = options.sortBy || "newest";

  const fetcher = unstable_cache(
    async () => {
      const searchQueryLower = search.toLowerCase();
      const searchQueryCapitalized =
        search.charAt(0).toUpperCase() + search.slice(1).toLowerCase();

      const whereClause = search
        ? {
            OR: [
              { title: { contains: search } },
              { title: { contains: searchQueryLower } },
              { title: { contains: searchQueryCapitalized } },
              { excerpt: { contains: search } },
              { excerpt: { contains: searchQueryLower } },
              { excerpt: { contains: searchQueryCapitalized } },
            ],
          }
        : {};

      const showFeatured = page === 1 && !search && sortBy === "newest";
      const postsToTake = showFeatured ? limit + 1 : limit;

      const orderBy =
        sortBy === "popular"
          ? { views: "desc" as const }
          : { publishedAt: "desc" as const };

      const [totalPosts, posts, allPostsForTags] = await Promise.all([
        prisma.post.count({ where: whereClause }),
        prisma.post.findMany({
          where: whereClause,
          take: postsToTake,
          skip: (page - 1) * limit,
          orderBy,
          include: {
            author: {
              select: { id: true, name: true, username: true, avatarUrl: true },
            },
          },
        }),
        prisma.post.findMany({
          select: { tags: true },
          take: 50,
          orderBy: { publishedAt: "desc" },
        }),
      ]);

      const totalPages = Math.ceil(
        (totalPosts - (showFeatured ? 1 : 0)) / limit
      );

      return {
        totalPosts,
        posts,
        allPostsForTags,
        totalPages,
        showFeatured,
      };
    },
    [`posts-feed-${page}-${limit}-${search}-${sortBy}`],
    {
      revalidate: 300, // 5 minutes
      tags: ["posts"],
    }
  );

  return fetcher();
};

// ==========================================
// 3. SINGLE POST BY SLUG CACHE
// ==========================================
export const getCachedPostBySlug = async (slug: string) => {
  const fetcher = unstable_cache(
    async () => {
      return prisma.post.findUnique({
        where: { slug },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true,
              bio: true,
              publicEmail: true,
              showEmail: true,
              telegram: true,
              vk: true,
              twitter: true,
              github: true,
              linkedin: true,
              website: true,
            },
          },
        },
      });
    },
    [`post-detail-${slug}`],
    {
      revalidate: 600, // 10 minutes
      tags: ["posts", `post:${slug}`],
    }
  );

  return fetcher();
};

// ==========================================
// 4. CATEGORIES CACHE
// ==========================================
export const getCachedCategories = unstable_cache(
  async () => {
    return prisma.softwareCategory.findMany({
      include: {
        children: true,
      },
      orderBy: { name: "asc" },
    });
  },
  ["categories-hierarchy"],
  {
    revalidate: 3600, // 1 hour
    tags: ["categories"],
  }
);

// ==========================================
// 5. TOOLS DIRECTORY CACHE
// ==========================================
interface ToolsDirectoryOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  pricing?: string;
  developer?: string;
  license?: string;
  features?: string[];
}

export const getCachedToolsDirectory = async (options: ToolsDirectoryOptions = {}) => {
  const page = Math.max(1, options.page || 1);
  const limit = options.limit || 24;
  const search = options.search || "";
  const category = options.category || "";
  const pricing = options.pricing || "";
  const developer = options.developer || "";
  const license = options.license || "";
  const features = options.features || [];

  const cacheKey = `tools-dir-p${page}-l${limit}-s${search}-c${category}-pr${pricing}-dev${developer}-lic${license}-f${features.join("_")}`;

  const fetcher = unstable_cache(
    async () => {
      const whereClause: any = {
        isAi: true,
        status: "APPROVED",
      };

      if (search) {
        whereClause.OR = [
          { name: { contains: search.toLowerCase() } },
          { shortDesc: { contains: search.toLowerCase() } },
        ];
      }

      if (category && category !== "all") {
        whereClause.category = { slug: category };
      }

      if (developer && developer !== "all") {
        whereClause.developer = developer;
      }

      if (pricing && pricing !== "all") {
        whereClause.pricing = pricing;
      }

      if (license && license !== "all") {
        whereClause.licenseType = license;
      }

      if (features.length > 0) {
        whereClause.AND = features.map((feat) => ({
          aiSpecs: { contains: feat },
        }));
      }

      const [categories, totalItems, tools, distinctDevelopers, distinctPricing, distinctLicenses] =
        await Promise.all([
          prisma.softwareCategory.findMany({
            where: {
              tools: {
                some: { isAi: true, status: "APPROVED" },
              },
            },
            orderBy: { name: "asc" },
          }),
          prisma.software.count({ where: whereClause }),
          prisma.software.findMany({
            where: whereClause,
            include: { category: true },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
          }),
          prisma.software.findMany({
            where: { isAi: true, status: "APPROVED", developer: { not: null } },
            select: { developer: true },
            distinct: ["developer"],
          }),
          prisma.software.findMany({
            where: { isAi: true, status: "APPROVED", pricing: { not: "" } },
            select: { pricing: true },
            distinct: ["pricing"],
          }),
          prisma.software.findMany({
            where: { isAi: true, status: "APPROVED", licenseType: { not: null } },
            select: { licenseType: true },
            distinct: ["licenseType"],
          }),
        ]);

      const totalPages = Math.ceil(totalItems / limit);

      return {
        categories,
        totalItems,
        tools,
        distinctDevelopers,
        distinctPricing,
        distinctLicenses,
        totalPages,
      };
    },
    [cacheKey],
    {
      revalidate: 300, // 5 minutes
      tags: ["tools"],
    }
  );

  return fetcher();
};

// ==========================================
// 6. SOFTWARE DIRECTORY CACHE
// ==========================================
interface SoftwareDirectoryOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  pricing?: string;
  license?: string;
  platform?: string;
}

export const getCachedSoftwareDirectory = async (options: SoftwareDirectoryOptions = {}) => {
  const page = Math.max(1, options.page || 1);
  const limit = options.limit || 20;
  const search = options.search || "";
  const category = options.category || "";
  const pricing = options.pricing || "";
  const license = options.license || "";
  const platform = options.platform || "";

  const cacheKey = `sw-dir-p${page}-l${limit}-s${search}-c${category}-pr${pricing}-lic${license}-pl${platform}`;

  const fetcher = unstable_cache(
    async () => {
      const whereClause: any = {
        isAi: false,
        status: "APPROVED",
      };

      if (search) {
        whereClause.OR = [
          { name: { contains: search.toLowerCase() } },
          { shortDesc: { contains: search.toLowerCase() } },
        ];
      }

      if (category && category !== "all") {
        whereClause.category = { slug: category };
      }

      if (pricing && pricing !== "all") {
        whereClause.pricing = pricing;
      }

      if (license && license !== "all") {
        whereClause.licenseType = license;
      }

      if (platform && platform !== "all") {
        whereClause.platforms = { contains: platform };
      }

      const [categories, totalItems, tools, distinctPricing, distinctLicenses] =
        await Promise.all([
          prisma.softwareCategory.findMany({
            where: {
              tools: {
                some: { isAi: false, status: "APPROVED" },
              },
            },
            orderBy: { name: "asc" },
          }),
          prisma.software.count({ where: whereClause }),
          prisma.software.findMany({
            where: whereClause,
            include: { category: true },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
          }),
          prisma.software.findMany({
            where: { isAi: false, status: "APPROVED", pricing: { not: "" } },
            select: { pricing: true },
            distinct: ["pricing"],
          }),
          prisma.software.findMany({
            where: { isAi: false, status: "APPROVED", licenseType: { not: null } },
            select: { licenseType: true },
            distinct: ["licenseType"],
          }),
        ]);

      const totalPages = Math.ceil(totalItems / limit);

      return {
        categories,
        totalItems,
        tools,
        distinctPricing,
        distinctLicenses,
        totalPages,
      };
    },
    [cacheKey],
    {
      revalidate: 300, // 5 minutes
      tags: ["software"],
    }
  );

  return fetcher();
};
