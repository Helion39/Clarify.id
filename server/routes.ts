import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { searchNewsSchema, insertNewsArticleSchema, type NewsArticle, type SearchNewsParams } from "@shared/schema";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';

// --- CATEGORY-BASED CACHING LAYER ---
// Cache per category for better filtering
const categoryCache = new Map<string, {
  data: NewsArticle[],
  timestamp: number,
  isLoading: boolean
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to get cache key
function getCacheKey(category?: string): string {
  return category?.toLowerCase() || 'general';
}

// Helper function to get or create cache entry
function getCacheEntry(cacheKey: string) {
  if (!categoryCache.has(cacheKey)) {
    categoryCache.set(cacheKey, {
      data: [],
      timestamp: 0,
      isLoading: false
    });
  }
  return categoryCache.get(cacheKey)!;
}

// Enhanced normalize article function for different APIs
function normalizeArticle(article: any, apiSource: 'newsapi' | 'gnews' | 'mediastack', categoryHint?: string): NewsArticle | null {
  try {
    // Skip articles with removed content or missing essential fields
    if (!article.title || !article.url ||
      article.title.includes('[Removed]') ||
      article.title.toLowerCase().includes('removed')) {
      return null;
    }

    // Clean and normalize source name
    const cleanSourceName = (sourceName: string): string => {
      return sourceName
        .replace(/\s*(Inc\.|LLC|Corp\.|Corporation|Ltd\.|Limited)\s*/gi, '')
        .replace(/\s*\(.*?\)\s*/g, '')
        .trim();
    };

    // Determine category based on hint or content
    let articleCategory = 'technologies';
    if (categoryHint) {
      articleCategory = categoryHint.toLowerCase();
    } else {
      // Try to infer category from title/content
      const title = article.title?.toLowerCase() || '';
      const description = article.description?.toLowerCase() || '';
      const content = `${title} ${description}`;

      if (content.includes('sport') || content.includes('football') || content.includes('basketball')) {
        articleCategory = 'sport';
      } else if (content.includes('entertainment') || content.includes('movie') || content.includes('celebrity')) {
        articleCategory = 'entertainment';
      } else if (content.includes('media') || content.includes('journalism') || content.includes('news')) {
        articleCategory = 'media';
      } else if (content.includes('business') || content.includes('economy') || content.includes('finance')) {
        articleCategory = 'business';
      }
    }

    const sourceName =
      apiSource === 'newsapi' ? article.source?.name :
      apiSource === 'gnews' ? article.source?.name :
      apiSource === 'mediastack' ? article.source :
      'Unknown';

    const isVerified = TRUSTED_SOURCES.some(trustedSource =>
      sourceName && sourceName.toLowerCase().includes(trustedSource.toLowerCase())
    );

    const baseArticle = {
      id: uuidv4(),
      category: articleCategory,
      isVerified: isVerified,
      createdAt: new Date(),
    };

    switch (apiSource) {
      case 'newsapi':
        return {
          ...baseArticle,
          title: article.title.trim(),
          description: article.description?.trim() || '',
          content: article.content?.trim() || article.description?.trim() || '',
          url: article.url, // Keep original URL for external reference
          imageUrl: article.urlToImage || null,
          publishedAt: new Date(article.publishedAt),
          source: cleanSourceName(article.source?.name || 'NewsAPI'),
          author: article.author?.trim() || 'Unknown Author',
          metadata: {
            priority: 'medium' as const,
            apiSource,
            tags: [articleCategory, 'news'],
            originalUrl: article.url
          }
        };

      case 'gnews':
        return {
          ...baseArticle,
          title: article.title.trim(),
          description: article.description?.trim() || '',
          content: article.content?.trim() || article.description?.trim() || '',
          url: article.url, // Keep original URL for external reference
          imageUrl: article.image || null,
          publishedAt: new Date(article.publishedAt),
          source: cleanSourceName(article.source?.name || 'GNews'),
          author: article.source?.name ? `${article.source.name} Reporter` : 'GNews Reporter',
          metadata: {
            priority: 'medium' as const,
            apiSource,
            tags: [articleCategory, 'news'],
            originalUrl: article.url
          }
        };

      case 'mediastack':
        return {
          ...baseArticle,
          title: article.title.trim(),
          description: article.description?.trim() || '',
          content: article.description?.trim() || '',
          url: article.url, // Keep original URL for external reference
          imageUrl: article.image || null,
          publishedAt: new Date(article.published_at),
          source: cleanSourceName(article.source || 'Mediastack'),
          author: article.author?.trim() || 'Unknown Author',
          metadata: {
            priority: 'medium' as const,
            apiSource,
            tags: [articleCategory, 'news'],
            originalUrl: article.url
          }
        };

      default:
        return null;
    }
  } catch (error) {
    console.error(`Error normalizing article from ${apiSource}:`, error);
    return null;
  }
}

// --- TRUSTED SOURCES WHITELIST ---
// Anti-hoax mission: Only articles from these vetted sources will be shown
const TRUSTED_SOURCES = [
  // International Sources
  'Reuters',
  'Associated Press',
  'BBC News',
  'The Guardian',
  'The New York Times',
  'CNN',
  'CNBC',
  // Indonesian Sources
  'CNN Indonesia',
  'CNBC Indonesia',
  'Detik News',
  'Detik',
  'Kompas.com',
  'Kompas',
  'Tempo.co',
  'Tempo',
  'Antara News',
  'Antara'
];

// Background refresh function - fetches real API data and saves to MemStorage
async function refreshNewsInBackground(category?: string) {
  const cacheKey = getCacheKey(category);
  const cacheEntry = getCacheEntry(cacheKey);

  if (cacheEntry.isLoading) return; // Prevent multiple simultaneous fetches

  cacheEntry.isLoading = true;
  console.log(`🔄 Background refresh started for category: ${cacheKey}`);

  try {
    const newsApiKey = process.env.NEWSAPI_KEY || "";
    const gnewsApiKey = process.env.GNEWS_API_KEY || "";
    const mediastackApiKey = process.env.MEDIASTACK_API_KEY || "";

    console.log('🔑 API Keys status:', {
      newsApi: newsApiKey ? `✅ Present` : '❌ Missing',
      gnews: gnewsApiKey ? `✅ Present` : '❌ Missing',
      mediastack: mediastackApiKey ? `✅ Present` : '❌ Missing'
    });

    // Category-specific search queries
    let searchQuery = 'technology OR artificial intelligence OR innovation';
    let newsApiCategory = '';

    if (category) {
      switch (category.toLowerCase()) {
        case 'technology':
        case 'technologies':
          searchQuery = 'technology OR artificial intelligence OR software OR innovation';
          newsApiCategory = '&category=technology';
          break;
        case 'sport':
        case 'sports':
          searchQuery = 'sports OR football OR basketball OR soccer';
          newsApiCategory = '&category=sports';
          break;
        case 'entertainment':
        case 'entertainments':
          searchQuery = 'entertainment OR movies OR music OR celebrity';
          newsApiCategory = '&category=entertainment';
          break;
        case 'media':
          searchQuery = 'media OR journalism OR news OR broadcasting';
          break;
        case 'business':
          searchQuery = 'business OR economy OR finance OR startup';
          newsApiCategory = '&category=business';
          break;
        default:
          searchQuery = 'technology OR artificial intelligence OR innovation';
      }
    }

    let fetchedArticles: any[] = [];

    // Try NewsAPI first (most reliable)
    if (newsApiKey) {
      try {
        const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery)}&language=en&pageSize=30&sortBy=publishedAt&apiKey=${newsApiKey}`;
        console.log(`📡 Calling NewsAPI: ${newsApiUrl.replace(newsApiKey, 'API_KEY')}`);

        const response = await fetch(newsApiUrl);
        console.log(`📡 NewsAPI Response: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          throw new Error(`NewsAPI HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`📡 NewsAPI Data:`, {
          status: data.status,
          totalResults: data.totalResults,
          articlesCount: data.articles?.length || 0
        });

        if (data.status === 'ok' && data.articles && data.articles.length > 0) {
          fetchedArticles.push(...data.articles.map((a: any) => ({ ...a, apiSource: 'newsapi' })));
          console.log(`✅ NewsAPI: ${data.articles.length} articles fetched`);
        } else {
          console.log(`⚠️ NewsAPI: No articles returned. Status: ${data.status}, Message: ${data.message || 'N/A'}`);
        }
      } catch (error) {
        console.error('❌ NewsAPI failed:', error);
      }
    }

    // Try GNews if we need more articles
    if (fetchedArticles.length < 20 && gnewsApiKey) {
      try {
        const gnewsUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(searchQuery)}&lang=en&max=30&apikey=${gnewsApiKey}`;
        console.log(`📡 Calling GNews: ${gnewsUrl.replace(gnewsApiKey, 'API_KEY')}`);

        const response = await fetch(gnewsUrl);
        console.log(`📡 GNews Response: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          throw new Error(`GNews HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`📡 GNews Data:`, {
          totalArticles: data.totalArticles,
          articlesCount: data.articles?.length || 0
        });

        if (data.articles && data.articles.length > 0) {
          fetchedArticles.push(...data.articles.map((a: any) => ({ ...a, apiSource: 'gnews' })));
          console.log(`✅ GNews: ${data.articles.length} articles fetched`);
        }
      } catch (error) {
        console.error('❌ GNews failed:', error);
      }
    }

    // Try Mediastack if we still need more
    if (fetchedArticles.length < 30 && mediastackApiKey) {
      try {
        const mediastackUrl = `http://api.mediastack.com/v1/news?access_key=${mediastackApiKey}&keywords=${encodeURIComponent(searchQuery)}&limit=30`;
        console.log(`📡 Calling Mediastack: ${mediastackUrl.replace(mediastackApiKey, 'API_KEY')}`);

        const response = await fetch(mediastackUrl);
        console.log(`📡 Mediastack Response: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          throw new Error(`Mediastack HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`📡 Mediastack Data:`, {
          pagination: data.pagination,
          dataCount: data.data?.length || 0
        });

        if (data.data && data.data.length > 0) {
          fetchedArticles.push(...data.data.map((a: any) => ({ ...a, apiSource: 'mediastack' })));
          console.log(`✅ Mediastack: ${data.data.length} articles fetched`);
        }
      } catch (error) {
        console.error('❌ Mediastack failed:', error);
      }
    }

    console.log(`📊 Total raw articles fetched: ${fetchedArticles.length}`);

    // Process and normalize articles
    const processedArticles: NewsArticle[] = [];
    const seenUrls = new Set<string>();

    for (const rawArticle of fetchedArticles) {
      try {
        const normalized = normalizeArticle(rawArticle, rawArticle.apiSource, category);
        if (normalized && normalized.url && !seenUrls.has(normalized.url)) {
          try {
            const savedArticle = await storage.createNewsArticle({
              title: normalized.title,
              description: normalized.description,
              content: normalized.content,
              url: normalized.url,
              imageUrl: normalized.imageUrl,
              publishedAt: normalized.publishedAt,
              source: normalized.source,
              author: normalized.author,
              category: normalized.category,
              isVerified: normalized.isVerified,
              metadata: normalized.metadata
            });
            processedArticles.push(savedArticle);
            seenUrls.add(normalized.url);
          } catch (storageError) {
            // If storage fails (duplicate), still add to cache
            processedArticles.push(normalized);
            seenUrls.add(normalized.url);
          }
        }
      } catch (error) {
        console.error('Error processing article:', error);
      }
    }

    console.log(`✅ Processed ${processedArticles.length} verified articles for category: ${cacheKey}`);

    // Update cache
    cacheEntry.data = processedArticles;
    cacheEntry.timestamp = Date.now();

  } catch (error) {
    console.error('❌ Background refresh failed:', error);
  } finally {
    cacheEntry.isLoading = false;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {

  // Get news articles - Enhanced with real API data, category filtering, and caching
  app.get("/api/news", async (req, res) => {
    try {
      const singleCategory = req.query.category as string;
      const multipleCategories = req.query.categories as string;
      const timeFilter = req.query.timeFilter as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const paginated = req.query.paginated === 'true';

      console.log(`📥 Request: category=${singleCategory}, categories=${multipleCategories}, timeFilter=${timeFilter}`);

      let articles: NewsArticle[] = [];
      let isLoading = false;

      // Logic for handling multiple categories
      if (multipleCategories) {
        const categoryList = multipleCategories.split(',').map(c => c.trim().toLowerCase());
        const seenUrls = new Set<string>();

        for (const cat of categoryList) {
          const cacheKey = getCacheKey(cat);
          const cacheEntry = getCacheEntry(cacheKey);
          const now = Date.now();
          const cacheExpired = now - cacheEntry.timestamp > CACHE_DURATION;
          const hasNoData = cacheEntry.data.length === 0;

          if ((cacheExpired || hasNoData) && !cacheEntry.isLoading) {
            await refreshNewsInBackground(cat);
          }

          if(cacheEntry.isLoading) isLoading = true;

          const updatedCacheEntry = getCacheEntry(cacheKey);
          for (const article of updatedCacheEntry.data) {
            if (!seenUrls.has(article.url)) {
              articles.push(article);
              seenUrls.add(article.url);
            }
          }
        }
      } else { // Fallback to original logic for single category or general
        const cacheKey = getCacheKey(singleCategory);
        const cacheEntry = getCacheEntry(cacheKey);
        const now = Date.now();
        const cacheExpired = now - cacheEntry.timestamp > CACHE_DURATION;
        const hasNoData = cacheEntry.data.length === 0;

        if ((cacheExpired || hasNoData) && !cacheEntry.isLoading) {
          await refreshNewsInBackground(singleCategory);
        }

        if(cacheEntry.isLoading) isLoading = true;

        const updatedCacheEntry = getCacheEntry(cacheKey);
        if (updatedCacheEntry.data.length > 0) {
          articles = [...updatedCacheEntry.data];
        } else {
          try {
            const storageParams: SearchNewsParams = {
              ...(singleCategory ? { category: singleCategory } : {}),
              limit,
              offset: (page - 1) * limit,
            };
            articles = await storage.getNewsArticles(storageParams);
          } catch (error) {
            console.error('MemStorage failed:', error);
            articles = [];
          }
        }
      }

      // This filtering is now partly redundant but ensures strict filtering for combined results
      if (multipleCategories) {
        const categoryList = multipleCategories.split(',').map(c => c.trim().toLowerCase());
        if (categoryList.length > 0) {
          articles = articles.filter(article =>
            categoryList.some(cat =>
              article.category.toLowerCase() === cat ||
              article.metadata?.tags?.some(tag => tag.toLowerCase().includes(cat))
            )
          );
        }
      } else if (singleCategory && singleCategory !== 'general') {
        articles = articles.filter(article =>
          article.category.toLowerCase() === singleCategory.toLowerCase() ||
          article.metadata?.tags?.some(tag => tag.toLowerCase().includes(singleCategory.toLowerCase()))
        );
      }

      // Apply time filtering
      if (timeFilter && timeFilter !== 'all') {
        const filterDate = new Date();
        switch (timeFilter) {
          case 'daily':
            filterDate.setHours(0, 0, 0, 0);
            break;
          case 'weekly':
            filterDate.setDate(filterDate.getDate() - 7);
            break;
          case 'monthly':
            filterDate.setMonth(filterDate.getMonth() - 1);
            break;
          case 'yearly':
            filterDate.setFullYear(filterDate.getFullYear() - 1);
            break;
        }
        articles = articles.filter(article =>
          new Date(article.publishedAt) >= filterDate
        );
        console.log(`⏰ Time filtered to ${articles.length} articles for ${timeFilter}`);
      }

      // Sort by published date (newest first)
      articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

      // Apply pagination
      if (paginated) {
        const totalCount = articles.length;
        const totalPages = Math.ceil(totalCount / limit);
        const offset = (page - 1) * limit;
        const paginatedArticles = articles.slice(offset, offset + limit);

        console.log(`📄 Paginated: ${paginatedArticles.length}/${totalCount} articles (page ${page}/${totalPages})`);

        res.json({
          articles: paginatedArticles,
          totalCount,
          currentPage: page,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          category: singleCategory || 'general',
          isLoading: isLoading
        });
      } else {
        console.log(`📋 Returning ${articles.length} articles`);
        res.json(articles);
      }

    } catch (error) {
      console.error("❌ Error in /api/news:", error);
      if (error instanceof Error) {
        res.status(500).json({ message: "Failed to fetch news articles", error: error.message });
      } else {
        res.status(500).json({ message: "Failed to fetch news articles", error: "An unknown error occurred" });
      }
    }
  });

  // Get single news article
  app.get("/api/news/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🔍 Looking for article with ID: ${id}`);

      // Try to get from MemStorage first
      let article = await storage.getNewsArticleById(id);

      if (!article) {
        // Fallback: search in all cache entries
        console.log(`💾 Article not in MemStorage, searching cache...`);
        for (const [cacheKey, cacheEntry] of categoryCache.entries()) {
          const found = cacheEntry.data.find(a => a.id === id);
          if (found) {
            article = found;
            console.log(`✅ Found article in ${cacheKey} cache`);
            break;
          }
        }
      }

      if (!article) {
        console.log(`❌ Article ${id} not found anywhere`);
        return res.status(404).json({
          message: "Article not found",
          id: id,
          suggestion: "The article may have been removed or the ID is incorrect"
        });
      }

      console.log(`✅ Returning article: ${article.title}`);
      res.json(article);
    } catch (error) {
      console.error(`❌ Error fetching article ${req.params.id}:`, error);
      if (error instanceof Error) {
        res.status(500).json({ message: "Failed to fetch article", error: error.message });
      } else {
        res.status(500).json({ message: "Failed to fetch article", error: "An unknown error occurred" });
      }
    }
  });

  // Create news article (for API integration)
  app.post("/api/news", async (req, res) => {
    try {
      const articleData = insertNewsArticleSchema.parse(req.body);
      const article = await storage.createNewsArticle(articleData);
      res.status(201).json(article);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid article data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create article" });
      }
    }
  });

  // Get categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get verified sources
  app.get("/api/sources", async (req, res) => {
    try {
      const sources = await storage.getVerifiedSources();
      res.json(sources);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sources" });
    }
  });



  // Refresh news and clear cache (force fresh API fetch)
  app.post("/api/news/refresh", async (req, res) => {
    try {
      const category = req.query.category as string;

      console.log(`🔄 Manual refresh requested for category: ${category || 'all'}`);

      if (category) {
        // Clear specific category cache
        const cacheKey = getCacheKey(category);
        const cacheEntry = getCacheEntry(cacheKey);
        cacheEntry.data = [];
        cacheEntry.timestamp = 0;
        console.log(`🗑️ Cleared cache for category: ${cacheKey}`);

        // Trigger refresh for this category
        await refreshNewsInBackground(category);

        res.json({
          message: `Successfully refreshed cache for category: ${category}`,
          category: category,
          timestamp: new Date().toISOString()
        });
      } else {
        // Clear all caches
        categoryCache.clear();
        console.log(`🗑️ Cleared all category caches`);

        // Trigger refresh for general category
        await refreshNewsInBackground();

        res.json({
          message: `Successfully refreshed all caches`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("❌ Error refreshing news:", error);
      if (error instanceof Error) {
        res.status(500).json({ message: "Failed to refresh news", error: error.message });
      } else {
        res.status(500).json({ message: "Failed to refresh news", error: "An unknown error occurred" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
