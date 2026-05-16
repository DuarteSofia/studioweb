import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Star,
  GripVertical,
  Search,
  X,
  MousePointer,
  FileText,
  CheckCircle,
  Archive,
  Loader2,
} from 'lucide-react';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import DesignFormModal from './DesignFormModal';
import type { DesignStatus } from '@/types';

const STATUS_CONFIG: Record<DesignStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Borrador', color: '#6b7280', icon: <FileText size={10} /> },
  published: { label: 'Publicado', color: '#10b981', icon: <CheckCircle size={10} /> },
  archived: { label: 'Archivado', color: '#f59e0b', icon: <Archive size={10} /> },
};

type ConvexDesign = {
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
};

export default function AdminDesigns() {
  const designs = useQuery(api.designs.list) as ConvexDesign[] | undefined;
  const niches = useQuery(api.niches.list);
  const removeDesign = useMutation(api.designs.remove);
  const updateStatus = useMutation(api.designs.updateStatus);
  const toggleFeatured = useMutation(api.designs.toggleFeatured);

  const [editingDesign, setEditingDesign] = useState<ConvexDesign | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<DesignStatus | 'all'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (designs === undefined) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl">
        <div className="mb-6">
          <div className="h-6 w-32 bg-white/[0.05] rounded animate-pulse mb-2"></div>
          <div className="h-4 w-48 bg-white/[0.05] rounded animate-pulse"></div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="h-14 border-b border-white/[0.06] bg-white/[0.01]"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center px-4 py-4 border-b border-white/[0.04]">
              <div className="h-10 w-14 bg-white/[0.05] rounded animate-pulse mr-4"></div>
              <div className="h-5 w-48 bg-white/[0.05] rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const sorted = [...designs].sort((a, b) => a.order - b.order);
  const filtered = sorted
    .filter((d) => statusFilter === 'all' || d.status === statusFilter)
    .filter((d) => !searchQ || d.name.toLowerCase().includes(searchQ.toLowerCase()));

  // Stats
  const totalViews = designs.reduce((acc, d) => acc + (d.viewClicks || 0), 0);
  const totalChoose = designs.reduce((acc, d) => acc + (d.chooseClicks || 0), 0);
  const publishedCount = designs.filter((d) => d.status === 'published').length;

  const handleDelete = async (id: Id<'designs'>) => {
    setDeletingId(id);
    try {
      await removeDesign({ id });
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
      setDeleteConfirm(null);
    }
  };

  const handleToggleFeatured = async (design: ConvexDesign) => {
    try {
      await toggleFeatured({ id: design._id });
    } catch (err) {
      console.error('Toggle featured error:', err);
    }
  };

  const handleCycleStatus = async (design: ConvexDesign) => {
    const statuses: DesignStatus[] = ['draft', 'published', 'archived'];
    const currentIndex = statuses.indexOf(design.status || 'draft');
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    try {
      await updateStatus({ id: design._id, status: nextStatus });
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  const openEdit = (design: ConvexDesign) => {
    setEditingDesign(design);
    setShowForm(true);
  };

  const openCreate = () => {
    setEditingDesign(null);
    setShowForm(true);
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-lg font-semibold text-white/90">Diseños</h1>
          <p className="text-xs text-white/30 mt-0.5">
            {publishedCount} publicados · {designs.length} total · Convex
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-white/[0.08] px-4 py-2 text-[13px] font-medium text-white/80 hover:bg-white/[0.12] transition-all"
        >
          <Plus size={15} />
          Nuevo diseño
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="flex items-center gap-2 text-white/30 mb-1">
            <Eye size={13} />
            <span className="text-[10px] uppercase tracking-wider font-medium">Vistas Demo</span>
          </div>
          <p className="text-xl font-semibold text-white/80">{totalViews}</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="flex items-center gap-2 text-white/30 mb-1">
            <WhatsAppIcon size={13} />
            <span className="text-[10px] uppercase tracking-wider font-medium">WhatsApp</span>
          </div>
          <p className="text-xl font-semibold text-emerald-400">{totalChoose}</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="flex items-center gap-2 text-white/30 mb-1">
            <MousePointer size={13} />
            <span className="text-[10px] uppercase tracking-wider font-medium">Tasa Conv.</span>
          </div>
          <p className="text-xl font-semibold text-white/80">
            {totalViews > 0 ? ((totalChoose / totalViews) * 100).toFixed(1) : 0}%
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="flex items-center gap-2 text-white/30 mb-1">
            <CheckCircle size={13} />
            <span className="text-[10px] uppercase tracking-wider font-medium">Publicados</span>
          </div>
          <p className="text-xl font-semibold text-white/80">{publishedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Buscar diseño..."
            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] pl-9 pr-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-white/[0.1]"
          />
        </div>
        {/* Status filter */}
        <div className="flex gap-1">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'all'
                ? 'bg-white/[0.1] text-white/80'
                : 'text-white/30 hover:text-white/50'
            }`}
          >
            Todos
          </button>
          {(['published', 'draft', 'archived'] as DesignStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s ? 'text-white/80' : 'text-white/30 hover:text-white/50'
              }`}
              style={statusFilter === s ? { backgroundColor: STATUS_CONFIG[s].color + '20' } : {}}
            >
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-1">
        {filtered.map((design) => {
          const coverImg = design.images.find((i) => i.isCover) || design.images[0];
          const dNiches = niches ? niches.filter((n) => design.nicheIds.includes(n._id as string)) : [];
          const status = design.status || 'draft';
          const statusCfg = STATUS_CONFIG[status];

          return (
            <div
              key={design._id}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
                status === 'published'
                  ? 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                  : 'border-white/[0.03] bg-white/[0.01] opacity-60 hover:opacity-80'
              }`}
            >
              <GripVertical size={14} className="text-white/15 shrink-0 cursor-grab" />

              {/* Thumbnail */}
              <div className="h-10 w-16 shrink-0 overflow-hidden rounded-md bg-white/[0.04]">
                {coverImg ? (
                  <img
                    src={coverImg.url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-white/15 text-[10px]">
                    N/A
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-medium text-white/80 truncate">{design.name}</p>
                  <button
                    onClick={() => handleCycleStatus(design)}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium transition-all hover:opacity-80 shrink-0"
                    style={{ backgroundColor: statusCfg.color + '20', color: statusCfg.color }}
                    title="Cambiar estado"
                  >
                    {statusCfg.icon}
                    {statusCfg.label}
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-1">
                    {dNiches.slice(0, 2).map((n) => (
                      <span
                        key={n._id}
                        className="text-[9px] rounded px-1 py-0.5 font-medium"
                        style={{ backgroundColor: n.color + '15', color: n.color }}
                      >
                        {n.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-white/25">
                    <span className="flex items-center gap-0.5">
                      <Eye size={9} />
                      {design.viewClicks || 0}
                    </span>
                    <span className="flex items-center gap-0.5 text-emerald-400/60">
                      <WhatsAppIcon size={9} />
                      {design.chooseClicks || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleToggleFeatured(design)}
                  className={`p-1.5 rounded-md transition-all ${
                    design.featured
                      ? 'text-violet-400 bg-violet-500/10'
                      : 'text-white/15 hover:text-white/30'
                  }`}
                  title="Destacar"
                >
                  <Star size={14} />
                </button>
                <button
                  onClick={() => openEdit(design)}
                  className="p-1.5 rounded-md text-white/20 hover:text-white/50 transition-all"
                  title="Editar"
                >
                  <Pencil size={14} />
                </button>
                {deleteConfirm === design._id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(design._id)}
                      disabled={deletingId === design._id}
                      className="p-1.5 rounded-md text-red-400 bg-red-500/10 disabled:opacity-50"
                    >
                      {deletingId === design._id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="p-1.5 rounded-md text-white/30"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(design._id)}
                    className="p-1.5 rounded-md text-white/15 hover:text-red-400 transition-all"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-white/25 text-sm">No hay diseños</p>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <DesignFormModal
          design={editingDesign}
          onClose={() => {
            setShowForm(false);
            setEditingDesign(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditingDesign(null);
          }}
        />
      )}
    </div>
  );
}
