import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Check, Loader2 } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

const PRESET_COLORS = [
  '#a78bfa', '#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4',
  '#10b981', '#22c55e', '#84cc16', '#f59e0b', '#f97316',
  '#ef4444', '#ec4899', '#d946ef', '#6b7280',
];

type NicheItem = {
  _id: Id<'niches'>;
  id: string;
  name: string;
  slug: string;
  color: string;
  order: number;
  createdAt: number;
};

export default function AdminNiches() {
  const niches = useQuery(api.niches.list) as NicheItem[] | undefined;
  const createNiche = useMutation(api.niches.create);
  const updateNiche = useMutation(api.niches.update);
  const removeNiche = useMutation(api.niches.remove);

  const [editing, setEditing] = useState<NicheItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [order, setOrder] = useState(1);

  const sorted = niches ? [...niches].sort((a, b) => a.order - b.order) : [];

  const resetForm = () => {
    setName('');
    setColor(PRESET_COLORS[0]);
    setOrder(niches ? niches.length + 1 : 1);
    setEditing(null);
    setCreating(false);
  };

  const startEdit = (niche: NicheItem) => {
    setEditing(niche);
    setName(niche.name);
    setColor(niche.color);
    setOrder(niche.order);
    setCreating(false);
  };

  const startCreate = () => {
    resetForm();
    setOrder(niches ? niches.length + 1 : 1);
    setCreating(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      if (editing) {
        await updateNiche({ id: editing._id, name: name.trim(), color, order });
      } else {
        await createNiche({ name: name.trim(), color, order });
      }
      resetForm();
    } catch (err) {
      console.error('Niche save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: Id<'niches'>) => {
    try {
      await removeNiche({ id });
    } catch (err) {
      console.error('Niche delete error:', err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  if (niches === undefined) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl">
        <div className="mb-6">
          <div className="h-6 w-32 bg-white/[0.05] rounded animate-pulse mb-2"></div>
          <div className="h-4 w-48 bg-white/[0.05] rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-white/[0.05] animate-pulse"></div>
                <div className="h-5 w-24 bg-white/[0.05] rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-white/90">Nichos</h1>
          <p className="text-xs text-white/30 mt-0.5">{niches.length} nichos · guardados en Convex</p>
        </div>
        <button
          onClick={startCreate}
          className="flex items-center gap-2 rounded-lg bg-white/[0.08] px-4 py-2 text-[13px] font-medium text-white/80 hover:bg-white/[0.12] transition-all"
        >
          <Plus size={15} />
          Nuevo nicho
        </button>
      </div>

      {/* Create / Edit Form */}
      {(creating || editing) && (
        <div className="mb-6 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white/70">
              {editing ? 'Editar nicho' : 'Nuevo nicho'}
            </h3>
            <button onClick={resetForm} className="text-white/20 hover:text-white/40">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-white/30 uppercase tracking-wider mb-1.5">
                Nombre *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder-white/20 outline-none focus:border-white/[0.15]"
                placeholder="Ej: Barberías"
                autoFocus
              />
            </div>
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
          </div>

          <div>
            <label className="block text-[11px] font-medium text-white/30 uppercase tracking-wider mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-lg transition-all ${
                    color === c ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-[#111]' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-white/[0.1] px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/[0.15] disabled:opacity-50 transition-all"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {editing ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-1">
        {sorted.map((niche) => (
          <div
            key={niche._id}
            className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] px-4 py-3 transition-all"
          >
            <div
              className="h-4 w-4 rounded-full shrink-0"
              style={{ backgroundColor: niche.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-white/80">{niche.name}</p>
              <p className="text-[10px] text-white/25">/{niche.slug} · orden: {niche.order}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => startEdit(niche)}
                className="p-1.5 rounded-md text-white/20 hover:text-white/50 transition-all"
              >
                <Pencil size={14} />
              </button>
              {deleteConfirm === niche._id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDelete(niche._id)}
                    className="p-1.5 rounded-md text-red-400 bg-red-500/10"
                  >
                    <Trash2 size={14} />
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
                  onClick={() => setDeleteConfirm(niche._id)}
                  className="p-1.5 rounded-md text-white/15 hover:text-red-400 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {sorted.length === 0 && !creating && (
        <div className="text-center py-16">
          <p className="text-white/25 text-sm">No hay nichos creados</p>
        </div>
      )}
    </div>
  );
}
