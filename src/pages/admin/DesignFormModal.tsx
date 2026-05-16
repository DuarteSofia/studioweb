import { useState, useEffect } from 'react';
import {
  X,
  FileText,
  CheckCircle,
  Archive,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import ImageUploader from '@/components/admin/ImageUploader';
import type { PendingImage } from '@/hooks/useImageUpload';
import type { DesignStatus } from '@/types';

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: DesignStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'draft', label: 'Borrador', icon: <FileText size={12} />, color: '#6b7280' },
  { value: 'published', label: 'Publicado', icon: <CheckCircle size={12} />, color: '#10b981' },
  { value: 'archived', label: 'Archivado', icon: <Archive size={12} />, color: '#f59e0b' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

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
  status: DesignStatus;
  order: number;
  images: Array<{
    id: string;
    url: string;
    order: number;
    isCover: boolean;
    type?: string;
    storageId?: string;
  }>;
  nicheIds: string[];
  whatsappNumberOverride?: string;
  whatsappMessageOverride?: string;
  viewClicks: number;
  chooseClicks: number;
  createdAt: number;
}

interface ConvexNiche {
  _id: Id<'niches'>;
  id: string;
  name: string;
  slug: string;
  color: string;
  order: number;
}

interface DesignFormModalProps {
  design: ConvexDesign | null;
  onClose: () => void;
  onSaved?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DesignFormModal({ design, onClose, onSaved }: DesignFormModalProps) {
  const niches = useQuery(api.niches.list) as ConvexNiche[] | undefined;
  const designs = useQuery(api.designs.list);
  const createDesign = useMutation(api.designs.create);
  const updateDesign = useMutation(api.designs.update);
  const addImage = useMutation(api.images.addImage);
  const addImageFromUrl = useMutation(api.images.addImageFromUrl);
  const setCoverMutation = useMutation(api.images.setCover);
  const reorderImages = useMutation(api.images.reorderImages);
  const removeImage = useMutation(api.images.remove);

  const isEditing = !!design;

  // Form fields
  const [name, setName] = useState(design?.name || '');
  const [description, setDescription] = useState(design?.description || '');
  const [demoUrl, setDemoUrl] = useState(design?.demoUrl || '');
  const [nicheIds, setNicheIds] = useState<string[]>(design?.nicheIds || []);
  const [featured, setFeatured] = useState(design?.featured || false);
  const [isNew, setIsNew] = useState(design?.isNew || false);
  const [popular, setPopular] = useState(design?.popular || false);
  const [status, setStatus] = useState<DesignStatus>(design?.status || 'draft');
  const [order, setOrder] = useState(design?.order || (designs ? designs.length + 1 : 1));
  const [whatsappNumber, setWhatsappNumber] = useState(design?.whatsappNumberOverride || '');
  const [whatsappMessage, setWhatsappMessage] = useState(design?.whatsappMessageOverride || '');

  // Images state from ImageUploader
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ESC handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Sync status → order
  useEffect(() => {
    if (designs && !isEditing) {
      setOrder(designs.length + 1);
    }
  }, [designs, isEditing]);

  const toggleNiche = (nicheId: string) => {
    setNicheIds((prev) =>
      prev.includes(nicheId) ? prev.filter((id) => id !== nicheId) : [...prev, nicheId]
    );
  };

  // ─── Save Handler ───────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Validate — must have at least one image done or be ok with no images
    const hasUploadInProgress = pendingImages.some(
      (img) => img.status === 'uploading' || img.status === 'processing'
    );
    if (hasUploadInProgress) {
      setSaveError('Espera a que terminen de subirse las imágenes.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // Convert nicheIds to Convex IDs
      const convexNicheIds = nicheIds as Id<'niches'>[];

      if (isEditing && design) {
        // ── UPDATE existing design ──────────────────────────────────────────

        await updateDesign({
          id: design._id,
          name: name.trim(),
          description: description.trim(),
          demoUrl: demoUrl.trim(),
          featured,
          isNew,
          popular,
          status,
          order,
          nicheIds: convexNicheIds,
          whatsappNumberOverride: whatsappNumber.trim() || undefined,
          whatsappMessageOverride: whatsappMessage.trim() || undefined,
        });

        // Handle image changes for existing design
        // Find existing image IDs still in pendingImages
        const existingImageIds = new Set(design.images.map((img) => img.id));
        const pendingLocalIds = new Set(pendingImages.map((img) => img.localId));

        // Images removed: were in design.images but not in pendingImages anymore
        for (const existingImg of design.images) {
          if (!pendingLocalIds.has(existingImg.id)) {
            try {
              await removeImage({ imageId: existingImg.id as Id<'designImages'> });
            } catch (e) {
              // May already be deleted
            }
          }
        }

        // New images to add (status=done, localId NOT in existing images)
        const newImages = pendingImages.filter(
          (img) => img.status === 'done' && !existingImageIds.has(img.localId)
        );

        for (const img of newImages) {
          if (img.storageId) {
            await addImage({
              designId: design._id,
              storageId: img.storageId as Id<'_storage'>,
              order: img.order,
              isCover: img.isCover,
              type: img.type,
            });
          } else if (img.externalUrl) {
            await addImageFromUrl({
              designId: design._id,
              url: img.externalUrl,
              order: img.order,
              isCover: img.isCover,
              type: img.type,
            });
          }
        }

        // Reorder existing images that stayed
        const reorderPayload = pendingImages
          .filter((img) => img.status === 'done' && existingImageIds.has(img.localId))
          .map((img) => ({ id: img.localId as Id<'designImages'>, order: img.order }));

        if (reorderPayload.length > 0) {
          await reorderImages({ images: reorderPayload });
        }

        // Set cover for the current cover image
        const coverImage = pendingImages.find((img) => img.isCover);
        if (coverImage && existingImageIds.has(coverImage.localId)) {
          await setCoverMutation({ imageId: coverImage.localId as Id<'designImages'> });
        }
      } else {
        // ── CREATE new design ───────────────────────────────────────────────

        const designId = await createDesign({
          name: name.trim(),
          description: description.trim(),
          demoUrl: demoUrl.trim(),
          featured,
          isNew,
          popular,
          status,
          order,
          nicheIds: convexNicheIds,
          whatsappNumberOverride: whatsappNumber.trim() || undefined,
          whatsappMessageOverride: whatsappMessage.trim() || undefined,
        });

        // Add all images
        const doneImages = pendingImages.filter((img) => img.status === 'done');

        for (const img of doneImages) {
          if (img.storageId) {
            await addImage({
              designId,
              storageId: img.storageId as Id<'_storage'>,
              order: img.order,
              isCover: img.isCover,
              type: img.type,
            });
          } else if (img.externalUrl) {
            await addImageFromUrl({
              designId,
              url: img.externalUrl,
              order: img.order,
              isCover: img.isCover,
              type: img.type,
            });
          }
        }
      }

      onSaved?.();
      onClose();
    } catch (err) {
      console.error('Save design error:', err);
      setSaveError(err instanceof Error ? err.message : 'Error al guardar. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto pt-8 pb-8 px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-[#111113] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h2 className="text-[15px] font-semibold text-white/90">
            {isEditing ? 'Editar diseño' : 'Nuevo diseño'}
          </h2>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Name + Status row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-white/30 uppercase tracking-wider mb-1.5">
                Nombre *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder-white/20 outline-none focus:border-white/[0.15]"
                placeholder="Ej: Blade & Crown Barbershop"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-white/30 uppercase tracking-wider mb-1.5">
                Estado
              </label>
              <div className="flex gap-1">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={`flex-1 flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium transition-all ${
                      status === opt.value ? 'ring-1' : 'bg-white/[0.04] text-white/30'
                    }`}
                    style={
                      status === opt.value
                        ? { backgroundColor: opt.color + '20', color: opt.color, boxShadow: `inset 0 0 0 1px ${opt.color}40` }
                        : {}
                    }
                  >
                    {opt.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-medium text-white/30 uppercase tracking-wider mb-1.5">
              Descripción corta
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder-white/20 outline-none focus:border-white/[0.15] resize-none"
              placeholder="Breve descripción del diseño..."
            />
          </div>

          {/* Demo URL */}
          <div>
            <label className="block text-[11px] font-medium text-white/30 uppercase tracking-wider mb-1.5">
              Demo URL
            </label>
            <input
              type="url"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder-white/20 outline-none focus:border-white/[0.15]"
              placeholder="https://demo.ejemplo.com"
            />
          </div>

          {/* Niches */}
          <div>
            <label className="block text-[11px] font-medium text-white/30 uppercase tracking-wider mb-2">
              Nichos
            </label>
            {niches === undefined ? (
              <div className="flex items-center gap-2 text-white/20">
                <Loader2 size={12} className="animate-spin" />
                <span className="text-xs">Cargando nichos...</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {[...niches].sort((a, b) => a.order - b.order).map((niche) => (
                  <button
                    key={niche._id}
                    type="button"
                    onClick={() => toggleNiche(niche._id as string)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                      nicheIds.includes(niche._id as string)
                        ? 'ring-1'
                        : 'bg-white/[0.04] text-white/30 hover:bg-white/[0.08]'
                    }`}
                    style={
                      nicheIds.includes(niche._id as string)
                        ? {
                            backgroundColor: niche.color + '20',
                            color: niche.color,
                            boxShadow: `0 0 0 1px ${niche.color}40`,
                          }
                        : {}
                    }
                  >
                    {niche.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── IMAGE UPLOADER ── */}
          <ImageUploader
            initialImages={design?.images}
            onChange={setPendingImages}
          />

          {/* Badges */}
          <div>
            <label className="block text-[11px] font-medium text-white/30 uppercase tracking-wider mb-2">
              Badges
            </label>
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Nuevo', value: isNew, set: setIsNew },
                { label: 'Popular', value: popular, set: setPopular },
                { label: 'Destacado', value: featured, set: setFeatured },
              ].map(({ label, value, set }) => (
                <label key={label} className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => set(!value)}
                    className={`h-4 w-4 rounded border transition-all flex items-center justify-center ${
                      value ? 'bg-white/20 border-white/30' : 'bg-white/[0.03] border-white/[0.1]'
                    }`}
                  >
                    {value && <span className="text-white text-[10px]">✓</span>}
                  </div>
                  <span className="text-xs text-white/50">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Order */}
          <div>
            <label className="block text-[11px] font-medium text-white/30 uppercase tracking-wider mb-1.5">
              Orden
            </label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              className="w-24 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/90 outline-none focus:border-white/[0.15]"
              min={1}
            />
          </div>

          {/* WhatsApp override */}
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-4 space-y-3">
            <p className="text-[11px] font-medium text-white/25 uppercase tracking-wider">
              WhatsApp personalizado (opcional)
            </p>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder-white/15 outline-none focus:border-white/[0.12]"
              placeholder="Número (ej: 5491112345678)"
            />
            <input
              type="text"
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder-white/15 outline-none focus:border-white/[0.12]"
              placeholder="Mensaje (usa {{design_name}} como variable)"
            />
          </div>

          {/* Error */}
          {saveError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5">
              <AlertCircle size={14} className="text-red-400 shrink-0" />
              <p className="text-[12px] text-red-400">{saveError}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-white/40 hover:text-white/60 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="flex items-center gap-2 rounded-lg bg-white/[0.1] px-5 py-2 text-sm font-medium text-white/90 hover:bg-white/[0.15] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Guardando en Convex...
                </>
              ) : (
                isEditing ? 'Guardar cambios' : 'Crear diseño'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
