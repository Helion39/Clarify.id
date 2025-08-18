import { Badge } from "@/components/ui/badge";
import { Eye, MessageCircle, Share, Bookmark } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { NewsArticle } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface FeaturedArticleProps {
  article: NewsArticle;
}

export function FeaturedArticle({ article }: FeaturedArticleProps) {
  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });

  const getCategoryBadgeColor = (category: string) => {
    const colors = {
      technologies: "bg-blue-600 text-white",
      politics: "bg-red-600 text-white",
      business: "bg-yellow-600 text-white",
      science: "bg-purple-600 text-white",
      health: "bg-green-600 text-white",
    };
    return colors[category as keyof typeof colors] || "bg-gray-600 text-white";
  };

  return (
    <article className="bg-white rounded-lg overflow-hidden">
      {article.imageUrl && (
        <div className="relative">
          <img 
            src={article.imageUrl} 
            alt={article.title}
            className="w-full h-80 object-cover"
          />
          <div className="absolute top-4 left-4">
            <Badge className={`${getCategoryBadgeColor(article.category)} px-3 py-1 text-sm font-medium uppercase tracking-wide`}>
              AI RESEARCH
            </Badge>
          </div>
        </div>
      )}
      
      <div className="p-6">
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
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
          {article.title}
        </h1>
        
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
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

        <div className="flex items-center space-x-2">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Bookmark className="mr-1 h-4 w-4" />
            Save to pocket
          </Button>
          <Button size="sm" variant="outline" className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600">
            <Share className="mr-1 h-4 w-4" />
            Share on media
          </Button>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-gray-700 leading-relaxed">
            {article.description}
          </p>
        </div>
      </div>
    </article>
  );
}
