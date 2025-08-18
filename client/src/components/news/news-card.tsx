import { Badge } from "@/components/ui/badge";
import { ExternalLink, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { NewsArticle } from "@shared/schema";

interface NewsCardProps {
  article: NewsArticle;
}

export function NewsCard({ article }: NewsCardProps) {
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
    <article className="news-card">
      <div className="md:flex">
        {article.imageUrl && (
          <div className="md:flex-shrink-0">
            <img 
              src={article.imageUrl} 
              alt={article.title}
              className="h-48 w-full object-cover md:h-32 md:w-48"
            />
          </div>
        )}
        <div className="p-4 flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Badge className={`category-badge ${getCategoryColor(article.category)}`}>
              {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
            </Badge>
            {article.isVerified && (
              <Badge className="verified-badge">
                <Shield className="mr-1 h-3 w-3" />
                Verified
              </Badge>
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-charcoal mb-2 hover:text-trust-red cursor-pointer">
            {article.title}
          </h3>
          
          {article.description && (
            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
              {article.description}
            </p>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-charcoal">{article.source}</span>
              <span className="text-gray-500">{timeAgo}</span>
            </div>
            <a 
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-trust-red hover:underline flex items-center"
            >
              Read more <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
