import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Settings, Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useStore';

interface PublicConfig {
  siteName: string;
  logoUrl: string;
  whatsappNumber: string;
  whatsappMessage: string;
}

interface HeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  config?: PublicConfig | null;
}

export default function Header({ search, onSearchChange, config }: HeaderProps) {
  const favorites = useFavorites();
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const siteName = config?.siteName || 'Studio Web';
  const logoUrl = config?.logoUrl || '';

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !searchOpen && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0b]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.08] text-white text-sm font-bold group-hover:bg-white/[0.12] transition-colors">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-5 w-5 object-contain" />
            ) : (
              siteName.charAt(0)
            )}
          </div>
          <span className="text-[15px] font-semibold text-white/90 tracking-tight hidden sm:block">
            {siteName}
          </span>
        </Link>

        {/* Search + Actions */}
        <div className="flex items-center gap-1.5">
          {/* Favorites indicator */}
          {favorites.length > 0 && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-medium">
              <Heart size={11} fill="currentColor" />
              <span>{favorites.length}</span>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <div
              className={`flex items-center transition-all duration-300 ease-out overflow-hidden rounded-lg ${
                searchOpen
                  ? 'w-48 sm:w-64 bg-white/[0.06] border border-white/[0.08]'
                  : 'w-9'
              }`}
            >
              <button
                onClick={() => {
                  if (searchOpen && search) {
                    onSearchChange('');
                  }
                  setSearchOpen(!searchOpen);
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center text-white/40 hover:text-white/70 transition-colors"
                title={searchOpen ? 'Cerrar' : 'Buscar (/)'}
              >
                {searchOpen ? <X size={16} /> : <Search size={16} />}
              </button>
              {searchOpen && (
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Buscar diseños..."
                  className="h-9 w-full bg-transparent pr-3 text-sm text-white/90 placeholder-white/30 outline-none"
                  onBlur={() => {
                    if (!search) {
                      setTimeout(() => setSearchOpen(false), 150);
                    }
                  }}
                />
              )}
            </div>
          </div>

          {/* Admin access */}
          <Link
            to="/admin"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-all"
            title="Admin"
          >
            <Settings size={15} />
          </Link>
        </div>
      </div>
    </header>
  );
}
