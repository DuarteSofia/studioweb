import type { Niche } from '@/types';

interface NicheFiltersProps {
  niches: Niche[];
  activeNicheId: string | null;
  onSelect: (nicheId: string | null) => void;
}

export default function NicheFilters({ niches, activeNicheId, onSelect }: NicheFiltersProps) {
  const sorted = [...niches].sort((a, b) => a.order - b.order);

  return (
    <div className="w-full overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex items-center gap-1.5 min-w-max py-0.5">
        <button
          onClick={() => onSelect(null)}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-all duration-200 ${
            activeNicheId === null
              ? 'bg-white text-black'
              : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.1] hover:text-white/70'
          }`}
        >
          Todos
        </button>
        {sorted.map((niche) => (
          <button
            key={niche.id}
            onClick={() => onSelect(niche.id === activeNicheId ? null : niche.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-all duration-200 ${
              activeNicheId === niche.id
                ? 'text-white'
                : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.1] hover:text-white/70'
            }`}
            style={
              activeNicheId === niche.id
                ? {
                    backgroundColor: niche.color + '20',
                    color: niche.color,
                    boxShadow: `inset 0 0 0 1px ${niche.color}30`,
                  }
                : {}
            }
          >
            {niche.name}
          </button>
        ))}
      </div>
    </div>
  );
}
