import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { newsApi } from "@/lib/news-api";
import { Eye, MessageCircle, Share, Bookmark, ChevronLeft, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import type { NewsArticle } from "@shared/schema";

interface RelatedNewsCardProps {
  article: NewsArticle;
}

function RelatedNewsCard({ article }: RelatedNewsCardProps) {
  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });
  
  return (
    <Link href={`/article/${article.id}`}>
      <article className="flex space-x-3 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors">
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
          <div className="flex items-center text-xs text-gray-500 mb-1">
            <span className="font-medium">{article.source}</span>
            <span className="mx-1">•</span>
            <span>{timeAgo}</span>
          </div>
          <div className="flex items-center text-xs text-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            <span>Verified Source</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function ArticleDetail() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, params] = useRoute("/article/:id");
  const articleId = params?.id;

  const { data: article, isLoading: articleLoading } = useQuery({
    queryKey: ['/api/news', articleId],
    queryFn: () => newsApi.getArticle(articleId!),
    enabled: !!articleId,
  });

  const { data: relatedArticles = [] } = useQuery({
    queryKey: ['/api/news', { limit: 6, category: article?.category }],
    queryFn: () => newsApi.getNews({ 
      limit: 6, 
      category: article?.category 
    }),
    enabled: !!article?.category,
  });

  const { data: hotTopics = [] } = useQuery({
    queryKey: ['/api/news', { limit: 5 }],
    queryFn: () => newsApi.getNews({ limit: 5 }),
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

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

  if (articleLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onSearch={handleSearch} searchQuery={searchQuery} />
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-8 w-20 mb-4" />
              <Skeleton className="h-80 w-full mb-6" />
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onSearch={handleSearch} searchQuery={searchQuery} />
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Article not found</h1>
            <Link href="/">
              <Button>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onSearch={handleSearch} searchQuery={searchQuery} />
      
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Article Content */}
          <div className="lg:col-span-2">
            {/* Back Button */}
            <div className="mb-6">
              <Link href="/">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>

            {/* Article */}
            <article className="bg-white rounded-lg overflow-hidden">
              {article.imageUrl && (
                <div className="relative">
                  <img 
                    src={article.imageUrl} 
                    alt={article.title}
                    className="w-full h-80 object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className={`${getCategoryColor(article.category)} px-3 py-1 text-sm font-medium uppercase tracking-wide`}>
                      {article.category}
                    </Badge>
                  </div>
                </div>
              )}
              
              <div className="p-8">
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span>4.2m</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>28k</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Share className="h-4 w-4" />
                    <span>15k</span>
                  </div>
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
                  {article.title}
                </h1>
                
                <div className="flex items-center justify-between text-sm text-gray-600 mb-6">
                  <span>
                    By {article.author} • {new Date(article.publishedAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: '2-digit', 
                      day: '2-digit', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })} EST
                  </span>
                </div>

                <div className="flex items-center space-x-2 mb-6">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Bookmark className="mr-1 h-4 w-4" />
                    Save to pocket
                  </Button>
                  <Button size="sm" variant="outline" className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600">
                    <Share className="mr-1 h-4 w-4" />
                    Share on media
                  </Button>
                </div>

                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-6">
                    {article.description}
                  </p>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <p className="text-gray-700 leading-relaxed">
                      {article.content}
                    </p>
                  </div>
                </div>
              </div>
            </article>

            {/* Related News Section */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Related News</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedArticles.filter(a => a.id !== article.id).slice(0, 4).map((relatedArticle) => (
                  <RelatedNewsCard key={relatedArticle.id} article={relatedArticle} />
                ))}
              </div>
            </div>
          </div>
          
          {/* Hot Topics Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 sticky top-20">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Hot Topics</h3>
              <div className="space-y-4">
                {hotTopics.slice(0, 5).map((topic) => (
                  <RelatedNewsCard key={topic.id} article={topic} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}