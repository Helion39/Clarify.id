import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Header } from "@/components/layout/header";
import { EnhancedSidebar } from "@/components/layout/enhanced-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NewsCardSkeleton, EntertainmentCardSkeleton, SidebarSkeleton } from "@/components/ui/news-skeleton";
import { newsApi } from "@/lib/news-api";
import { Eye, Clock, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { NewsArticle } from "@shared/schema";
import { CategoryPlaceholder } from "@/components/ui/category-placeholder";

interface NewsCardProps {
  article: NewsArticle;
  variant?: "large" | "medium-large" | "medium" | "small";
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
          {article.imageUrl ? (
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
          ) : (
            <div className="relative">
              <CategoryPlaceholder categoryName={article.category} className="w-full h-64" />
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
              <span className="font-medium flex items-center">
                {article.source}
                {article.isVerified && <CheckCircle2 className="w-4 h-4 ml-1 text-blue-500" />}
              </span>
              <span className="mx-2">•</span>
              <span>{timeAgo}</span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  if (variant === "medium-large") {
    return (
      <Link href={`/article/${article.id}`}>
        <article className="bg-white rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
          {article.imageUrl ? (
            <div className="relative">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-4 left-4">
                <Badge className={`${getCategoryColor(article.category)} px-3 py-1 text-sm font-medium uppercase tracking-wide`}>
                  {article.category}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="relative">
              <CategoryPlaceholder categoryName={article.category} className="w-full h-48" />
              <div className="absolute top-4 left-4">
                <Badge className={`${getCategoryColor(article.category)} px-3 py-1 text-sm font-medium uppercase tracking-wide`}>
                  {article.category}
                </Badge>
              </div>
            </div>
          )}
          <div className="p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2 line-clamp-3">
              {article.title}
            </h2>
            <p className="text-gray-600 mb-3 line-clamp-2 text-sm">
              {article.description}
            </p>
            <div className="flex items-center text-xs text-gray-500">
              <span className="font-medium flex items-center">
                {article.source}
                {article.isVerified && <CheckCircle2 className="w-4 h-4 ml-1 text-blue-500" />}
              </span>
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
        {article.imageUrl ? (
          <img 
            src={article.imageUrl} 
            alt={article.title}
            className="w-20 h-16 object-cover rounded flex-shrink-0"
          />
        ) : (
          <CategoryPlaceholder categoryName={article.category} className="w-20 h-16 rounded flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
            {article.title}
          </h3>
          <div className="flex items-center text-xs text-gray-500">
            <span className="font-medium flex items-center">
              {article.source}
              {article.isVerified && <CheckCircle2 className="w-3 h-3 ml-1 text-blue-500" />}
            </span>
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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [activeTimeFilter, setActiveTimeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => newsApi.getCategories(),
  });

  const categoriesParam = selectedCategories.join(',');

  const { data: articles = [], isLoading: articlesLoading } = useQuery({
    queryKey: [
      "/api/news",
      { categories: categoriesParam, limit: 50, timeFilter: activeTimeFilter },
    ],
    queryFn: () =>
      newsApi.getNews({
        categories: categoriesParam,
        limit: 50,
        timeFilter: activeTimeFilter,
      }),
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Maybe reset pagination here if you implement search filtering
  };

  const handleCategoryToggle = (category: string, checked: boolean) => {
    setSelectedCategories((prev) => {
      if (checked) {
        return [...prev, category];
      } else {
        return prev.filter((cat) => cat !== category);
      }
    });
    setCurrentPage(1);
  };

  const handleTimeFilterChange = (timeFilter: string) => {
    setActiveTimeFilter(timeFilter);
    setCurrentPage(1);
  };

  const featuredArticle = articles[0];
  const trendingArticles = articles.slice(1, 4);
  const otherArticles = articles.slice(4);
  const sidebarArticles = articles.slice(0, 5); // Use top 5 articles for sidebar

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onSearch={handleSearch} searchQuery={searchQuery} />

      <div className="flex">
        <EnhancedSidebar
          categories={categories}
          selectedCategories={selectedCategories}
          activeTimeFilter={activeTimeFilter}
          onCategoryToggle={handleCategoryToggle}
          onTimeFilterChange={handleTimeFilterChange}
        />

        <div className="flex-1 max-w-6xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {articlesLoading ? (
                // Show a skeleton loader for the whole section
                <div className="space-y-8">
                  <NewsCardSkeleton variant="large" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                      <NewsCardSkeleton key={i} />
                    ))}
                  </div>
                </div>
              ) : articles.length > 0 ? (
                <>
                  {/* Trending Section */}
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedCategories.length > 0
                          ? "Top Stories"
                          : "Trending News"}
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {featuredArticle && (
                        <div className="md:col-span-2">
                          <NewsCard
                            article={featuredArticle}
                            variant="large"
                          />
                        </div>
                      )}
                    </div>
                  </section>

                  {/* More News Section */}
                  {otherArticles.length > 0 && (
                    <section>
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                          More News
                        </h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {otherArticles.map((article) => (
                          <NewsCard key={article.id} article={article} variant="medium-large" />
                        ))}
                      </div>
                    </section>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <h2 className="text-xl font-semibold text-gray-700">No articles found.</h2>
                  <p className="text-gray-500 mt-2">Try adjusting your filters or check back later.</p>
                </div>
              )}
            </div>

            {/* Right Sidebar - Also uses the main articles list */}
            <div className="lg:col-span-1">
              {articlesLoading ? (
                <SidebarSkeleton />
              ) : (
                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Popular Topics
                  </h3>
                  <div className="space-y-4">
                    {sidebarArticles.map((article) => (
                      <NewsCard
                        key={article.id}
                        article={article}
                        variant="small"
                      />
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