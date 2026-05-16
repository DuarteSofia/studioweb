import { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, ZoomIn, ZoomOut, Check, RotateCcw } from 'lucide-react';
import { compressBlob } from '@/hooks/useImageUpload';

// ─── Aspect Ratio Presets ─────────────────────────────────────────────────────

interface RatioPreset {
  label: string;
  value: number | undefined;
  desc: string;
}

const RATIO_PRESETS: RatioPreset[] = [
  { label: 'Libre', value: undefined, desc: 'Cualquier proporción' },
  { label: '16:10', value: 16 / 10, desc: 'Cards de diseño' },
  { label: '16:9', value: 16 / 9, desc: 'Widescreen' },
  { label: '4:3', value: 4 / 3, desc: 'Estándar' },
  { label: '1:1', value: 1, desc: 'Cuadrado' },
  { label: '9:16', value: 9 / 16, desc: 'Mobile portrait' },
];

// ─── Crop to Blob ─────────────────────────────────────────────────────────────

async function cropImageToBlob(
  image: HTMLImageElement,
  crop: PixelCrop
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );

  // Convert to WebP via canvas
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Crop export failed'));
      },
      'image/webp',
      0.85
    );
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ImageCropperProps {
  src: string;
  onConfirm: (blob: Blob, previewUrl: string) => void;
  onCancel: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImageCropper({ src, onConfirm, onCancel }: ImageCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [selectedRatio, setSelectedRatio] = useState<number | undefined>(16 / 10);
  const [scale, setScale] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize crop on image load
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
      const ratio = selectedRatio;

      const initialCrop = centerCrop(
        makeAspectCrop(
          { unit: '%', width: 90 },
          ratio ?? width / height,
          width,
          height
        ),
        width,
        height
      );
      setCrop(initialCrop);
    },
    [selectedRatio]
  );

  // When ratio changes, reset crop
  useEffect(() => {
    if (!imgRef.current) return;
    const { naturalWidth: w, naturalHeight: h } = imgRef.current;
    const ratio = selectedRatio;

    const newCrop = centerCrop(
      makeAspectCrop(
        { unit: '%', width: 90 },
        ratio ?? w / h,
        w,
        h
      ),
      w,
      h
    );
    setCrop(newCrop);
  }, [selectedRatio]);

  const handleConfirm = async () => {
    if (!imgRef.current || !completedCrop) return;
    setIsProcessing(true);

    try {
      // Get cropped blob
      const croppedBlob = await cropImageToBlob(imgRef.current, completedCrop);

      // Compress
      const compressed = await compressBlob(croppedBlob, {
        maxWidth: 1600,
        maxSizeMB: 1.5,
        quality: 0.85,
      });

      const previewUrl = URL.createObjectURL(compressed);
      onConfirm(compressed, previewUrl);
    } catch (err) {
      console.error('Crop failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-[#0e0e10] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
          <div>
            <h3 className="text-[14px] font-semibold text-white/90">Recortar imagen</h3>
            <p className="text-[11px] text-white/30 mt-0.5">Arrastra para ajustar el encuadre</p>
          </div>
          <button
            onClick={onCancel}
            className="text-white/30 hover:text-white/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Ratio presets */}
        <div className="flex items-center gap-1.5 px-5 py-3 border-b border-white/[0.04] overflow-x-auto">
          <span className="text-[10px] text-white/25 uppercase tracking-wider mr-1 shrink-0">Ratio</span>
          {RATIO_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setSelectedRatio(preset.value)}
              title={preset.desc}
              className={`shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                selectedRatio === preset.value
                  ? 'bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30'
                  : 'bg-white/[0.04] text-white/40 hover:bg-white/[0.08] hover:text-white/60'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Crop area */}
        <div className="flex items-center justify-center bg-[#080809] min-h-[300px] max-h-[420px] overflow-auto p-4">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={selectedRatio}
            minWidth={100}
            minHeight={60}
          >
            <img
              ref={imgRef}
              src={src}
              onLoad={onImageLoad}
              alt="Crop preview"
              style={{ transform: `scale(${scale})`, transformOrigin: 'center', maxHeight: '380px', maxWidth: '100%' }}
              crossOrigin="anonymous"
            />
          </ReactCrop>
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 px-5 py-3 border-t border-white/[0.04]">
          <ZoomOut size={14} className="text-white/30 shrink-0" />
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.05}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="flex-1 h-1 accent-violet-500"
          />
          <ZoomIn size={14} className="text-white/30 shrink-0" />
          <button
            onClick={() => setScale(1)}
            className="text-white/20 hover:text-white/50 transition-colors"
            title="Reset zoom"
          >
            <RotateCcw size={13} />
          </button>
          <span className="text-[11px] text-white/30 w-10 text-right">{Math.round(scale * 100)}%</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] px-5 py-3.5">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-white/40 hover:text-white/60 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing || !completedCrop}
            className="flex items-center gap-2 rounded-lg bg-violet-600/90 px-5 py-2 text-sm font-medium text-white hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isProcessing ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Check size={15} />
                Aplicar recorte
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
