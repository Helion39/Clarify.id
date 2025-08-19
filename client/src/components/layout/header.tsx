import { useState } from "react";
import { Link } from "wouter";
import { Search, Bell, Home, Menu, Sun, Moon, Bookmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface HeaderProps {
  onSearch: (query: string) => void;
  searchQuery: string;
  onSidebarToggle: () => void;
}

export function Header({ onSearch, searchQuery, onSidebarToggle }: HeaderProps) {
  const [query, setQuery] = useState(searchQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center space-x-4">
            {/* Sidebar Toggle - Visible on mobile */}
            <Button variant="ghost" size="icon" className="md:hidden text-gray-600 hover:text-gray-900" onClick={onSidebarToggle}>
              <Menu className="h-6 w-6" />
            </Button>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">Clarify.id</h1>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6 ml-6">
              <Link href="/" className="flex items-center space-x-2 text-gray-900 hover:text-blue-600 px-2 py-1 text-sm font-medium">
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
            </nav>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <form onSubmit={handleSubmit} className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Enter search term"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
              />
            </form>

            {/* Theme Toggle Placeholder */}
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Bookmark */}
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
              <Bookmark className="h-4 w-4" />
            </Button>

            {/* Notification */}
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>

            {/* Profile */}
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-600 text-white text-xs font-medium">
                  NT
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-right">
                <div className="text-sm font-medium text-gray-900">Navin H Thapa</div>
                <div className="text-xs text-gray-500">Tech Journalist</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
