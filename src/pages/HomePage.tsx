import { useState, useMemo } from 'react';
import { Heart } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Header from '@/components/Header';
import NicheFilters from '@/components/NicheFilters';
import DesignGrid from '@/components/DesignGrid';
import { useFavorites } from '@/hooks/useStore';

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [activeNicheId, setActiveNicheId] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);

  // ── Convex data ──────────────────────────────────────────────────────────────
  const designsData = useQuery(api.designs.listPublished);
  const designs = designsData ?? [];
  const niches = useQuery(api.niches.list) ?? [];
  const config = useQuery(api.settings.getPublicConfig);

  // ── localStorage (favorites are user-local) ───────────────────────────────
  const favorites = useFavorites();

  const filtered = useMemo(() => {
    let result = designs as typeof designs;

    // Filter by favorites
    if (showFavorites) {
      result = result.filter((d) => favorites.includes(d.id as string));
    }

    // Filter by niche
    if (activeNicheId) {
      result = result.filter((d) =>
        (d.nicheIds as string[]).includes(activeNicheId)
      );
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchingNicheIds = niches
        .filter((n) => n.name.toLowerCase().includes(q))
        .map((n) => n._id as string);

      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          (d.nicheIds as string[]).some((id) => matchingNicheIds.includes(id))
      );
    }

    return result;
  }, [designs, activeNicheId, search, niches, showFavorites, favorites]);

  const count = filtered.length;
  const favCount = favorites.length;

  // Build niche list compatible with NicheFilters (expects id field)
  const nichesForFilters = niches.map((n) => ({ ...n, id: n._id as string }));

  return (
    <div className="min-h-screen bg-[#0a0a0b] relative">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-violet-500/[0.04] via-transparent to-transparent blur-3xl" />

      <Header search={search} onSearchChange={setSearch} config={config} />

      <main className="mx-auto max-w-7xl">
        {/* Filters Bar */}
        <div className="sticky top-14 z-40 bg-[#0a0a0b]/90 backdrop-blur-lg border-b border-white/[0.04] py-3">
          <div className="flex items-center gap-2 px-4 sm:px-6">
            {/* Favorites toggle */}
            <button
              onClick={() => {
                setShowFavorites(!showFavorites);
                if (!showFavorites) {
                  setActiveNicheId(null);
                }
              }}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-all duration-200 ${
                showFavorites
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                  : 'bg-white/[0.06] text-white/40 hover:bg-white/[0.1] hover:text-white/60'
              }`}
            >
              <Heart size={13} fill={showFavorites ? 'currentColor' : 'none'} />
              <span className="hidden sm:inline">Favoritos</span>
              {favCount > 0 && (
                <span className={`text-[10px] ${showFavorites ? 'text-rose-300' : 'text-white/30'}`}>
                  ({favCount})
                </span>
              )}
            </button>

            {/* Divider */}
            <div className="h-5 w-px bg-white/[0.06] hidden sm:block" />

            {/* Niche filters */}
            {!showFavorites && (
              <div className="flex-1 overflow-hidden">
                <NicheFilters
                  niches={nichesForFilters}
                  activeNicheId={activeNicheId}
                  onSelect={setActiveNicheId}
                />
              </div>
            )}
          </div>

          <div className="px-4 sm:px-6 mt-2">
            <p className="text-[11px] text-white/25 font-medium">
              {count} {count === 1 ? 'diseño' : 'diseños'}
              {showFavorites && ' guardados'}
              {activeNicheId &&
                !showFavorites &&
                (() => {
                  const found = nichesForFilters.find((ni) => ni.id === activeNicheId);
                  return found ? ` en ${found.name}` : '';
                })()}
              {search && ` · "${search}"`}
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="px-4 sm:px-6 py-6">
          <DesignGrid designs={filtered as any} isLoading={designsData === undefined} />
        </div>

        {/* Footer */}
        <footer className="border-t border-white/[0.04] mt-12 py-8 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-white/15">
            <span>© {new Date().getFullYear()} {config?.siteName || 'Studio Web'}</span>
            <span>Diseños web premium a medida</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
