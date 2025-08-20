import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import clsx from "clsx";
import { Header } from "@/components/layout/header";
import { EnhancedSidebar } from "@/components/layout/enhanced-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NewsCardSkeleton, EntertainmentCardSkeleton, SidebarSkeleton } from "@/components/ui/news-skeleton";
import { newsApi } from "@/lib/news-api";
import { Eye, Clock, ChevronRight, ChevronLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { NewsArticle } from "@shared/schema";
import { CategoryPlaceholder } from "@/components/ui/category-placeholder";

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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [activeTimeFilter, setActiveTimeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => newsApi.getCategories(),
  });

  // When no categories are selected, fetch a default set for the "Trending" view.
  const categoriesParam = selectedCategories.length > 0 ? selectedCategories.join(',') : 'technologies,business,sports';

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

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onSearch={handleSearch}
        searchQuery={searchQuery}
        onSidebarToggle={handleSidebarToggle}
      />

      <div className="flex">
        <EnhancedSidebar
          isOpen={isSidebarOpen}
          onToggle={handleSidebarToggle}
          categories={categories}
          selectedCategories={selectedCategories}
          activeTimeFilter={activeTimeFilter}
          onCategoryToggle={handleCategoryToggle}
          onTimeFilterChange={handleTimeFilterChange}
        />

        <main
          className={clsx(
            "flex-1 max-w-7xl mx-auto px-6 py-6 transition-all duration-400 ease-in-out",
            {
              "md:ml-64": isSidebarOpen,
            }
          )}
        >
          {articlesLoading ? (
            // Skeleton for the new layout
            <div className="space-y-8">
                <NewsCardSkeleton variant="large" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <NewsCardSkeleton key={i} />)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(9)].map((_, i) => <NewsCardSkeleton key={i} />)}
                </div>
            </div>
          ) : articles.length > 0 ? (
            <div className="space-y-8">
              {/* Popular Topics Section */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Popular Topics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {articles.slice(0, 4).map((article) => (
                    <NewsCard key={article.id} article={article} />
                  ))}
                </div>
              </section>

              {/* Main Feed Section */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {selectedCategories.length > 0
                    ? "Top Stories"
                    : "All News"}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {articles.slice(4).map((article) => (
                    <NewsCard key={article.id} article={article} variant="large" />
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-700">No articles found.</h2>
              <p className="text-gray-500 mt-2">Try adjusting your filters or check back later.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}