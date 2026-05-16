import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DesignImage } from '@/types';

interface ImageCarouselProps {
  images: DesignImage[];
  aspectRatio?: string;
}

export default function ImageCarousel({ images, aspectRatio = '16/10' }: ImageCarouselProps) {
  const sorted = [...images].sort((a, b) => a.order - b.order);
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState<Record<number, boolean>>({});

  const goTo = useCallback((index: number) => {
    setCurrent(index);
  }, []);

  const prev = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrent((c) => (c === 0 ? sorted.length - 1 : c - 1));
    },
    [sorted.length]
  );

  const next = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrent((c) => (c === sorted.length - 1 ? 0 : c + 1));
    },
    [sorted.length]
  );

  if (sorted.length === 0) {
    return (
      <div
        className="w-full bg-white/[0.04] rounded-xl flex items-center justify-center"
        style={{ aspectRatio }}
      >
        <span className="text-white/20 text-sm">Sin imagen</span>
      </div>
    );
  }

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl group"
      style={{ aspectRatio }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Images */}
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {sorted.map((img, i) => (
          <div key={img.id} className="relative h-full w-full shrink-0">
            {!imgLoaded[i] && (
              <div className="absolute inset-0 bg-white/[0.04] animate-pulse" />
            )}
            <img
              src={img.url}
              alt=""
              loading={i === 0 ? 'eager' : 'lazy'}
              onLoad={() => setImgLoaded((prev) => ({ ...prev, [i]: true }))}
              className={`h-full w-full object-cover transition-opacity duration-300 ${
                imgLoaded[i] ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Navigation arrows */}
      {sorted.length > 1 && (
        <>
          <button
            onClick={prev}
            className={`absolute left-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white/80 hover:bg-black/70 transition-all duration-200 ${
              isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
            }`}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={next}
            className={`absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white/80 hover:bg-black/70 transition-all duration-200 ${
              isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
            }`}
          >
            <ChevronRight size={14} />
          </button>
        </>
      )}

      {/* Dots */}
      {sorted.length > 1 && (
        <div
          className={`absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-60'
          }`}
        >
          {sorted.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goTo(i);
              }}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'h-1.5 w-4 bg-white'
                  : 'h-1.5 w-1.5 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
