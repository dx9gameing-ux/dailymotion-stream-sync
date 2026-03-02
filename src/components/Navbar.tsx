import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Play, Menu, X } from 'lucide-react';

interface NavbarProps {
  onSearch?: (query: string) => void;
  searchValue?: string;
}

const Navbar: React.FC<NavbarProps> = ({ onSearch, searchValue = '' }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('q') as HTMLInputElement;
    if (onSearch) onSearch(input.value);
    else navigate(`/?q=${encodeURIComponent(input.value)}`);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-[var(--nav-blur)] border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="bg-primary rounded-md p-1.5">
              <Play className="w-4 h-4 text-primary-foreground fill-current" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">StreamHub</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</Link>
            <Link to="/series" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Series</Link>
            <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Admin</Link>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2">
            <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  name="q"
                  defaultValue={searchValue}
                  placeholder="Search videos..."
                  className="bg-secondary border border-border rounded-full pl-9 pr-4 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-56 transition-all"
                />
              </div>
            </form>

            {/* Mobile search toggle */}
            <button
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        {searchOpen && (
          <form onSubmit={handleSearch} className="md:hidden pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                name="q"
                defaultValue={searchValue}
                placeholder="Search videos..."
                autoFocus
                className="w-full bg-secondary border border-border rounded-full pl-9 pr-4 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </form>
        )}

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-3 flex flex-col gap-2 border-t border-border pt-3">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1" onClick={() => setMenuOpen(false)}>Home</Link>
            <Link to="/series" className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1" onClick={() => setMenuOpen(false)}>Series</Link>
            <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1" onClick={() => setMenuOpen(false)}>Admin</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
