import { apiRequest } from "./queryClient";
import type { NewsArticle, Category, Source, SearchNewsParams } from "@shared/schema";

export const newsApi = {
  getNews: async (params: SearchNewsParams = {}): Promise<NewsArticle[]> => {
    const searchParams = new URLSearchParams();
    
    if (params.query) searchParams.append('query', params.query);
    if (params.category) searchParams.append('category', params.category);
    if (params.source) searchParams.append('source', params.source);
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.offset) searchParams.append('offset', params.offset.toString());

    const response = await apiRequest('GET', `/api/news?${searchParams.toString()}`);
    return response.json();
  },

  getArticle: async (id: string): Promise<NewsArticle> => {
    const response = await apiRequest('GET', `/api/news/${id}`);
    return response.json();
  },

  getCategories: async (): Promise<Category[]> => {
    const response = await apiRequest('GET', '/api/categories');
    return response.json();
  },

  getSources: async (): Promise<Source[]> => {
    const response = await apiRequest('GET', '/api/sources');
    return response.json();
  },

  refreshNews: async (): Promise<{ message: string; articlesAdded: number }> => {
    const response = await apiRequest('POST', '/api/news/refresh');
    return response.json();
  },
};
