import { type NewsArticle, type InsertNewsArticle, type Category, type InsertCategory, type Source, type InsertSource, type SearchNewsParams } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // News Articles
  getNewsArticles(params: SearchNewsParams): Promise<NewsArticle[]>;
  getNewsArticleById(id: string): Promise<NewsArticle | undefined>;
  createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle>;
  updateNewsArticle(id: string, article: Partial<InsertNewsArticle>): Promise<NewsArticle | undefined>;
  deleteNewsArticle(id: string): Promise<boolean>;
  
  // Categories
  getCategories(): Promise<Category[]>;
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

    // Add some sample articles
    const sampleArticles = [
      {
        title: "Artificial Intelligence Committee announces revolutionary breakthrough in neural network architecture",
        description: "Members of the House AI Research Committee will begin reviewing a comprehensive report Monday on the panel's investigation of breakthrough neural network architectures. The committee aims to investigate the Democratic adversaries, a crucial step in the House's fast-moving artificial intelligence inquiry.",
        content: "AI Research Committee Chairman Dr. Sarah Mitchell had indicated in a letter to colleagues earlier this week that a report would be coming 'soon' from his committee but had not provided a specific timeframe.",
        url: "https://example.com/ai-breakthrough",
        imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop",
        publishedAt: new Date("2024-12-18T08:34:00Z"),
        source: "Tech Research",
        author: "SARAH MARTINEZ, DAVID CHEN and ALEX RODRIGUEZ",
        category: "technologies",
        isVerified: true,
        metadata: { priority: "high" as const }
      },
      {
        title: "OpenAI announces breakthrough in artificial general intelligence research",
        description: "Major advancements in AGI capabilities demonstrate significant progress in reasoning and problem-solving abilities across multiple domains.",
        content: "The breakthrough represents a significant milestone in the development of artificial general intelligence systems.",
        url: "https://example.com/openai-agi",
        imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=400&fit=crop",
        publishedAt: new Date("2024-12-18T06:15:00Z"),
        source: "AI Technology",
        author: "Tech Reporter",
        category: "technologies",
        isVerified: true,
        metadata: { priority: "medium" as const }
      },
      {
        title: "Google DeepMind develops new algorithm for climate prediction",
        description: "Revolutionary machine learning approach improves weather forecasting accuracy by 40% using advanced neural networks.",
        content: "The new algorithm combines satellite data with advanced machine learning techniques to provide more accurate climate predictions.",
        url: "https://example.com/deepmind-climate",
        imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=400&fit=crop",
        publishedAt: new Date("2024-12-18T04:20:00Z"),
        source: "Science Daily",
        author: "Climate Research Team",
        category: "technologies",
        isVerified: true,
        metadata: { priority: "medium" as const }
      },
      {
        title: "Behind Trump's secret war-zone trip: A Mar-a-Lago escape, a twin Air Force One",
        description: "Latest political developments and international relations update from Washington D.C.",
        content: "Political analysis of recent developments in international relations and domestic policy.",
        url: "https://example.com/politics-update",
        imageUrl: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a08b?w=800&h=400&fit=crop",
        publishedAt: new Date("2024-12-18T03:10:00Z"),
        source: "Political News",
        author: "Washington Correspondent",
        category: "politics",
        isVerified: true,
        metadata: { priority: "medium" as const }
      }
    ];

    sampleArticles.forEach(article => {
      const id = randomUUID();
      this.articles.set(id, {
        ...article,
        id,
        createdAt: new Date()
      });
    });

    // Initialize verified sources
    const defaultSources = [
      { name: "Reuters", domain: "reuters.com", isVerified: true, trustRating: "high" as const },
      { name: "Associated Press", domain: "apnews.com", isVerified: true, trustRating: "high" as const },
      { name: "BBC News", domain: "bbc.com", isVerified: true, trustRating: "high" as const },
      { name: "NPR", domain: "npr.org", isVerified: true, trustRating: "high" as const },
    ];

    defaultSources.forEach(source => {
      const id = randomUUID();
      this.sources.set(id, { ...source, id, apiKey: null });
    });
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

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(cat => cat.isActive);
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
