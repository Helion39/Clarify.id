import { type NewsArticle, type InsertNewsArticle, type Category, type InsertCategory, type Source, type InsertSource, type SearchNewsParams, type CategoryWithCount } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // News Articles
  getNewsArticles(params: SearchNewsParams): Promise<NewsArticle[]>;
  getNewsArticleById(id: string): Promise<NewsArticle | undefined>;
  createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle>;
  updateNewsArticle(id: string, article: Partial<InsertNewsArticle>): Promise<NewsArticle | undefined>;
  deleteNewsArticle(id: string): Promise<boolean>;
  
  // Categories
  getCategories(): Promise<CategoryWithCount[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Sources
  getSources(): Promise<Source[]>;
  getVerifiedSources(): Promise<Source[]>;
  createSource(source: InsertSource): Promise<Source>;
}

export class MemStorage implements IStorage {
  private articles: Map<string, NewsArticle> = new Map();
  private categories: Map<string, Category> = new Map();
  private sources: Map<string, Source> = new Map();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize default categories
    const defaultCategories = [
      { name: "Technologies", slug: "technologies", icon: "laptop-code", color: "blue", isActive: true },
      { name: "Politics", slug: "politics", icon: "university", color: "red", isActive: true },
      { name: "National", slug: "national", icon: "flag", color: "blue", isActive: true },
      { name: "International", slug: "international", icon: "globe", color: "green", isActive: true },
      { name: "Business", slug: "business", icon: "chart-line", color: "yellow", isActive: true },
      { name: "Finance", slug: "finance", icon: "dollar-sign", color: "green", isActive: true },
      { name: "Health Care", slug: "health-care", icon: "heart", color: "red", isActive: true },
      { name: "Science", slug: "science", icon: "flask", color: "purple", isActive: true },
      { name: "Jobs", slug: "jobs", icon: "briefcase", color: "blue", isActive: true },
      { name: "Media", slug: "media", icon: "tv", color: "gray", isActive: true },
      { name: "Administration", slug: "administration", icon: "building-2", color: "gray", isActive: true },
      { name: "Defense", slug: "defense", icon: "shield", color: "red", isActive: true },
      { name: "Energy", slug: "energy", icon: "zap", color: "yellow", isActive: true },
      { name: "Latino", slug: "latino", icon: "users", color: "orange", isActive: true },
      { name: "Kids", slug: "kids", icon: "baby", color: "pink", isActive: true },
      { name: "Sports", slug: "sports", icon: "trophy", color: "blue", isActive: true },
      { name: "Games", slug: "games", icon: "gamepad-2", color: "purple", isActive: true },
    ];

    defaultCategories.forEach(cat => {
      const id = randomUUID();
      this.categories.set(id, { ...cat, id });
    });

    // No mock articles - all news will come from real APIs
    console.log(`✅ Initialized ${defaultCategories.length} categories - ready for real news data`);

    // Initialize trusted news sources (matches our whitelist in routes.ts)
    const trustedSources = [
      // International Sources
      { name: "Reuters", domain: "reuters.com", isVerified: true, trustRating: "high" as const },
      { name: "Associated Press", domain: "apnews.com", isVerified: true, trustRating: "high" as const },
      { name: "BBC News", domain: "bbc.com", isVerified: true, trustRating: "high" as const },
      { name: "The Guardian", domain: "theguardian.com", isVerified: true, trustRating: "high" as const },
      { name: "The New York Times", domain: "nytimes.com", isVerified: true, trustRating: "high" as const },
      { name: "CNN", domain: "cnn.com", isVerified: true, trustRating: "high" as const },
      { name: "CNBC", domain: "cnbc.com", isVerified: true, trustRating: "high" as const },
      // Indonesian Sources
      { name: "CNN Indonesia", domain: "cnnindonesia.com", isVerified: true, trustRating: "high" as const },
      { name: "CNBC Indonesia", domain: "cnbcindonesia.com", isVerified: true, trustRating: "high" as const },
      { name: "Detik News", domain: "detik.com", isVerified: true, trustRating: "high" as const },
      { name: "Kompas.com", domain: "kompas.com", isVerified: true, trustRating: "high" as const },
      { name: "Tempo.co", domain: "tempo.co", isVerified: true, trustRating: "high" as const },
      { name: "Antara News", domain: "antaranews.com", isVerified: true, trustRating: "high" as const },
    ];

    trustedSources.forEach(source => {
      const id = randomUUID();
      this.sources.set(id, { ...source, id, apiKey: null });
    });

    console.log(`✅ Initialized ${trustedSources.length} trusted news sources`);
  }

  async getNewsArticles(params: SearchNewsParams): Promise<NewsArticle[]> {
    let articles = Array.from(this.articles.values());

    // Filter by category
    if (params.category && params.category !== 'all') {
      articles = articles.filter(article => article.category.toLowerCase() === params.category?.toLowerCase());
    }

    // Filter by search query
    if (params.query) {
      const query = params.query.toLowerCase();
      articles = articles.filter(article => 
        article.title.toLowerCase().includes(query) ||
        article.description?.toLowerCase().includes(query) ||
        article.content?.toLowerCase().includes(query)
      );
    }

    // Filter by source
    if (params.source) {
      articles = articles.filter(article => article.source.toLowerCase() === params.source?.toLowerCase());
    }

    // Sort by published date (newest first)
    articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Apply pagination
    const start = params.offset || 0;
    const end = start + (params.limit || 20);
    
    return articles.slice(start, end);
  }

  async getNewsArticleById(id: string): Promise<NewsArticle | undefined> {
    return this.articles.get(id);
  }

  async createNewsArticle(insertArticle: InsertNewsArticle): Promise<NewsArticle> {
    const id = randomUUID();
    const article: NewsArticle = {
      ...insertArticle,
      id,
      createdAt: new Date(),
    };
    this.articles.set(id, article);
    return article;
  }

  async updateNewsArticle(id: string, updateData: Partial<InsertNewsArticle>): Promise<NewsArticle | undefined> {
    const existing = this.articles.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updateData };
    this.articles.set(id, updated);
    return updated;
  }

  async deleteNewsArticle(id: string): Promise<boolean> {
    return this.articles.delete(id);
  }

  async getCategories(): Promise<CategoryWithCount[]> {
    const allArticles = Array.from(this.articles.values());
    const categoryCounts = new Map<string, number>();

    for (const article of allArticles) {
      const slug = article.category.toLowerCase();
      categoryCounts.set(slug, (categoryCounts.get(slug) || 0) + 1);
    }

    const categories = Array.from(this.categories.values()).filter(cat => cat.isActive);

    return categories.map(category => ({
      ...category,
      count: categoryCounts.get(category.slug) || 0,
    }));
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(cat => cat.slug === slug);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  async getSources(): Promise<Source[]> {
    return Array.from(this.sources.values());
  }

  async getVerifiedSources(): Promise<Source[]> {
    return Array.from(this.sources.values()).filter(source => source.isVerified);
  }

  async createSource(insertSource: InsertSource): Promise<Source> {
    const id = randomUUID();
    const source: Source = { ...insertSource, id };
    this.sources.set(id, source);
    return source;
  }
}

export const storage = new MemStorage();
