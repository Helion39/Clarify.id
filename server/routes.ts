import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { searchNewsSchema, insertNewsArticleSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get news articles with filtering and search
  app.get("/api/news", async (req, res) => {
    try {
      const params = searchNewsSchema.parse(req.query);
      const articles = await storage.getNewsArticles(params);
      res.json(articles);
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

  // Refresh news from external APIs
  app.post("/api/news/refresh", async (req, res) => {
    try {
      const newsApiKey = process.env.NEWS_API_KEY || process.env.NEWSAPI_KEY || "";
      
      if (!newsApiKey) {
        return res.status(500).json({ message: "News API key not configured" });
      }

      // Fetch from NewsAPI
      const categories = ['technology', 'business', 'science', 'health'];
      const articles = [];

      for (const category of categories) {
        try {
          const response = await fetch(
            `https://newsapi.org/v2/top-headlines?category=${category}&language=en&pageSize=10&apiKey=${newsApiKey}`
          );
          
          if (!response.ok) {
            console.error(`Failed to fetch ${category} news: ${response.statusText}`);
            continue;
          }

          const data = await response.json();
          
          if (data.articles) {
            for (const apiArticle of data.articles) {
              if (apiArticle.title && apiArticle.url && !apiArticle.title.includes('[Removed]')) {
                const article = await storage.createNewsArticle({
                  title: apiArticle.title,
                  description: apiArticle.description || '',
                  content: apiArticle.content || '',
                  url: apiArticle.url,
                  imageUrl: apiArticle.urlToImage || '',
                  publishedAt: new Date(apiArticle.publishedAt),
                  source: apiArticle.source?.name || 'Unknown',
                  author: apiArticle.author || '',
                  category: category,
                  isVerified: true,
                  metadata: {
                    priority: 'medium'
                  }
                });
                articles.push(article);
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching ${category} news:`, error);
        }
      }

      res.json({ 
        message: `Successfully refreshed ${articles.length} articles`,
        articlesAdded: articles.length 
      });
    } catch (error) {
      console.error("Error refreshing news:", error);
      res.status(500).json({ message: "Failed to refresh news" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
