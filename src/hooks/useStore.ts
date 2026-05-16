import { useCallback, useEffect, useState } from 'react';
import {
  getDesigns,
  getActiveDesigns,
  getNiches,
  getConfig,
  subscribe,
  getDesignBySlug,
  getFavorites,
  isFavorite,
} from '@/store';
import type { Design, Niche, SiteConfig } from '@/types';

function useStoreData<T>(getter: () => T): T {
  const [data, setData] = useState<T>(getter);

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setData(getter());
    });
    return unsubscribe;
  }, [getter]);

  return data;
}

export function useNiches(): Niche[] {
  return useStoreData(getNiches);
}

export function useDesigns(): Design[] {
  return useStoreData(getDesigns);
}

export function useActiveDesigns(): Design[] {
  return useStoreData(getActiveDesigns);
}

export function useConfig(): SiteConfig {
  return useStoreData(getConfig);
}

export function useDesignBySlug(slug: string): Design | undefined {
  const getter = useCallback(() => getDesignBySlug(slug), [slug]);
  return useStoreData(getter);
}

export function useFavorites(): string[] {
  return useStoreData(getFavorites);
}

export function useIsFavorite(designId: string): boolean {
  const getter = useCallback(() => isFavorite(designId), [designId]);
  return useStoreData(getter);
}
