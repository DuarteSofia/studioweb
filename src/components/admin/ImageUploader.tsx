import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Upload,
  Link2,
  X,
  GripVertical,
  Crop,
  Star,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Plus,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useImageUpload, validateFile, type PendingImage } from '@/hooks/useImageUpload';
import ImageCropper from './ImageCropper';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ImageUploaderProps {
  /** Existing images to preload (when editing) */
  initialImages?: Array<{
    id: string;
    url: string;
    order: number;
    isCover: boolean;
    type?: string;
    storageId?: string;
  }>;
  /** Called whenever images state changes */
  onChange: (images: PendingImage[]) => void;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImageUploader({ initialImages, onChange }: ImageUploaderProps) {
  const {
    images,
    hasPending,
    uploadFile,
    uploadBlob,
    addExternalUrl,
    loadExisting,
    removeImage,
    setCover,
    reorder,
    cleanup,
  } = useImageUpload();

  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [cropSource, setCropSource] = useState<{ src: string; file?: File } | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  // Load initial images once
  useEffect(() => {
    if (!initialized.current && initialImages && initialImages.length > 0) {
      initialized.current = true;
      loadExisting(initialImages);
    }
  }, [initialImages, loadExisting]);

  // Notify parent on changes
  useEffect(() => {
    onChange(images);
  }, [images, onChange]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // ─── File Handling ──────────────────────────────────────────────────────────

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files);
      const isFirstBatch = images.length === 0;

      for (let i = 0; i < arr.length; i++) {
        const file = arr[i];
        const error = validateFile(file);
        if (error) {
          // Show validation error briefly
          continue;
        }

        const isCover = isFirstBatch && i === 0;

        // Open crop for first image if it's a cover candidate
        if (isCover && arr.length === 1) {
          const src = URL.createObjectURL(file);
          setCropSource({ src, file });
          return;
        }

        await uploadFile(file, { isCover, type: 'desktop' });
      }
    },
    [images.length, uploadFile]
  );

  // ─── Drag & Drop on zone ────────────────────────────────────────────────────

  const handleZoneDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingFile(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  // ─── URL Input ──────────────────────────────────────────────────────────────

  const handleAddUrl = useCallback(() => {
    const url = urlInput.trim();
    if (!url) return;

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setUrlError('URL inválida');
      return;
    }

    // Check if looks like an image
    const hasImageExtension =
      /\.(jpg|jpeg|png|webp|gif|avif|svg)(\?.*)?$/i.test(url) || url.includes('unsplash') || url.includes('imgur') || url.includes('cloudinary');

    if (!hasImageExtension) {
      setUrlError('La URL no parece ser una imagen. ¿Continuar de todas formas?');
      // Allow user to add anyway by pressing enter again
    }

    addExternalUrl(url);
    setUrlInput('');
    setUrlError('');
    setShowUrlInput(false);
  }, [urlInput, addExternalUrl]);

  // ─── Crop handling ──────────────────────────────────────────────────────────

  const handleCropConfirm = useCallback(
    async (blob: Blob, previewUrl: string) => {
      setCropSource(null);
      const isCover = images.length === 0;
      await uploadBlob(blob, previewUrl, { isCover, type: 'desktop' });
    },
    [images.length, uploadBlob]
  );

  const handleCropImage = useCallback((img: PendingImage) => {
    setCropSource({ src: img.previewUrl });
  }, []);

  // ─── Drag reorder ───────────────────────────────────────────────────────────

  const handleItemDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleItemDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverIndex.current = index;
  }, []);

  const handleItemDragEnd = useCallback(() => {
    if (draggedIndex !== null && dragOverIndex.current !== null && draggedIndex !== dragOverIndex.current) {
      reorder(draggedIndex, dragOverIndex.current);
    }
    setDraggedIndex(null);
    dragOverIndex.current = null;
  }, [draggedIndex, reorder]);

  const moveUp = useCallback((index: number) => {
    if (index > 0) reorder(index, index - 1);
  }, [reorder]);

  const moveDown = useCallback((index: number) => {
    if (index < images.length - 1) reorder(index, index + 1);
  }, [reorder, images.length]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-2">
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-medium text-white/30 uppercase tracking-wider">
          Imágenes — Arrastra para reordenar
        </label>
        {hasPending && (
          <span className="flex items-center gap-1 text-[10px] text-violet-400">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            Subiendo...
          </span>
        )}
      </div>

      {/* Images List */}
      {images.length > 0 && (
        <div className="space-y-1.5">
          {images.map((img, index) => (
            <div
              key={img.localId}
              draggable
              onDragStart={() => handleItemDragStart(index)}
              onDragOver={(e) => handleItemDragOver(e, index)}
              onDragEnd={handleItemDragEnd}
              className={`group flex items-center gap-2 rounded-lg border p-2 transition-all ${
                draggedIndex === index
                  ? 'border-violet-500/40 bg-violet-500/5 opacity-50 scale-[0.98]'
                  : img.status === 'error'
                  ? 'border-red-500/30 bg-red-500/5'
                  : img.isCover
                  ? 'border-blue-500/25 bg-blue-500/5'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]'
              }`}
            >
              {/* Drag handle */}
              <GripVertical
                size={12}
                className="text-white/15 shrink-0 cursor-grab active:cursor-grabbing group-hover:text-white/30 transition-colors"
              />

              {/* Thumbnail */}
              <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-white/[0.04]">
                {img.status === 'processing' || img.status === 'uploading' ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                    <div
                      className="h-0.5 w-full bg-white/10 overflow-hidden rounded-full"
                      style={{ position: 'absolute', bottom: 0, left: 0 }}
                    >
                      <div
                        className="h-full bg-violet-500 transition-all duration-300"
                        style={{ width: `${img.progress}%` }}
                      />
                    </div>
                    <div className="h-3 w-3 rounded-full border-2 border-white/20 border-t-violet-400 animate-spin" />
                  </div>
                ) : img.status === 'error' ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <AlertCircle size={14} className="text-red-400" />
                  </div>
                ) : (
                  <img
                    src={img.previewUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}

                {/* Cover badge */}
                {img.isCover && img.status === 'done' && (
                  <div className="absolute inset-0 flex items-end justify-center pb-0.5">
                    <span className="text-[8px] font-semibold text-blue-300 bg-blue-900/70 px-1 rounded">
                      Portada
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {img.status === 'error' ? (
                  <p className="text-[11px] text-red-400 truncate">{img.error || 'Error al subir'}</p>
                ) : img.status === 'processing' ? (
                  <p className="text-[11px] text-white/40">Convirtiendo a WebP...</p>
                ) : img.status === 'uploading' ? (
                  <p className="text-[11px] text-violet-400">Subiendo... {img.progress}%</p>
                ) : (
                  <div>
                    <p className="text-[11px] text-white/40 truncate">
                      {img.externalUrl ? '🔗 URL externa' : '📁 Convex Storage'}
                    </p>
                    {img.compressedSize && img.originalSize && (
                      <p className="text-[9px] text-white/20">
                        {formatBytes(img.originalSize)} → {formatBytes(img.compressedSize)} (WebP)
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile move buttons */}
              <div className="flex flex-col gap-0.5 sm:hidden">
                <button
                  type="button"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="p-0.5 text-white/20 hover:text-white/50 disabled:opacity-30"
                >
                  <ChevronUp size={10} />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(index)}
                  disabled={index === images.length - 1}
                  className="p-0.5 text-white/20 hover:text-white/50 disabled:opacity-30"
                >
                  <ChevronDown size={10} />
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5 shrink-0">
                {/* Crop button */}
                {img.status === 'done' && (
                  <button
                    type="button"
                    onClick={() => handleCropImage(img)}
                    className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.06] transition-all"
                    title="Recortar"
                  >
                    <Crop size={12} />
                  </button>
                )}

                {/* Cover button */}
                <button
                  type="button"
                  onClick={() => setCover(img.localId)}
                  className={`p-1.5 rounded transition-all ${
                    img.isCover
                      ? 'text-blue-400 bg-blue-500/15'
                      : 'text-white/20 hover:text-white/50 hover:bg-white/[0.06]'
                  }`}
                  title={img.isCover ? 'Portada actual' : 'Establecer como portada'}
                >
                  <Star size={12} fill={img.isCover ? 'currentColor' : 'none'} />
                </button>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => removeImage(img.localId)}
                  className="p-1.5 rounded text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Eliminar"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      <div
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
          isDraggingFile
            ? 'border-violet-500/60 bg-violet-500/10 scale-[0.99]'
            : 'border-white/[0.08] bg-white/[0.01] hover:border-white/[0.15] hover:bg-white/[0.03]'
        } ${images.length > 0 ? 'py-4' : 'py-8'}`}
        onDragEnter={() => setIsDraggingFile(true)}
        onDragLeave={() => setIsDraggingFile(false)}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingFile(true);
        }}
        onDrop={handleZoneDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />

        <div
          className={`flex flex-col items-center gap-2 pointer-events-none transition-all ${
            isDraggingFile ? 'scale-105' : 'scale-100'
          }`}
        >
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
              isDraggingFile
                ? 'border-violet-500/40 bg-violet-500/20 text-violet-300'
                : 'border-white/[0.08] bg-white/[0.04] text-white/30'
            }`}
          >
            <Upload size={16} />
          </div>
          <div className="text-center">
            <p className={`text-[12px] font-medium ${isDraggingFile ? 'text-violet-300' : 'text-white/50'}`}>
              {isDraggingFile ? 'Suelta para subir' : images.length > 0 ? 'Agregar más imágenes' : 'Arrastra imágenes o haz clic'}
            </p>
            <p className="text-[10px] text-white/20 mt-0.5">JPG, PNG, WebP, GIF — Máx. 20MB</p>
          </div>
        </div>
      </div>

      {/* URL Input row */}
      <div className="flex items-stretch gap-2">
        {showUrlInput ? (
          <>
            <div className="flex-1 relative">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setUrlError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddUrl();
                  }
                  if (e.key === 'Escape') {
                    setShowUrlInput(false);
                    setUrlInput('');
                    setUrlError('');
                  }
                }}
                autoFocus
                className={`w-full rounded-lg border px-3 py-2 text-sm text-white/90 placeholder-white/20 outline-none transition-all bg-white/[0.03] ${
                  urlError
                    ? 'border-amber-500/40 focus:border-amber-500/60'
                    : 'border-white/[0.08] focus:border-white/[0.15]'
                }`}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
              {urlError && (
                <p className="absolute -bottom-5 left-0 text-[10px] text-amber-400">{urlError}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleAddUrl}
              className="flex items-center gap-1.5 rounded-lg bg-white/[0.08] px-3 py-2 text-xs font-medium text-white/60 hover:bg-white/[0.12] hover:text-white/80 transition-all"
            >
              <Plus size={13} />
              Agregar
            </button>
            <button
              type="button"
              onClick={() => {
                setShowUrlInput(false);
                setUrlInput('');
                setUrlError('');
              }}
              className="p-2 rounded-lg text-white/20 hover:text-white/50 transition-all"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setShowUrlInput(true)}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.01] px-3 py-2 text-xs font-medium text-white/30 hover:border-white/[0.1] hover:text-white/50 transition-all"
          >
            <Link2 size={12} />
            Pegar URL externa
          </button>
        )}
      </div>

      {/* Status summary */}
      {images.length > 0 && (
        <div className="flex items-center gap-3 pt-0.5">
          <span className="text-[10px] text-white/20">
            {images.length} imagen{images.length !== 1 ? 'es' : ''}
          </span>
          {images.some((i) => i.status === 'done' && i.storageId) && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400/60">
              <CheckCircle2 size={9} />
              {images.filter((i) => i.storageId).length} en Storage
            </span>
          )}
          {images.some((i) => i.externalUrl) && (
            <span className="flex items-center gap-1 text-[10px] text-blue-400/60">
              <Link2 size={9} />
              {images.filter((i) => i.externalUrl).length} URL externa
            </span>
          )}
        </div>
      )}

      {/* Empty state hint */}
      {images.length === 0 && (
        <div className="flex items-center gap-1.5 py-1">
          <ImageIcon size={11} className="text-white/15" />
          <span className="text-[11px] text-white/20">Sin imágenes. La portada será la primera que subas.</span>
        </div>
      )}

      {/* Crop modal */}
      {cropSource && (
        <ImageCropper
          src={cropSource.src}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropSource(null)}
        />
      )}
    </div>
  );
}
