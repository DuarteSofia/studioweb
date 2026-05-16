import { useState, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Star,
  Heart,
  Loader2,
} from 'lucide-react';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { toggleFavorite } from '@/store';
import { useIsFavorite } from '@/hooks/useStore';
import { buildWhatsAppUrl } from '@/utils/whatsapp';

export default function DesignPage() {
  const { slug } = useParams<{ slug: string }>();

  // ── Convex queries ────────────────────────────────────────────────────────
  const design = useQuery(api.designs.getBySlug, slug ? { slug } : 'skip');
  const niches = useQuery(api.niches.list) ?? [];
  const config = useQuery(api.settings.getPublicConfig);
  const trackView = useMutation(api.analytics.trackView);
  const trackChoose = useMutation(api.analytics.trackChoose);

  // ── Local state ───────────────────────────────────────────────────────────
  const isFav = useIsFavorite(design?._id as string ?? '');
  const [currentImg, setCurrentImg] = useState(0);
  const [imgLoaded, setImgLoaded] = useState<Record<number, boolean>>({});

  // Reset image when design changes
  useEffect(() => {
    setCurrentImg(0);
    setImgLoaded({});
  }, [slug]);

  const handleViewClick = useCallback(() => {
    if (design?._id) {
      trackView({ designId: design._id as Id<'designs'> }).catch(() => {});
    }
  }, [design, trackView]);

  const handleChooseClick = useCallback(() => {
    if (design?._id) {
      trackChoose({ designId: design._id as Id<'designs'> }).catch(() => {});
    }
  }, [design, trackChoose]);

  const handleFavorite = useCallback(() => {
    if (design?._id) toggleFavorite(design._id as string);
  }, [design]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (design === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b]">
        <div className="flex items-center gap-2 text-white/30">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Cargando...</span>
        </div>
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!design) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b]">
        <div className="text-center animate-fade-in">
          <p className="text-white/40 text-lg mb-4">Diseño no encontrado</p>
          <Link
            to="/"
            className="text-white/60 text-sm hover:text-white/80 transition-colors underline underline-offset-4"
          >
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  const sorted = [...(design.images ?? [])].sort((a, b) => a.order - b.order);
  const designNiches = niches
    .map((n) => ({ ...n, id: n._id as string }))
    .filter((n) => (design.nicheIds as string[]).includes(n.id));

  const whatsAppUrl = buildWhatsAppUrl(design as any, config);
  const siteName = config?.siteName || 'Studio Web';

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-gradient-to-b from-violet-500/[0.03] via-transparent to-transparent blur-3xl" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0b]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">{siteName}</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleFavorite}
              className={`flex items-center justify-center h-9 w-9 rounded-lg border transition-all ${
                isFav
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                  : 'border-white/[0.08] bg-white/[0.04] text-white/40 hover:text-white/60'
              }`}
            >
              <Heart size={15} fill={isFav ? 'currentColor' : 'none'} />
            </button>
            <a
              href={design.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleViewClick}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-[13px] font-medium text-white/60 hover:bg-white/[0.08] hover:text-white/80 transition-all"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">Demo</span>
            </a>
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleChooseClick}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600/90 px-3.5 py-1.5 text-[13px] font-semibold text-white hover:bg-emerald-600 transition-all"
            >
              <WhatsAppIcon size={14} />
              <span className="hidden sm:inline">Elegir este diseño</span>
              <span className="sm:hidden">Elegir</span>
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Gallery */}
          <div className="lg:col-span-3 animate-fade-in">
            {sorted.length > 0 ? (
              <div className="relative">
                <div
                  className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]"
                  style={{ aspectRatio: '16/10' }}
                >
                  {/* Loading state */}
                  {!imgLoaded[currentImg] && (
                    <div className="absolute inset-0 bg-white/[0.04] animate-pulse" />
                  )}
                  <img
                    src={sorted[currentImg]?.url}
                    alt={design.name}
                    onLoad={() => setImgLoaded((prev) => ({ ...prev, [currentImg]: true }))}
                    className={`h-full w-full object-cover transition-all duration-500 ${
                      imgLoaded[currentImg] ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  {/* Navigation */}
                  {sorted.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImg((c) => (c === 0 ? sorted.length - 1 : c - 1))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white/80 hover:bg-black/70 transition-all"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={() => setCurrentImg((c) => (c === sorted.length - 1 ? 0 : c + 1))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white/80 hover:bg-black/70 transition-all"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {sorted.length > 1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                    {sorted.map((img, i) => (
                      <button
                        key={img.id}
                        onClick={() => setCurrentImg(i)}
                        className={`relative shrink-0 overflow-hidden rounded-lg transition-all duration-200 ${
                          i === currentImg
                            ? 'ring-2 ring-white/30 opacity-100'
                            : 'opacity-40 hover:opacity-70'
                        }`}
                        style={{ width: 80, height: 50 }}
                      >
                        <img src={img.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div
                className="flex items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06]"
                style={{ aspectRatio: '16/10' }}
              >
                <span className="text-white/20">Sin imágenes</span>
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div className="lg:col-span-2 flex flex-col gap-5 animate-fade-in" style={{ animationDelay: '100ms' }}>
            {/* Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white/95 tracking-tight leading-tight">
                {design.name}
              </h1>
              {design.description && (
                <p className="mt-3 text-sm text-white/40 leading-relaxed">{design.description}</p>
              )}
            </div>

            {/* Badges */}
            {(design.isNew || design.popular || design.featured) && (
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
            )}

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
                        backgroundColor: niche.color + '15',
                        color: niche.color,
                      }}
                    >
                      {niche.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-white/[0.06]" />

            {/* CTA */}
            <div className="flex flex-col gap-3">
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleChooseClick}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-all duration-200"
              >
                <WhatsAppIcon size={17} />
                Me interesa este diseño
              </a>
              <a
                href={design.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleViewClick}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-3 text-sm font-medium text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-all duration-200"
              >
                <ExternalLink size={16} />
                Ver demo en vivo
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
