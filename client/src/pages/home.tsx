import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { FeaturedArticle } from "@/components/news/featured-article";
import { NewsCard } from "@/components/news/news-card";
import { TrendingSidebar } from "@/components/news/trending-sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { newsApi } from "@/lib/news-api";
import { RefreshCw } from "lucide-react";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("technologies");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: articles = [], isLoading, error } = useQuery({
    queryKey: ['/api/news', { category: activeCategory, query: searchQuery }],
    queryFn: () => newsApi.getNews({ 
      category: activeCategory,
      query: searchQuery || undefined,
      limit: 20 
    }),
  });

  const refreshMutation = useMutation({
    mutationFn: newsApi.refreshNews,
    onSuccess: (data) => {
      toast({
        title: "News Refreshed",
        description: `Successfully added ${data.articlesAdded} new articles`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/news'] });
    },
    onError: () => {
      toast({
        title: "Refresh Failed", 
        description: "Failed to refresh news. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleRefresh = () => {
    refreshMutation.mutate();
  };

  const featuredArticle = articles[0];
  const regularArticles = articles.slice(1);

  if (error) {
    return (
      <div className="min-h-screen bg-dashboard-bg">
        <Header onSearch={handleSearch} searchQuery={searchQuery} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-charcoal mb-4">Failed to Load News</h2>
            <p className="text-gray-600 mb-4">
              Unable to fetch news articles. Please check your connection and try again.
            </p>
            <Button onClick={handleRefresh} disabled={refreshMutation.isPending}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onSearch={handleSearch} searchQuery={searchQuery} />
      
      <div className="flex">
        <Sidebar 
          activeCategory={activeCategory} 
          onCategoryChange={handleCategoryChange} 
        />
        
        <div className="flex-1 max-w-6xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Category Title */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 capitalize">
                  {activeCategory}
                </h1>
              </div>

              {isLoading ? (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg overflow-hidden">
                    <Skeleton className="h-64 w-full" />
                    <div className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                </div>
              ) : articles.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No articles found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery 
                      ? `No articles found for "${searchQuery}" in ${activeCategory}`
                      : `No articles available in ${activeCategory}`
                    }
                  </p>
                  <Button onClick={handleRefresh} disabled={refreshMutation.isPending}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Load News
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {featuredArticle && <FeaturedArticle article={featuredArticle} />}
                </div>
              )}
            </div>
            
            {/* Related News Sidebar */}
            <TrendingSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
