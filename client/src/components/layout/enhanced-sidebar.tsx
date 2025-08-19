import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar, 
  Filter, 
  TrendingUp, 
  Newspaper, 
  Monitor, 
  Building, 
  Briefcase, 
  Microscope, 
  Heart, 
  Trophy, 
  Film, 
  Gamepad2,
  FileText,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface EnhancedSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  categories: Category[];
  selectedCategories: string[];
  activeTimeFilter: string;
  onCategoryToggle: (category: string, checked: boolean) => void;
  onTimeFilterChange: (timeFilter: string) => void;
}

const timeFilters = [
  { id: 'all', label: 'All Time', value: 'all' },
  { id: 'daily', label: 'Today', value: 'daily' },
  { id: 'weekly', label: 'This Week', value: 'weekly' },
  { id: 'monthly', label: 'This Month', value: 'monthly' },
  { id: 'yearly', label: 'This Year', value: 'yearly' },
];

export function EnhancedSidebar({
  isOpen,
  onToggle,
  categories,
  selectedCategories,
  activeTimeFilter,
  onCategoryToggle,
  onTimeFilterChange,
}: EnhancedSidebarProps) {
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(true);
  const isMobile = useIsMobile();

  // On mobile, the sidebar is only rendered when it's open.
  // On desktop, it's part of the layout.
  const isVisible = isMobile ? isOpen : true;
  const isOverlayVisible = isMobile && isOpen;

  if (!isVisible && isMobile) {
    return null;
  }

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden ${
          isOverlayVisible ? 'block' : 'hidden'
        }`}
        onClick={onToggle}
      ></div>
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto transition-transform duration-300 ease-in-out transform md:sticky md:top-14 md:h-[calc(100vh-56px)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="p-4 space-y-6">
        {/* Categories Section */}
        <div>
          <button
            onClick={() => setIsCategoryExpanded(!isCategoryExpanded)}
            className="flex items-center justify-between w-full mb-3 hover:bg-gray-50 rounded-lg p-1 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                CATEGORIES
              </h2>
            </div>
            {isCategoryExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-600" />
            )}
          </button>
          
          {isCategoryExpanded && (
            <div className="space-y-2">
              {/* Clear All Button */}
              {selectedCategories.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    selectedCategories.forEach(cat => onCategoryToggle(cat, false));
                  }}
                >
                  Clear All Filters
                </Button>
              )}
              
              {categories.map((category) => {
                const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
                  technologies: Monitor,
                  politics: Building,
                  business: Briefcase,
                  science: Microscope,
                  health: Heart,
                  sports: Trophy,
                  entertainment: Film,
                  games: Gamepad2
                };

                const IconComponent = categoryIcons[category.slug] || FileText;
                const isSelected = selectedCategories.includes(category.slug);

                return (
                  <div
                    key={category.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors hover:bg-gray-50 ${
                      isSelected ? 'bg-blue-50 border border-blue-200' : ''
                    }`}
                  >
                    <label
                      htmlFor={`category-${category.slug}`}
                      className={`flex items-center space-x-2 text-sm cursor-pointer flex-1 ${
                        isSelected ? 'text-blue-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span className="capitalize">{category.name}</span>
                    </label>
                    <Checkbox
                      id={`category-${category.slug}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => onCategoryToggle(category.slug, checked as boolean)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Separator />

        {/* Date Range Section */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Calendar className="h-4 w-4 text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              DATE RANGE
            </h2>
          </div>
          <div className="space-y-1">
            {timeFilters.map((filter) => (
              <button
                key={filter.id}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeTimeFilter === filter.value
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => onTimeFilterChange(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}