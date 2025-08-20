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

  const cardClasses = {
    large: "col-span-4 row-span-2",
    medium: "col-span-2",
    small: "col-span-1",
  };

  const imageClasses = {
    large: "h-full",
    medium: "h-48",
    small: "h-32",
  };

  const titleClasses = {
    large: "text-4xl font-extrabold",
    medium: "text-xl font-bold",
    small: "text-md font-semibold",
  };

  const descriptionClasses = {
    large: "text-lg mt-4",
    medium: "text-sm mt-2",
    small: "hidden",
  };

  return (
    <Link href={`/article/${article.id}`} className={`${cardClasses[variant]}`}>
      <article className="relative w-full h-full rounded-lg overflow-hidden cursor-pointer group">
        {article.imageUrl ? (
          <img 
            src={article.imageUrl} 
            alt={article.title}
            className={`w-full object-cover transition-transform duration-300 group-hover:scale-105 ${imageClasses[variant]}`}
          />
        ) : (
          <CategoryPlaceholder categoryName={article.category} className={`w-full ${imageClasses[variant]}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-6">
          <Badge className={`${getCategoryColor(article.category)} mb-2`}>
            {article.category}
          </Badge>
          <h2 className={`text-white line-clamp-3 ${titleClasses[variant]}`}>
            {article.title}
          </h2>
          <p className={`text-gray-300 line-clamp-2 ${descriptionClasses[variant]}`}>
            {article.description}
          </p>
          <div className="flex items-center text-sm text-gray-400 mt-4">
            <span className="font-medium">{article.source}</span>
            <span className="mx-2">•</span>
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
      { categories: categoriesParam, limit: 20, timeFilter: activeTimeFilter },
    ],
    queryFn: () =>
      newsApi.getNews({
        categories: categoriesParam,
        limit: 20,
        timeFilter: activeTimeFilter,
      }),
  });

  const trendingArticle = articles.length > 0 ? articles[0] : null;

  const { data: relatedArticles = [] } = useQuery({
    queryKey: [
      "/api/news",
      { category: trendingArticle?.category, limit: 2, timeFilter: activeTimeFilter },
    ],
    queryFn: () =>
      newsApi.getNews({
        category: trendingArticle!.category,
        limit: 2,
        timeFilter: activeTimeFilter,
      }),
    enabled: !!trendingArticle,
  });

  const latestArticles = articles.slice(1, 5);

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
            "flex-1 max-w-full mx-auto px-6 py-6 transition-all duration-400 ease-in-out",
            {
              "md:ml-64": isSidebarOpen,
            }
          )}
        >
          {articlesLoading ? (
            <div className="grid grid-cols-4 grid-rows-3 gap-6 h-[calc(100vh-100px)]">
              <div className="col-span-4 row-span-2"><NewsCardSkeleton variant="large" /></div>
              <div className="col-span-2"><NewsCardSkeleton variant="medium" /></div>
              <div className="col-span-2"><NewsCardSkeleton variant="medium" /></div>
              <div className="col-span-1"><NewsCardSkeleton variant="small" /></div>
              <div className="col-span-1"><NewsCardSkeleton variant="small" /></div>
              <div className="col-span-1"><NewsCardSkeleton variant="small" /></div>
              <div className="col-span-1"><NewsCardSkeleton variant="small" /></div>
            </div>
          ) : trendingArticle ? (
            <div className="grid grid-cols-4 grid-rows-3 gap-6 h-[calc(100vh-100px)]">
              <NewsCard article={trendingArticle} variant="large" />
              {relatedArticles.map((article) => (
                <NewsCard key={article.id} article={article} variant="medium" />
              ))}
              {latestArticles.map((article) => (
                <NewsCard key={article.id} article={article} variant="small" />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-700">No articles found.</h2>
              <p className="text-gray-500 mt-2">Try adjusting your filters or check back later.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}