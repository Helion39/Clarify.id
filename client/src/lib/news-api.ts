import { apiRequest } from "./queryClient";
import type { NewsArticle, Category, Source, SearchNewsParams } from "@shared/schema";

export interface PaginatedNewsResponse {
  articles: NewsArticle[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ExtendedSearchParams {
  query?: string;
  category?: string;
  source?: string;
  limit?: number;
  offset?: number;
  timeFilter?: string;
  page?: number;
  paginated?: boolean;
}

export const newsApi = {
  getNews: async (params: ExtendedSearchParams = {}): Promise<NewsArticle[]> => {
    const searchParams = new URLSearchParams();
    
    if (params.query) searchParams.append('query', params.query);
    if (params.category) searchParams.append('category', params.category);
    if (params.source) searchParams.append('source', params.source);
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.offset) searchParams.append('offset', params.offset.toString());
    if (params.timeFilter) searchParams.append('timeFilter', params.timeFilter);
    if (params.page) searchParams.append('page', params.page.toString());

    const response = await apiRequest('GET', `/api/news?${searchParams.toString()}`);
    return response.json();
  },

  getNewsPaginated: async (params: ExtendedSearchParams = {}): Promise<PaginatedNewsResponse> => {
    const searchParams = new URLSearchParams();
    
    if (params.query) searchParams.append('query', params.query);
    if (params.category) searchParams.append('category', params.category);
    if (params.source) searchParams.append('source', params.source);
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.timeFilter) searchParams.append('timeFilter', params.timeFilter);
    if (params.page) searchParams.append('page', params.page.toString());
    
    searchParams.append('paginated', 'true');

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
