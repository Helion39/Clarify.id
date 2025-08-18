import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { newsApi } from "@/lib/news-api";
import { Button } from "@/components/ui/button";

export function TrendingSidebar() {
  const { data: relatedArticles = [] } = useQuery({
    queryKey: ['/api/news', { limit: 4, offset: 1 }],
    queryFn: () => newsApi.getNews({ limit: 4, offset: 1 }),
  });

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

  const getCategoryLabel = (category: string) => {
    const labels = {
      technologies: "AI TECHNOLOGY",
      politics: "CONGRESS",
      business: "MACHINE LEARNING", 
      science: "ROBOTICS",
      health: "WHITE HOUSE",
    };
    return labels[category as keyof typeof labels] || category.toUpperCase();
  };

  return (
    <aside className="lg:col-span-1">
      <div className="bg-white rounded-lg">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Related <span className="font-normal">News</span></h3>
          <Button variant="ghost" className="text-blue-600 hover:text-blue-700 text-sm font-medium p-0">
            See all
          </Button>
        </div>
        
        <div className="p-4 space-y-4">
          {relatedArticles.slice(0, 3).map((article) => (
            <article key={article.id} className="group cursor-pointer">
              {article.imageUrl && (
                <div className="relative mb-3">
                  <img 
                    src={article.imageUrl} 
                    alt={article.title}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge className={`${getCategoryBadgeColor(article.category)} px-2 py-1 text-xs font-medium uppercase tracking-wide`}>
                      {getCategoryLabel(article.category)}
                    </Badge>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                    2.5m
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-3 group-hover:text-blue-600 transition-colors">
                  {article.title}
                </h4>
                
                <div className="flex items-center text-xs text-gray-500 mb-2">
                  <CheckCircle className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                  <span className="font-medium">Verified Source</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </aside>
  );
}
