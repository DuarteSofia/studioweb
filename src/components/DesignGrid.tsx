import { useState, useCallback } from 'react';
import DesignCard from './DesignCard';
import DesignModal from './DesignModal';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDesign = any;

interface DesignGridProps {
  designs: AnyDesign[];
  isLoading?: boolean;
}

export default function DesignGrid({ designs, isLoading }: DesignGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const openModal = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const goToPrev = useCallback(() => {
    setSelectedIndex((current) => {
      if (current === null || current === 0) return current;
      return current - 1;
    });
  }, []);

  const goToNext = useCallback(() => {
    setSelectedIndex((current) => {
      if (current === null || current === designs.length - 1) return current;
      return current + 1;
    });
  }, [designs.length]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 animate-pulse">
            <div className="w-full aspect-[4/3] bg-white/[0.05] rounded-xl mb-4" />
            <div className="h-5 bg-white/[0.05] rounded w-3/4 mb-2" />
            <div className="h-4 bg-white/[0.05] rounded w-full mb-2" />
            <div className="h-4 bg-white/[0.05] rounded w-2/3 mb-4" />
            <div className="flex justify-between items-center mt-6">
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-white/[0.05] rounded-full" />
                <div className="h-6 w-16 bg-white/[0.05] rounded-full" />
              </div>
              <div className="h-8 w-8 bg-white/[0.05] rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (designs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 animate-fade-in">
  
        <p className="text-white/40 text-sm font-medium mb-1">No se encontraron diseños</p>
        <p className="text-white/25 text-xs">Prueba con otros filtros o busca algo diferente</p>
      </div>
    );
  }

  const selectedDesign = selectedIndex !== null ? designs[selectedIndex] : null;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {designs.map((design, index) => (
          <div
            key={(design._id as string) || design.id}
            className="animate-fade-in"
            style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
          >
            <DesignCard design={design} onOpenModal={() => openModal(index)} />
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedDesign && (
        <DesignModal
          design={selectedDesign}
          onClose={closeModal}
          onPrev={goToPrev}
          onNext={goToNext}
          hasPrev={selectedIndex !== null && selectedIndex > 0}
          hasNext={selectedIndex !== null && selectedIndex < designs.length - 1}
        />
      )}
    </>
  );
}
