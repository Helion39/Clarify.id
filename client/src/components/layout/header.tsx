import { useState } from "react";
import { Link } from "wouter";
import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onSearch: (query: string) => void;
  searchQuery: string;
}

export function Header({ onSearch, searchQuery }: HeaderProps) {
  const [query, setQuery] = useState(searchQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-charcoal">Clarify.id</h1>
              <p className="text-xs text-gray-500 -mt-1">Trusted News</p>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link href="/" className="text-charcoal hover:text-trust-red px-3 py-2 text-sm font-medium border-b-2 border-trust-red">
                Dashboard
              </Link>
              <Link href="/live" className="text-gray-500 hover:text-charcoal px-3 py-2 text-sm font-medium">
                Live Feed
              </Link>
              <Link href="/trending" className="text-gray-500 hover:text-charcoal px-3 py-2 text-sm font-medium">
                Trending
              </Link>
              <Link href="/about" className="text-gray-500 hover:text-charcoal px-3 py-2 text-sm font-medium">
                About
              </Link>
            </div>
          </nav>

          {/* Search and Actions */}
          <div className="flex items-center space-x-4">
            <form onSubmit={handleSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search news..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trust-red focus:border-transparent"
              />
            </form>
            <Button variant="ghost" size="icon" className="p-2 text-gray-400 hover:text-charcoal">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
