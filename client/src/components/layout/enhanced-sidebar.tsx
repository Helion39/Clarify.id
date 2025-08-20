import { useState, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
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
  ChevronUp,
  Infinity,
  CalendarDays,
  CalendarCheck,
  Sun,
} from "lucide-react";

import type { Category } from "@shared/schema";

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
  { id: 'all', label: 'All Time', value: 'all', icon: Infinity },
  { id: 'daily', label: 'Today', value: 'daily', icon: Sun },
  { id: 'weekly', label: 'This Week', value: 'weekly', icon: CalendarDays },
  { id: 'monthly', label: 'This Month', value: 'monthly', icon: Calendar },
  { id: 'yearly', label: 'This Year', value: 'yearly', icon: CalendarCheck },
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
  const sidebarRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.to(sidebarRef.current, {
        x: isOpen ? 0 : "-100%",
        duration: 0.4,
        ease: "power3.inOut",
      });
    },
    { dependencies: [isOpen], scope: sidebarRef }
  );

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
        ref={sidebarRef}
        className="fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto md:sticky md:top-14 md:h-[calc(100vh-56px)]"
        style={{ transform: 'translateX(-100%)' }} // Initial position
      >
        <div className="p-4 space-y-6">
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
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center space-x-2 ${
                    activeTimeFilter === filter.value
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => onTimeFilterChange(filter.value)}
                >
                  <filter.icon className="h-4 w-4" />
                  <span>{filter.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

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
      </div>
    </div>
    </>
  );
}