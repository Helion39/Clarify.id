import { Badge } from "@/components/ui/badge";
import { ExternalLink, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { NewsArticle } from "@shared/schema";

interface FeaturedArticleProps {
  article: NewsArticle;
}

export function FeaturedArticle({ article }: FeaturedArticleProps) {
  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });

  const getCategoryColor = (category: string) => {
    const colors = {
      politics: "bg-trust-red text-white",
      technology: "bg-blue-100 text-blue-800",
      business: "bg-yellow-100 text-yellow-800",
      science: "bg-purple-100 text-purple-800",
      health: "bg-green-100 text-green-800",
      world: "bg-gray-100 text-gray-800",
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
      {article.imageUrl && (
        <img 
          src={article.imageUrl} 
          alt={article.title}
          className="w-full h-64 object-cover"
        />
      )}
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-3">
          <Badge className={`category-badge ${getCategoryColor(article.category)}`}>
            {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
          </Badge>
          {article.isVerified && (
            <Badge className="verified-badge">
              <Shield className="mr-1 h-3 w-3" />
              Verified Source
            </Badge>
          )}
          <span className="text-sm text-gray-500">{timeAgo}</span>
        </div>
        
        <h2 className="text-2xl font-bold text-charcoal mb-3 hover:text-trust-red cursor-pointer">
          {article.title}
        </h2>
        
        {article.description && (
          <p className="text-gray-600 mb-4">
            {article.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-charcoal">{article.source}</span>
            <span className="text-sm text-gray-500">•</span>
            {article.author && (
              <span className="text-sm text-gray-500">By {article.author}</span>
            )}
          </div>
          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-trust-red hover:underline text-sm font-medium flex items-center"
          >
            Read Full Article <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </div>
      </div>
    </article>
  );
}
