import { useQuery } from "@tanstack/react-query";
import { newsApi } from "@/lib/news-api";
import { 
  Newspaper, 
  Laptop, 
  Building, 
  FlaskConical, 
  Heart, 
  Globe, 
  University,
  CheckCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const categoryIcons = {
  "all": Newspaper,
  "technology": Laptop,
  "politics": University,
  "business": Building,
  "science": FlaskConical,
  "health": Heart,
  "world": Globe,
};

export function Sidebar({ activeCategory, onCategoryChange }: SidebarProps) {
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => newsApi.getCategories(),
  });

  const { data: sources = [] } = useQuery({
    queryKey: ['/api/sources'],
    queryFn: () => newsApi.getSources(),
  });

  return (
    <aside className="lg:col-span-1">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
        <h3 className="text-lg font-semibold text-charcoal mb-4">Categories</h3>
        <nav className="space-y-2">
          {categories.map((category) => {
            const Icon = categoryIcons[category.slug as keyof typeof categoryIcons] || Newspaper;
            const isActive = activeCategory === category.slug;
            
            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.slug)}
                className={cn(
                  "flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "text-white bg-trust-red"
                    : "text-gray-600 hover:text-charcoal hover:bg-gray-50"
                )}
              >
                <Icon className="mr-3 h-4 w-4" />
                {category.name}
              </button>
            );
          })}
        </nav>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-charcoal mb-3">Trusted Sources</h4>
          <div className="space-y-2">
            {sources.slice(0, 4).map((source) => (
              <div key={source.id} className="flex items-center text-xs text-gray-500">
                <CheckCircle className="text-verified-green mr-2 h-3 w-3" />
                {source.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
