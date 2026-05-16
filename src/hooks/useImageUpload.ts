import { useState, useCallback, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import imageCompression from 'browser-image-compression';

// ─── Types ───────────────────────────────────────────────────────────────────

export type UploadStatus = 'idle' | 'processing' | 'uploading' | 'done' | 'error';

export interface UploadProgress {
  status: UploadStatus;
  progress: number; // 0-100
  error?: string;
}

export interface ConvertOptions {
  maxWidth?: number;
  maxSizeMB?: number;
  quality?: number; // 0-1 for webp
}

const COVER_OPTIONS: ConvertOptions = {
  maxWidth: 1600,
  maxSizeMB: 1.5,
  quality: 0.85,
};

const GALLERY_OPTIONS: ConvertOptions = {
  maxWidth: 1920,
  maxSizeMB: 2,
  quality: 0.82,
};

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_RAW_SIZE_MB = 20;

// ─── WebP Conversion via Canvas ──────────────────────────────────────────────

export async function convertToWebP(
  source: File | Blob | string,
  options: ConvertOptions = COVER_OPTIONS
): Promise<Blob> {
  const { maxWidth = 1600, quality = 0.85 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();

    const process = () => {
      const canvas = document.createElement('canvas');
      let w = img.naturalWidth;
      let h = img.naturalHeight;

      if (w > maxWidth) {
        h = Math.round((h * maxWidth) / w);
        w = maxWidth;
      }

      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context unavailable'));

      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('WebP conversion failed'));
        },
        'image/webp',
        quality
      );
    };

    if (typeof source === 'string') {
      img.crossOrigin = 'anonymous';
      img.src = source;
    } else {
      img.src = URL.createObjectURL(source);
    }

    img.onload = process;
    img.onerror = () => reject(new Error('Image load failed'));
  });
}

// ─── Compress via browser-image-compression ───────────────────────────────────

export async function compressBlob(
  blob: Blob,
  options: ConvertOptions = COVER_OPTIONS
): Promise<Blob> {
  const { maxWidth = 1600, maxSizeMB = 1.5 } = options;

  const file = new File([blob], 'image.webp', { type: 'image/webp' });

  const compressed = await imageCompression(file, {
    maxSizeMB,
    maxWidthOrHeight: maxWidth,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.85,
  });

  return compressed;
}

// ─── Full Pipeline: File → WebP → Compressed Blob ────────────────────────────

export async function processImage(
  source: File | Blob | string,
  isCover: boolean = true,
  onProgress?: (p: number) => void
): Promise<Blob> {
  const opts = isCover ? COVER_OPTIONS : GALLERY_OPTIONS;

  onProgress?.(10);
  const webpBlob = await convertToWebP(source, opts);
  onProgress?.(60);
  const compressed = await compressBlob(webpBlob, opts);
  onProgress?.(90);

  return compressed;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Formato inválido. Solo JPG, PNG, WebP, GIF o AVIF.';
  }
  const sizeMB = file.size / 1024 / 1024;
  if (sizeMB > MAX_RAW_SIZE_MB) {
    return `El archivo es demasiado grande (${sizeMB.toFixed(1)}MB). Máximo ${MAX_RAW_SIZE_MB}MB.`;
  }
  return null;
}

// ─── useImageUpload Hook ──────────────────────────────────────────────────────

export interface PendingImage {
  /** Unique local ID for tracking */
  localId: string;
  /** Preview URL (object URL or external URL) */
  previewUrl: string;
  /** Convex storageId after upload — null if URL-based */
  storageId: string | null;
  /** External URL — null if storage-based */
  externalUrl: string | null;
  /** Whether this is the cover */
  isCover: boolean;
  /** Display order */
  order: number;
  /** Image type */
  type: 'desktop' | 'mobile' | 'gallery';
  /** Upload state */
  status: UploadStatus;
  /** Upload progress 0-100 */
  progress: number;
  /** Error message if failed */
  error?: string;
  /** File size after compression (bytes) */
  compressedSize?: number;
  /** Original file size (bytes) */
  originalSize?: number;
}

export function useImageUpload() {
  const generateUploadUrl = useMutation(api.images.generateUploadUrl);
  const [images, setImages] = useState<PendingImage[]>([]);
  const objectUrlsRef = useRef<string[]>([]);

  const updateImage = useCallback((localId: string, patch: Partial<PendingImage>) => {
    setImages((prev) => prev.map((img) => (img.localId === localId ? { ...img, ...patch } : img)));
  }, []);

  // Upload a File to Convex Storage
  const uploadFile = useCallback(
    async (
      file: File,
      options?: { isCover?: boolean; type?: PendingImage['type'] }
    ): Promise<PendingImage> => {
      const localId = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      objectUrlsRef.current.push(previewUrl);

      const pending: PendingImage = {
        localId,
        previewUrl,
        storageId: null,
        externalUrl: null,
        isCover: options?.isCover ?? false,
        order: 0, // caller sets order
        type: options?.type ?? 'desktop',
        status: 'processing',
        progress: 0,
        originalSize: file.size,
      };

      setImages((prev) => [...prev, pending]);

      try {
        // Process: WebP + compress
        const processed = await processImage(file, pending.isCover, (p) => {
          updateImage(localId, { progress: p });
        });

        updateImage(localId, { status: 'uploading', progress: 92, compressedSize: processed.size });

        // Get upload URL from Convex
        const uploadUrl = await generateUploadUrl();

        // POST blob to Convex Storage
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'image/webp' },
          body: processed,
        });

        if (!response.ok) {
          throw new Error(`Storage upload failed: ${response.status}`);
        }

        const { storageId } = await response.json();

        updateImage(localId, { status: 'done', progress: 100, storageId });

        return { ...pending, storageId, status: 'done', progress: 100, compressedSize: processed.size };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
        updateImage(localId, { status: 'error', error: errorMsg });
        throw err;
      }
    },
    [generateUploadUrl, updateImage]
  );

  // Upload processed blob (from cropper)
  const uploadBlob = useCallback(
    async (
      blob: Blob,
      previewUrl: string,
      options?: { isCover?: boolean; type?: PendingImage['type'] }
    ): Promise<PendingImage> => {
      const localId = crypto.randomUUID();

      const pending: PendingImage = {
        localId,
        previewUrl,
        storageId: null,
        externalUrl: null,
        isCover: options?.isCover ?? false,
        order: 0,
        type: options?.type ?? 'desktop',
        status: 'uploading',
        progress: 50,
        originalSize: blob.size,
      };

      setImages((prev) => [...prev, pending]);

      try {
        const uploadUrl = await generateUploadUrl();
        updateImage(localId, { progress: 70 });

        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'image/webp' },
          body: blob,
        });

        if (!response.ok) throw new Error(`Storage upload failed: ${response.status}`);

        const { storageId } = await response.json();
        updateImage(localId, { status: 'done', progress: 100, storageId, compressedSize: blob.size });

        return { ...pending, storageId, status: 'done', progress: 100 };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
        updateImage(localId, { status: 'error', error: errorMsg });
        throw err;
      }
    },
    [generateUploadUrl, updateImage]
  );

  // Add an external URL (no upload)
  const addExternalUrl = useCallback((url: string): PendingImage => {
    const localId = crypto.randomUUID();
    const img: PendingImage = {
      localId,
      previewUrl: url,
      storageId: null,
      externalUrl: url,
      isCover: false,
      order: 0,
      type: 'desktop',
      status: 'done',
      progress: 100,
    };
    setImages((prev) => [...prev, img]);
    return img;
  }, []);

  // Load existing images (when editing a design)
  const loadExisting = useCallback((existingImages: Array<{
    id: string;
    url: string;
    order: number;
    isCover: boolean;
    type?: string;
    storageId?: string;
  }>) => {
    const loaded: PendingImage[] = existingImages.map((img) => ({
      localId: img.id,
      previewUrl: img.url,
      storageId: img.storageId ?? null,
      externalUrl: img.storageId ? null : img.url,
      isCover: img.isCover,
      order: img.order,
      type: (img.type as PendingImage['type']) ?? 'desktop',
      status: 'done' as UploadStatus,
      progress: 100,
    }));
    setImages(loaded);
  }, []);

  const removeImage = useCallback((localId: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.localId !== localId);
      // Re-assign orders
      const reordered = filtered.map((img, i) => ({ ...img, order: i + 1 }));
      // Ensure cover if removed was cover
      if (!reordered.some((img) => img.isCover) && reordered.length > 0) {
        reordered[0].isCover = true;
      }
      return reordered;
    });
  }, []);

  const setCover = useCallback((localId: string) => {
    setImages((prev) =>
      prev.map((img) => ({ ...img, isCover: img.localId === localId }))
    );
  }, []);

  const reorder = useCallback((fromIndex: number, toIndex: number) => {
    setImages((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const [moved] = sorted.splice(fromIndex, 1);
      sorted.splice(toIndex, 0, moved);
      return sorted.map((img, i) => ({ ...img, order: i + 1 }));
    });
  }, []);

  const setType = useCallback((localId: string, type: PendingImage['type']) => {
    updateImage(localId, { type });
  }, [updateImage]);

  // Cleanup object URLs
  const cleanup = useCallback(() => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current = [];
  }, []);

  const sortedImages = [...images].sort((a, b) => a.order - b.order);
  const hasPending = images.some((img) => img.status === 'uploading' || img.status === 'processing');
  const hasErrors = images.some((img) => img.status === 'error');

  return {
    images: sortedImages,
    rawImages: images,
    hasPending,
    hasErrors,
    uploadFile,
    uploadBlob,
    addExternalUrl,
    loadExisting,
    removeImage,
    setCover,
    reorder,
    setType,
    updateImage,
    cleanup,
    setImages,
  };
}
