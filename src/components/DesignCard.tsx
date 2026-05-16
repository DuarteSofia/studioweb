import { useState, useCallback, useEffect, useRef } from 'react';
import {
  ExternalLink,
  Sparkles,
  TrendingUp,
  Star,
  Heart,
  Maximize2,
} from 'lucide-react';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { toggleFavorite } from '@/store';
import { useIsFavorite } from '@/hooks/useStore';
import { buildWhatsAppUrl } from '@/utils/whatsapp';

interface ConvexDesign {
  _id: Id<'designs'>;
  id: string;
  name: string;
  slug: string;
  description: string;
  demoUrl: string;
  featured: boolean;
  isNew: boolean;
  popular: boolean;
  status: string;
  order: number;
  images: Array<{ id: string; url: string; order: number; isCover: boolean }>;
  nicheIds: string[];
  whatsappNumberOverride?: string;
  whatsappMessageOverride?: string;
  viewClicks: number;
  chooseClicks: number;
}

interface DesignCardProps {
  design: ConvexDesign;
  onOpenModal?: () => void;
}

export default function DesignCard({ design, onOpenModal }: DesignCardProps) {
  const niches = useQuery(api.niches.list) ?? [];
  const config = useQuery(api.settings.getPublicConfig);
  const trackView = useMutation(api.analytics.trackView);
  const trackChoose = useMutation(api.analytics.trackChoose);
  const isFav = useIsFavorite(design.id || (design._id as string));

  // Build niche list with id field
  const designNiches = niches
    .map((n) => ({ ...n, id: n._id as string }))
    .filter((n) => (design.nicheIds as string[]).includes(n.id));

  // Get cover and preview images
  const sorted = [...design.images].sort((a, b) => a.order - b.order);
  const coverImg = sorted.find((i) => i.isCover) || sorted[0];
  const previewImg = sorted.find((i) => !i.isCover) || sorted[1];

  const [isHovered, setIsHovered] = useState(false);
  const [coverLoaded, setCoverLoaded] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const previewTimerRef = useRef<number | null>(null);

  // Subtle hover preview effect
  useEffect(() => {
    if (isHovered && previewImg && previewLoaded) {
      previewTimerRef.current = window.setTimeout(() => {
        setShowPreview(true);
      }, 600);
    } else {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
      setShowPreview(false);
    }
    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
  }, [isHovered, previewImg, previewLoaded]);

  // Preload preview image when card enters viewport
  useEffect(() => {
    if (previewImg && !previewLoaded) {
      const img = new Image();
      img.src = previewImg.url;
      img.onload = () => setPreviewLoaded(true);
    }
  }, [previewImg, previewLoaded]);

  const designId = design._id || (design.id as unknown as Id<'designs'>);

  const handleViewClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      trackView({ designId }).catch(() => { });
    },
    [designId, trackView]
  );

  const handleChooseClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      trackChoose({ designId }).catch(() => { });
    },
    [designId, trackChoose]
  );

  const handleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFavorite(design.id || (design._id as string));
    },
    [design.id, design._id]
  );

  const handleOpenModal = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (onOpenModal) onOpenModal();
    },
    [onOpenModal]
  );

  const whatsAppUrl = buildWhatsAppUrl(design, config);

  return (
    <div
      className="group relative flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image container */}
      <div
        className="relative w-full overflow-hidden rounded-t-2xl cursor-pointer"
        style={{ aspectRatio: '16/10' }}
        onClick={handleOpenModal}
      >
        {/* Skeleton loader */}
        {!coverLoaded && (
          <div className="absolute inset-0 bg-white/[0.04] animate-pulse" />
        )}

        {/* Cover image */}
        {coverImg && (
          <img
            src={coverImg.url}
            alt={design.name}
            loading="lazy"
            onLoad={() => setCoverLoaded(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 ${coverLoaded ? 'opacity-100' : 'opacity-0'
              } ${showPreview ? 'opacity-0' : 'opacity-100'}`}
          />
        )}

        {/* Preview image (hover) */}
        {previewImg && previewLoaded && (
          <img
            src={previewImg.url}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${showPreview ? 'opacity-100' : 'opacity-0'
              }`}
          />
        )}

        {/* No image fallback */}
        {!coverImg && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/[0.04]">
            <span className="text-white/20 text-sm">Sin imagen</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Quick actions on hover */}
        <div
          className={`absolute top-3 right-3 flex items-center gap-1.5 transition-all duration-200 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
            }`}
        >
          <button
            onClick={handleFavorite}
            className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all ${isFav
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'bg-black/40 text-white/70 hover:bg-black/60 hover:text-white'
              }`}
          >
            <Heart size={14} fill={isFav ? 'currentColor' : 'none'} />
          </button>
          {onOpenModal && (
            <button
              onClick={handleOpenModal}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white/70 hover:bg-black/60 hover:text-white transition-all"
            >
              <Maximize2 size={14} />
            </button>
          )}
        </div>

        {/* Image count indicator */}
        {sorted.length > 1 && (
          <div
            className={`absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-sm px-2 py-1 text-[10px] font-medium text-white/70 transition-all duration-200 ${isHovered ? 'opacity-100' : 'opacity-60'
              }`}
          >
            <span>{sorted.length}</span>
            <span className="text-white/40">imgs</span>
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
        {design.isNew && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 backdrop-blur-sm">
            <Sparkles size={10} />
            Nuevo
          </span>
        )}
        {design.popular && (
          <span className="flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-400 backdrop-blur-sm">
            <TrendingUp size={10} />
            Popular
          </span>
        )}
        {design.featured && (
          <span className="flex items-center gap-1 rounded-full bg-violet-500/20 border border-violet-500/30 px-2 py-0.5 text-[10px] font-semibold text-violet-400 backdrop-blur-sm">
            <Star size={10} />
            Destacado
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <button onClick={handleOpenModal} className="text-left w-full">
            <h3 className="text-[15px] font-semibold text-white/90 group-hover:text-white transition-colors leading-tight">
              {design.name}
            </h3>
          </button>
          {designNiches.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {designNiches.map((niche) => (
                <span
                  key={niche.id}
                  className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: niche.color + '15',
                    color: niche.color,
                  }}
                >
                  {niche.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2 pt-1">
          <a
            href={design.demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleViewClick}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] font-medium text-white hover:bg-white/[0.08] hover:text-white/80 hover:border-white/[0.12] transition-all duration-200"
          >
            <ExternalLink size={13} />
            Ver demo
          </a>
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleChooseClick}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600/20 px-3 py-2 text-[12px] font-semibold text-white hover:bg-emerald-600/40 transition-all duration-200"
          >
            <WhatsAppIcon size={13} />
            Elegir
          </a>
        </div>
      </div>
    </div>
  );
}
