import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { searchNewsSchema, insertNewsArticleSchema, type NewsArticle } from "@shared/schema";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';

// --- CACHING LAYER ---
// In-memory cache to store API results for 5 minutes
const cache = {
  data: null as NewsArticle[] | null,
  timestamp: 0,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
};

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

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get news articles - Enhanced with live API fetching, caching, and filtering
  app.get("/api/news", async (req, res) => {
    try {
      const category = req.query.category as string;
      const timeFilter = req.query.timeFilter as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const paginated = req.query.paginated === 'true';
      
      // --- CHECK CACHE FIRST ---
      const now = Date.now();
      const cacheKey = category || 'general';
      
      if (cache.data && now - cache.timestamp < cache.CACHE_DURATION) {
        console.log('Serving from cache...');
        let articles = cache.data;
        
        // Apply client-side time filtering (as per your design)
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
        }
        
        // Sort by published date (newest first)
        articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        
        if (paginated) {
          const totalCount = articles.length;
          const totalPages = Math.ceil(totalCount / limit);
          const offset = (page - 1) * limit;
          const paginatedArticles = articles.slice(offset, offset + limit);
          
          return res.json({
            articles: paginatedArticles,
            totalCount,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
          });
        } else {
          return res.json(articles);
        }
      }

      // --- FETCH FRESH DATA FROM APIs ---
      console.log('Fetching fresh data from APIs...');
      
      const newsApiKey = process.env.NEWSAPI_KEY || process.env.NEWS_API_KEY || "";
      const gnewsApiKey = process.env.GNEWS_API_KEY || "";
      const mediastackApiKey = process.env.MEDIASTACK_API_KEY || "";

      // Determine search query based on category
      const searchQuery = category && category !== 'general' 
        ? category 
        : 'technology OR artificial intelligence OR innovation';
      
      const country = 'id'; // Indonesia

      // Build API URLs
      const newsApiUrl = newsApiKey 
        ? `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery)}&language=en&pageSize=30&sortBy=publishedAt&apiKey=${newsApiKey}`
        : null;
      
      const gnewsApiUrl = gnewsApiKey 
        ? `https://gnews.io/api/v4/search?q=${encodeURIComponent(searchQuery)}&lang=en&country=${country}&max=30&apikey=${gnewsApiKey}`
        : null;
      
      const mediastackApiUrl = mediastackApiKey 
        ? `http://api.mediastack.com/v1/news?access_key=${mediastackApiKey}&keywords=${encodeURIComponent(searchQuery)}&countries=${country}&limit=30`
        : null;

      // Fetch from all APIs in parallel
      const apiPromises = [
        newsApiUrl ? fetch(newsApiUrl).then(res => res.json()).catch(err => ({ error: err.message })) : Promise.resolve(null),
        gnewsApiUrl ? fetch(gnewsApiUrl).then(res => res.json()).catch(err => ({ error: err.message })) : Promise.resolve(null),
        mediastackApiUrl ? fetch(mediastackApiUrl).then(res => res.json()).catch(err => ({ error: err.message })) : Promise.resolve(null)
      ];

      const [newsApiRes, gnewsApiRes, mediastackApiRes] = await Promise.allSettled(apiPromises);

      let allArticles: NewsArticle[] = [];

      // Process NewsAPI results
      if (newsApiRes.status === 'fulfilled' && newsApiRes.value && newsApiRes.value.articles && !newsApiRes.value.error) {
        const normalized = newsApiRes.value.articles
          .map((a: any) => normalizeArticle(a, 'newsapi'))
          .filter(Boolean) as NewsArticle[];
        allArticles.push(...normalized);
        console.log(`NewsAPI: ${normalized.length} articles fetched`);
      } else {
        const error = newsApiRes.status === 'rejected' ? newsApiRes.reason : newsApiRes.value?.error;
        console.error(`NewsAPI failed:`, error);
      }

      // Process GNews results  
      if (gnewsApiRes.status === 'fulfilled' && gnewsApiRes.value && gnewsApiRes.value.articles && !gnewsApiRes.value.error) {
        const normalized = gnewsApiRes.value.articles
          .map((a: any) => normalizeArticle(a, 'gnews'))
          .filter(Boolean) as NewsArticle[];
        allArticles.push(...normalized);
        console.log(`GNews: ${normalized.length} articles fetched`);
      } else {
        const error = gnewsApiRes.status === 'rejected' ? gnewsApiRes.reason : gnewsApiRes.value?.error;
        console.error(`GNews failed:`, error);
      }

      // Process Mediastack results
      if (mediastackApiRes.status === 'fulfilled' && mediastackApiRes.value && mediastackApiRes.value.data && !mediastackApiRes.value.error) {
        const normalized = mediastackApiRes.value.data
          .map((a: any) => normalizeArticle(a, 'mediastack'))
          .filter(Boolean) as NewsArticle[];
        allArticles.push(...normalized);
        console.log(`Mediastack: ${normalized.length} articles fetched`);
      } else {
        const error = mediastackApiRes.status === 'rejected' ? mediastackApiRes.reason : mediastackApiRes.value?.error;
        console.error(`Mediastack failed:`, error);
      }

      // De-duplicate articles based on URL
      const uniqueArticles = [...new Map(allArticles.map(item => [item.url, item])).values()];
      console.log(`Total unique articles before filtering: ${uniqueArticles.length}`);

      // --- APPLY WHITELIST FILTER (Anti-hoax mission) ---
      const verifiedArticles = uniqueArticles.filter(article => 
        TRUSTED_SOURCES.some(trustedSource => 
          article.source && article.source.toLowerCase().includes(trustedSource.toLowerCase())
        )
      );
      
      console.log(`Verified articles after whitelist filter: ${verifiedArticles.length}`);

      // --- UPDATE CACHE ---
      cache.data = verifiedArticles;
      cache.timestamp = now;

      // Apply time filtering
      let articles = verifiedArticles;
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
      }

      // Sort by published date (newest first)
      articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

      if (paginated) {
        const totalCount = articles.length;
        const totalPages = Math.ceil(totalCount / limit);
        const offset = (page - 1) * limit;
        const paginatedArticles = articles.slice(offset, offset + limit);
        
        res.json({
          articles: paginatedArticles,
          totalCount,
          currentPage: page,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        });
      } else {
        res.json(articles);
      }

    } catch (error) {
      console.error("Error in /api/news:", error);
      res.status(500).json({ message: "Failed to fetch news articles" });
    }
  });

  // Get single news article
  app.get("/api/news/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const article = await storage.getNewsArticleById(id);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      res.json(article);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch article" });
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

  // Enhanced normalize article function for different APIs
  function normalizeArticle(article: any, apiSource: 'newsapi' | 'gnews' | 'mediastack'): NewsArticle | null {
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

      const baseArticle = {
        id: uuidv4(),
        category: 'technologies',
        isVerified: true,
        createdAt: new Date(),
      };

      switch (apiSource) {
        case 'newsapi':
          return {
            ...baseArticle,
            title: article.title.trim(),
            description: article.description?.trim() || '',
            content: article.content?.trim() || article.description?.trim() || '',
            url: article.url,
            imageUrl: article.urlToImage || null,
            publishedAt: new Date(article.publishedAt),
            source: cleanSourceName(article.source?.name || 'NewsAPI'),
            author: article.author?.trim() || 'Unknown Author',
            metadata: { 
              priority: 'medium' as const, 
              apiSource,
              tags: ['technology', 'news']
            }
          };

        case 'gnews':
          return {
            ...baseArticle,
            title: article.title.trim(),
            description: article.description?.trim() || '',
            content: article.content?.trim() || article.description?.trim() || '',
            url: article.url,
            imageUrl: article.image || null,
            publishedAt: new Date(article.publishedAt),
            source: cleanSourceName(article.source?.name || 'GNews'),
            author: article.source?.name ? `${article.source.name} Reporter` : 'GNews Reporter',
            metadata: { 
              priority: 'medium' as const, 
              apiSource,
              tags: ['technology', 'news']
            }
          };

        case 'mediastack':
          return {
            ...baseArticle,
            title: article.title.trim(),
            description: article.description?.trim() || '',
            content: article.description?.trim() || '',
            url: article.url,
            imageUrl: article.image || null,
            publishedAt: new Date(article.published_at),
            source: cleanSourceName(article.source || 'Mediastack'),
            author: article.author?.trim() || 'Unknown Author',
            metadata: { 
              priority: 'medium' as const, 
              apiSource,
              tags: ['technology', 'news']
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

  // Refresh news and clear cache (force fresh API fetch)
  app.post("/api/news/refresh", async (req, res) => {
    try {
      // Clear cache to force fresh fetch
      cache.data = null;
      cache.timestamp = 0;
      
      console.log('Cache cleared, forcing fresh API fetch...');
      
      // Make a request to our own endpoint to trigger fresh fetch
      const response = await fetch(`${req.protocol}://${req.get('host')}/api/news`);
      const articles = await response.json();
      
      res.json({ 
        message: `Successfully refreshed cache with fresh articles`,
        articlesCount: Array.isArray(articles) ? articles.length : articles.articles?.length || 0,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error refreshing news:", error);
      res.status(500).json({ message: "Failed to refresh news" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
