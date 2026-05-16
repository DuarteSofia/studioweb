import { useState, useEffect } from 'react';
import { Save, Check, Loader2 } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export default function AdminConfig() {
  const settings = useQuery(api.settings.getAll);
  const setMultiple = useMutation(api.settings.setMultiple);
  const updatePassword = useMutation(api.auth.updatePassword);

  const [siteName, setSiteName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync form with loaded settings
  useEffect(() => {
    if (settings) {
      setSiteName(settings.siteName || '');
      setLogoUrl(settings.logoUrl || '');
      setWhatsappNumber(settings.whatsappNumber || '');
      setWhatsappMessage(settings.whatsappMessage || '');
      // Don't show password hash in plaintext
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates: { key: string; value: string }[] = [
        { key: 'siteName', value: siteName.trim() },
        { key: 'logoUrl', value: logoUrl.trim() },
        { key: 'whatsappNumber', value: whatsappNumber.trim() },
        { key: 'whatsappMessage', value: whatsappMessage.trim() },
      ];

      if (adminPassword.trim()) {
        await updatePassword({ newPassword: adminPassword.trim() });
      }

      await setMultiple({ settings: updates });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Settings save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (settings === undefined) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl">
        <div className="flex items-center gap-2 text-white/30">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Cargando configuración...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-white/90">Configuración</h1>
        <p className="text-xs text-white/30 mt-0.5">Ajustes generales del sitio · guardado en Convex</p>
      </div>

      <div className="space-y-6">
        {/* Site */}
        <section className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
          <h2 className="text-sm font-medium text-white/60">Sitio</h2>

          <div>
            <label className="block text-[11px] font-medium text-white/30 uppercase tracking-wider mb-1.5">
              Nombre del sitio
            </label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder-white/20 outline-none focus:border-white/[0.15]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-white/30 uppercase tracking-wider mb-1.5">
              Logo URL
            </label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder-white/20 outline-none focus:border-white/[0.15]"
              placeholder="https://ejemplo.com/logo.png"
            />
            {logoUrl && (
              <div className="mt-2 inline-block rounded-lg border border-white/[0.06] p-2 bg-white/[0.02]">
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="h-8 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </section>

        {/* WhatsApp */}
        <section className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
          <h2 className="text-sm font-medium text-white/60">WhatsApp</h2>

          <div>
            <label className="block text-[11px] font-medium text-white/30 uppercase tracking-wider mb-1.5">
              Número por defecto
            </label>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder-white/20 outline-none focus:border-white/[0.15]"
              placeholder="5491112345678"
            />
            <p className="mt-1 text-[10px] text-white/20">Sin +, sin espacios, con código de país</p>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-white/30 uppercase tracking-wider mb-1.5">
              Mensaje por defecto
            </label>
            <textarea
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder-white/20 outline-none focus:border-white/[0.15] resize-none"
            />
            <p className="mt-1 text-[10px] text-white/20">
              Variables disponibles: {'{{design_name}}'}
            </p>
          </div>
        </section>

        {/* Security */}
        <section className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
          <h2 className="text-sm font-medium text-white/60">Seguridad</h2>
          <div>
            <label className="block text-[11px] font-medium text-white/30 uppercase tracking-wider mb-1.5">
              Nueva contraseña admin
            </label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder-white/20 outline-none focus:border-white/[0.15]"
              placeholder="Dejar vacío para no cambiar"
            />
            <p className="mt-1 text-[10px] text-white/20">Guardado en Convex. Dejar vacío mantiene la contraseña actual.</p>
          </div>
        </section>

        {/* Save */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all disabled:opacity-60 ${
              saved
                ? 'bg-emerald-600/20 text-emerald-400'
                : 'bg-white/[0.1] text-white/80 hover:bg-white/[0.15]'
            }`}
          >
            {saved ? (
              <>
                <Check size={15} />
                Guardado en Convex
              </>
            ) : isSaving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={15} />
                Guardar configuración
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
