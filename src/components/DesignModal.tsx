import { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Heart,
  Sparkles,
  TrendingUp,
  Star,
} from 'lucide-react';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useIsFavorite } from '@/hooks/useStore';
import { toggleFavorite } from '@/store';
import { buildWhatsAppUrl } from '@/utils/whatsapp';

interface DesignModalProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  design: any;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export default function DesignModal({
  design,
  onClose,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}: DesignModalProps) {
  const niches = useQuery(api.niches.list) ?? [];
  const config = useQuery(api.settings.getPublicConfig);
  const trackView = useMutation(api.analytics.trackView);
  const trackChoose = useMutation(api.analytics.trackChoose);
  const designId = (design._id || design.id) as Id<'designs'>;
  const isFav = useIsFavorite((design._id || design.id) as string);
  const [currentImg, setCurrentImg] = useState(0);
  const [imgLoaded, setImgLoaded] = useState<Record<number, boolean>>({});

  const sorted = [...(design.images as any[])].sort((a, b) => a.order - b.order);
  const designNiches = niches
    .map((n) => ({ ...n, id: n._id as string }))
    .filter((n) => (design.nicheIds as string[]).includes(n.id));

  const whatsAppUrl = buildWhatsAppUrl(design as any, config);

  // Reset image index when design changes
  useEffect(() => {
    setCurrentImg(0);
    setImgLoaded({});
  }, [design._id, design.id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') {
        if (sorted.length > 1) {
          setCurrentImg((c) => (c === 0 ? sorted.length - 1 : c - 1));
        } else if (hasPrev && onPrev) {
          onPrev();
        }
      }
      if (e.key === 'ArrowRight') {
        if (sorted.length > 1) {
          setCurrentImg((c) => (c === sorted.length - 1 ? 0 : c + 1));
        } else if (hasNext && onNext) {
          onNext();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, onPrev, onNext, hasPrev, hasNext, sorted.length]);

  const handleViewClick = useCallback(() => {
    trackView({ designId }).catch(() => { });
  }, [designId, trackView]);

  const handleChooseClick = useCallback(() => {
    trackChoose({ designId }).catch(() => { });
  }, [designId, trackChoose]);

  const handleFavorite = useCallback(() => {
    toggleFavorite((design._id || design.id) as string);
  }, [design._id, design.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-fade-in"
        onClick={onClose}
      />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/50 text-white/70 hover:bg-red-500/60 hover:text-white transition-all"
      >
        <X size={20} />
      </button>

      {/* Navigation arrows for designs */}
      {hasPrev && onPrev && (
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all"
        >
          <ChevronLeft size={24} />
        </button>
      )}
      {hasNext && onNext && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto scrollbar-hide animate-fade-in-scale">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Gallery */}
          <div className="lg:col-span-3">
            {sorted.length > 0 ? (
              <div className="relative">
                {/* Main image */}
                <div
                  className="relative overflow-hidden rounded-2xl bg-white/5"
                  style={{ aspectRatio: '16/10' }}
                >
                  {!imgLoaded[currentImg] && (
                    <div className="absolute inset-0 bg-white/5 animate-pulse" />
                  )}
                  <img
                    src={sorted[currentImg]?.url}
                    alt={design.name}
                    onLoad={() => setImgLoaded((prev) => ({ ...prev, [currentImg]: true }))}
                    className={`h-full w-full object-cover transition-all duration-500 ${imgLoaded[currentImg] ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                      }`}
                  />

                  {/* Image navigation */}
                  {sorted.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImg((c) => (c === 0 ? sorted.length - 1 : c - 1))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white/80 hover:bg-black/70 transition-all"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={() => setCurrentImg((c) => (c === sorted.length - 1 ? 0 : c + 1))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white/80 hover:bg-black/70 transition-all"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}

                  {/* Image counter */}
                  {sorted.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1.5">
                      {sorted.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentImg(i)}
                          className={`rounded-full transition-all ${i === currentImg
                            ? 'h-2 w-5 bg-white'
                            : 'h-2 w-2 bg-white/40 hover:bg-white/60'
                            }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {sorted.length > 1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                    {sorted.map((img, i) => (
                      <button
                        key={img.id}
                        onClick={() => setCurrentImg(i)}
                        className={`relative shrink-0 overflow-hidden rounded-lg transition-all duration-200 ${i === currentImg
                          ? 'ring-2 ring-white/40 opacity-100'
                          : 'opacity-40 hover:opacity-70'
                          }`}
                        style={{ width: 80, height: 50 }}
                      >
                        <img src={img.url} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div
                className="flex items-center justify-center rounded-2xl bg-white/5"
                style={{ aspectRatio: '16/10' }}
              >
                <span className="text-white/20">Sin imágenes</span>
              </div>
            )}
          </div>

          {/* Info panel */}
          <div className="lg:col-span-2 flex flex-col gap-5 py-2">
            {/* Title */}
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight leading-tight">
                {design.name}
              </h2>
              <p className="mt-2 text-sm text-white/40 leading-relaxed">{design.description}</p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {design.isNew && (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
                  <Sparkles size={12} /> Nuevo
                </span>
              )}
              {design.popular && (
                <span className="flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/20 px-3 py-1 text-xs font-medium text-amber-400">
                  <TrendingUp size={12} /> Popular
                </span>
              )}
              {design.featured && (
                <span className="flex items-center gap-1.5 rounded-full bg-violet-500/15 border border-violet-500/20 px-3 py-1 text-xs font-medium text-violet-400">
                  <Star size={12} /> Destacado
                </span>
              )}
            </div>

            {/* Niches */}
            {designNiches.length > 0 && (
              <div>
                <p className="text-[11px] font-medium text-white/25 uppercase tracking-wider mb-2">
                  Categorías
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {designNiches.map((niche) => (
                    <span
                      key={niche.id}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: niche.color + '18',
                        color: niche.color,
                      }}
                    >
                      {niche.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-white/[0.06]" />

            {/* Actions */}
            <div className="flex flex-col gap-2.5">
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleChooseClick}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-all duration-200"
              >
                <WhatsAppIcon size={16} />
                Me interesa este diseño
              </a>
              <div className="flex gap-2">
                <a
                  href={design.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleViewClick}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-all duration-200"
                >
                  <ExternalLink size={15} />
                  Ver demo
                </a>
                <button
                  onClick={handleFavorite}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${isFav
                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                    : 'border-white/[0.08] bg-white/[0.03] text-white/40 hover:text-white/60'
                    }`}
                >
                  <Heart size={15} fill={isFav ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
