import { useQuery } from "@tanstack/react-query";
import { newsApi } from "@/lib/news-api";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function Sidebar({ activeCategory, onCategoryChange }: SidebarProps) {
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => newsApi.getCategories(),
  });

  return (
    <aside className="w-56 bg-white border-r border-gray-200 sticky top-14 h-[calc(100vh-56px)]">
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Category</h3>
        <nav className="space-y-1">
          {categories.map((category) => {
            const isActive = activeCategory === category.slug;
            
            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.slug)}
                className={cn(
                  "block w-full text-left px-3 py-1.5 text-sm rounded transition-colors",
                  isActive
                    ? "text-blue-600 bg-blue-50 font-medium"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                {category.name}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
