import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Header } from "@/components/layout/header";
import { EnhancedSidebar } from "@/components/layout/enhanced-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NewsCardSkeleton, EntertainmentCardSkeleton, SidebarSkeleton } from "@/components/ui/news-skeleton";
import { newsApi } from "@/lib/news-api";
import { Eye, Clock, ChevronRight, ChevronLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { NewsArticle } from "@shared/schema";

interface NewsCardProps {
  article: NewsArticle;
  variant?: "large" | "medium" | "small";
}

function NewsCard({ article, variant = "medium" }: NewsCardProps) {
  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });
  
  const getCategoryColor = (category: string) => {
    const colors = {
      technologies: "bg-blue-600 text-white",
      politics: "bg-red-600 text-white",
      business: "bg-yellow-600 text-white",
      science: "bg-purple-600 text-white",
      health: "bg-green-600 text-white",
    };
    return colors[category as keyof typeof colors] || "bg-gray-600 text-white";
  };

  if (variant === "large") {
    return (
      <Link href={`/article/${article.id}`}>
        <article className="bg-white rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
          {article.imageUrl && (
            <div className="relative">
              <img 
                src={article.imageUrl} 
                alt={article.title}
                className="w-full h-64 object-cover"
              />
              <div className="absolute top-4 left-4">
                <Badge className={`${getCategoryColor(article.category)} px-3 py-1 text-sm font-medium uppercase tracking-wide`}>
                  {article.category}
                </Badge>
              </div>
            </div>
          )}
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-3">
              {article.title}
            </h2>
            <p className="text-gray-600 mb-4 line-clamp-2">
              {article.description}
            </p>
            <div className="flex items-center text-sm text-gray-500">
              <span className="font-medium">{article.source}</span>
              <span className="mx-2">•</span>
              <span>{timeAgo}</span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/article/${article.id}`}>
      <article className="flex space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
        {article.imageUrl && (
          <img 
            src={article.imageUrl} 
            alt={article.title}
            className="w-20 h-16 object-cover rounded flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
            {article.title}
          </h3>
          <div className="flex items-center text-xs text-gray-500">
            <span className="font-medium">{article.source}</span>
            <span className="mx-1">•</span>
            <span>{timeAgo}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("trending");
  const [activeTimeFilter, setActiveTimeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => newsApi.getCategories(),
  });

  const { data: trendingArticles = [], isLoading: trendingLoading } = useQuery({
    queryKey: ['/api/news', { category: 'technologies', limit: 6, timeFilter: activeTimeFilter }],
    queryFn: () => newsApi.getNews({ category: 'technologies', limit: 6, timeFilter: activeTimeFilter }),
  });

  const { data: sportsArticles = [], isLoading: sportsLoading } = useQuery({
    queryKey: ['/api/news', { category: 'sports', limit: 4, timeFilter: activeTimeFilter }],
    queryFn: () => newsApi.getNews({ category: 'sports', limit: 4, timeFilter: activeTimeFilter }),
  });

  const { data: entertainmentArticles = [], isLoading: entertainmentLoading } = useQuery({
    queryKey: ['/api/news', { category: 'games', limit: 6, timeFilter: activeTimeFilter }],
    queryFn: () => newsApi.getNews({ category: 'games', limit: 6, timeFilter: activeTimeFilter }),
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  const handleTimeFilterChange = (timeFilter: string) => {
    setActiveTimeFilter(timeFilter);
    setCurrentPage(1);
  };

  const featuredArticle = trendingArticles[0];
  const sidebarArticles = trendingArticles.slice(1, 6);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onSearch={handleSearch} searchQuery={searchQuery} />
      
      <div className="flex">
        <EnhancedSidebar 
          categories={categories}
          activeCategory={activeCategory}
          activeTimeFilter={activeTimeFilter}
          onCategoryChange={handleCategoryChange}
          onTimeFilterChange={handleTimeFilterChange}
        />
        
        <div className="flex-1 max-w-6xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Trending News Section */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Trending News</h2>
                  <Button variant="ghost" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    View all <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {trendingLoading ? (
                    <>
                      <div className="md:col-span-2">
                        <NewsCardSkeleton variant="large" />
                      </div>
                      {[...Array(2)].map((_, i) => (
                        <NewsCardSkeleton key={i} />
                      ))}
                    </>
                  ) : (
                    <>
                      {featuredArticle && (
                        <div className="md:col-span-2">
                          <NewsCard article={featuredArticle} variant="large" />
                        </div>
                      )}
                      {trendingArticles.slice(1, 3).map((article) => (
                        <NewsCard key={article.id} article={article} />
                      ))}
                    </>
                  )}
                </div>
              </section>

              {/* Sport Section */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Sport</h2>
                  <Button variant="ghost" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    View all <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sportsLoading ? (
                    [...Array(2)].map((_, i) => (
                      <NewsCardSkeleton key={i} />
                    ))
                  ) : (
                    sportsArticles.slice(0, 2).map((article) => (
                      <NewsCard key={article.id} article={article} />
                    ))
                  )}
                </div>
              </section>

              {/* Entertainment Section */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Entertainments</h2>
                  <Button variant="ghost" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    View all <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {entertainmentLoading ? (
                    [...Array(6)].map((_, i) => (
                      <EntertainmentCardSkeleton key={i} />
                    ))
                  ) : (
                    entertainmentArticles.map((article) => (
                      <Link key={article.id} href={`/article/${article.id}`}>
                        <div className="cursor-pointer hover:opacity-80 transition-opacity">
                          {article.imageUrl && (
                            <img 
                              src={article.imageUrl} 
                              alt={article.title}
                              className="w-full h-24 object-cover rounded-lg mb-2"
                            />
                          )}
                          <h3 className="text-xs font-medium text-gray-900 line-clamp-2">
                            {article.title.substring(0, 50)}...
                          </h3>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </section>
            </div>
            
            {/* Right Sidebar - Trending Topics */}
            <div className="lg:col-span-1">
              {trendingLoading ? (
                <SidebarSkeleton />
              ) : (
                <div className="bg-white rounded-lg p-6 sticky top-20">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Trending Topics</h3>
                  <div className="space-y-4">
                    {sidebarArticles.map((article) => (
                      <NewsCard key={article.id} article={article} variant="small" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}