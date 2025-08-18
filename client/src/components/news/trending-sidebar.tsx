import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Shield, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { newsApi } from "@/lib/news-api";

export function TrendingSidebar() {
  const { data: trendingArticles = [] } = useQuery({
    queryKey: ['/api/news', { limit: 6 }],
    queryFn: () => newsApi.getNews({ limit: 6 }),
  });

  const { data: topArticles = [] } = useQuery({
    queryKey: ['/api/news', { limit: 3, offset: 6 }],
    queryFn: () => newsApi.getNews({ limit: 3, offset: 6 }),
  });

  return (
    <aside className="lg:col-span-1">
      <div className="space-y-6">
        {/* Trending Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Trending Now
          </h3>
          <div className="space-y-4">
            {trendingArticles.slice(0, 3).map((article, index) => (
              <article key={article.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                <div className="flex space-x-3">
                  {article.imageUrl && (
                    <img 
                      src={article.imageUrl} 
                      alt={article.title}
                      className="w-16 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-charcoal hover:text-trust-red cursor-pointer line-clamp-2">
                      {article.title}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">{article.source}</span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
                      </span>
                      {article.isVerified && (
                        <Badge className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5">
                          <Shield className="mr-1 h-2 w-2" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Most Read Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-charcoal mb-4">Most Read</h3>
          <div className="space-y-3">
            {topArticles.map((article, index) => (
              <div key={article.id} className="flex items-start space-x-3">
                <span className={`flex-shrink-0 w-6 h-6 rounded-full text-xs flex items-center justify-center font-semibold text-white ${
                  index === 0 ? 'bg-trust-red' : 'bg-gray-400'
                }`}>
                  {index + 1}
                </span>
                <div>
                  <h4 className="text-sm font-medium text-charcoal hover:text-trust-red cursor-pointer line-clamp-2">
                    {article.title}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {article.source} • {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badge */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-verified-green rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="text-white h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-charcoal mb-2">100% Verified Sources</h3>
            <p className="text-xs text-gray-600">
              All news articles are sourced from our curated list of trusted, reputable news organizations.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
