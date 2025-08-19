import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { searchNewsSchema, insertNewsArticleSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get news articles with filtering, search, and pagination
  app.get("/api/news", async (req, res) => {
    try {
      const params = searchNewsSchema.parse(req.query);
      const timeFilter = req.query.timeFilter as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const paginated = req.query.paginated === 'true';
      
      // Apply time filtering
      let articles = await storage.getNewsArticles(params);
      
      if (timeFilter && timeFilter !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (timeFilter) {
          case 'daily':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'weekly':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'monthly':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'yearly':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }
        
        articles = articles.filter(article => 
          new Date(article.publishedAt) >= startDate
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
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to fetch news articles" });
      }
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

  // Normalize article function for different APIs
  function normalizeArticle(article: any, apiSource: string): any {
    const now = new Date();
    
    switch (apiSource) {
      case 'newsapi':
        return {
          title: article.title,
          description: article.description || '',
          content: article.content || article.description || '',
          url: article.url,
          imageUrl: article.urlToImage || '',
          publishedAt: new Date(article.publishedAt),
          source: article.source?.name || 'NewsAPI',
          author: article.author || 'Unknown Author',
          category: 'technologies',
          isVerified: true,
          metadata: { priority: 'medium' as const, apiSource }
        };
      case 'gnews':
        return {
          title: article.title,
          description: article.description || '',
          content: article.content || article.description || '',
          url: article.url,
          imageUrl: article.image || '',
          publishedAt: new Date(article.publishedAt),
          source: article.source?.name || 'GNews',
          author: 'GNews Reporter',
          category: 'technologies',
          isVerified: true,
          metadata: { priority: 'medium' as const, apiSource }
        };
      case 'mediastack':
        return {
          title: article.title,
          description: article.description || '',
          content: article.description || '',
          url: article.url,
          imageUrl: article.image || '',
          publishedAt: new Date(article.published_at),
          source: article.source || 'Mediastack',
          author: article.author || 'Unknown Author',
          category: 'technologies',
          isVerified: true,
          metadata: { priority: 'medium' as const, apiSource }
        };
      default:
        return null;
    }
  }

  // Refresh news from multiple external APIs
  app.post("/api/news/refresh", async (req, res) => {
    try {
      const newsApiKey = process.env.NEWS_API_KEY || process.env.NEWSAPI_KEY || "";
      const gnewsApiKey = process.env.GNEWS_API_KEY || "";
      const mediastackApiKey = process.env.MEDIASTACK_API_KEY || "";

      const query = "Artificial Intelligence";
      const country = "id"; // Indonesia
      
      // Fetch from three APIs in parallel using Promise.allSettled
      const apiPromises = [
        // NewsAPI
        newsApiKey ? fetch(
          `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&pageSize=20&sortBy=publishedAt&apiKey=${newsApiKey}`
        ).then(res => res.json()).then(data => ({ source: 'newsapi', data })) : Promise.resolve({ source: 'newsapi', data: null }),
        
        // GNews
        gnewsApiKey ? fetch(
          `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&country=${country}&max=20&apikey=${gnewsApiKey}`
        ).then(res => res.json()).then(data => ({ source: 'gnews', data })) : Promise.resolve({ source: 'gnews', data: null }),
        
        // Mediastack
        mediastackApiKey ? fetch(
          `http://api.mediastack.com/v1/news?access_key=${mediastackApiKey}&keywords=${encodeURIComponent(query)}&countries=${country}&limit=20`
        ).then(res => res.json()).then(data => ({ source: 'mediastack', data })) : Promise.resolve({ source: 'mediastack', data: null })
      ];

      const results = await Promise.allSettled(apiPromises);
      const allArticles: any[] = [];
      const seenUrls = new Set<string>();

      // Process results from all APIs
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.data) {
          const { source, data } = result.value;
          let articles: any[] = [];

          // Extract articles based on API response structure
          if (source === 'newsapi' && data.articles) {
            articles = data.articles;
          } else if (source === 'gnews' && data.articles) {
            articles = data.articles;
          } else if (source === 'mediastack' && data.data) {
            articles = data.data;
          }

          // Normalize and deduplicate articles
          for (const article of articles) {
            if (article.title && article.url && !article.title.includes('[Removed]')) {
              // Skip duplicates based on URL
              if (seenUrls.has(article.url)) {
                continue;
              }
              seenUrls.add(article.url);

              const normalizedArticle = normalizeArticle(article, source);
              if (normalizedArticle) {
                try {
                  const createdArticle = await storage.createNewsArticle(normalizedArticle);
                  allArticles.push(createdArticle);
                } catch (error) {
                  console.error(`Error creating article from ${source}:`, error);
                }
              }
            }
          }
        } else if (result.status === 'rejected') {
          console.error(`API request failed:`, result.reason);
        }
      }

      res.json({ 
        message: `Successfully refreshed ${allArticles.length} articles from multiple sources`,
        articlesAdded: allArticles.length,
        sources: {
          newsapi: results[0].status === 'fulfilled',
          gnews: results[1].status === 'fulfilled',
          mediastack: results[2].status === 'fulfilled'
        }
      });
    } catch (error) {
      console.error("Error refreshing news:", error);
      res.status(500).json({ message: "Failed to refresh news" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
