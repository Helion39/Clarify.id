// --- client/src/pages/dashboard.tsx ---
// This file has been significantly refactored to implement the Bento Grid layout.

import { useQuery } from '@tanstack/react-query';
import { EnhancedSidebar } from '@/components/layout/enhanced-sidebar';
import { TrendingSidebar } from '@/components/news/trending-sidebar';
import { FeaturedArticle } from '@/components/news/featured-article';
import { NewsCard } from '@/components/news/news-card';
import { NewsSkeleton } from '@/components/ui/news-skeleton';
import { newsApi } from '@/lib/news-api';
import type { NewsArticle } from '@shared/schema';
import { useLocation } from 'wouter';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [location] = useLocation();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    // Set 'Latest News' as default if no category is selected
    setActiveCategory(category || 'Latest News');
  }, [location]);

  const {
    data: articles,
    isLoading,
    isError,
  } = useQuery<NewsArticle[]>({
    queryKey: ['news', activeCategory],
    // Pass null to fetch general news when 'Latest News', 'Trending', etc. are selected
    queryFn: () => newsApi.getNews({
        category: ['Latest News', 'Trending', 'All News'].includes(activeCategory || '')
        ? undefined
        : activeCategory
    }),
  });

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        Failed to load news. Please try again later.
      </div>
    );
  }

  // --- DATA SLICING FOR BENTO GRID ---
  // We slice the articles array to fit the layout structure.
  const trendingArticle = articles?.[0];
  const relatedArticles = articles?.slice(1, 3) || []; // Articles 2 and 3
  const latestArticles = articles?.slice(3, 7) || [];  // Articles 4, 5, 6, 7

  return (
    <div className="grid grid-cols-12 gap-x-8 bg-gray-50/50">
      <div className="col-span-2">
        <EnhancedSidebar />
      </div>

      <main className="col-span-7 py-8">
        {isLoading ? (
          <NewsSkeleton />
        ) : (
          <div className="space-y-12">

            {/* --- TRENDING NEWS SECTION --- */}
            {trendingArticle && (
              <div>
                <h2 className="mb-4 text-2xl font-bold text-gray-800">Trending News</h2>
                {/* This is the large, full-width hero card */}
                <div className="h-[400px]">
                  <FeaturedArticle article={trendingArticle} />
                </div>
              </div>
            )}

            {/* --- RELATED NEWS SECTION --- */}
            {relatedArticles.length > 0 && (
              <div>
                <h2 className="mb-4 text-2xl font-bold text-gray-800">Related News</h2>
                {/* This is a 2-column grid for the medium-sized cards */}
                <div className="grid grid-cols-2 gap-6">
                  {relatedArticles.map((article) => (
                    <NewsCard key={article.id} article={article} />
                  ))}
                </div>
              </div>
            )}

            {/* --- LATEST NEWS SECTION --- */}
            {latestArticles.length > 0 && (
              <div>
                <h2 className="mb-4 text-2xl font-bold text-gray-800">Latest News</h2>
                {/* This is a 4-column grid for the smaller cards */}
                <div className="grid grid-cols-4 gap-6">
                  {latestArticles.map((article) => (
                    <NewsCard key={article.id} article={article} />
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      <div className="col-span-3">
        <TrendingSidebar />
      </div>
    </div>
  );
}