import { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface AdminLoginProps {
  onSuccess: () => void;
}

export default function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const loginMutation = useMutation(api.auth.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await loginMutation({ password });
      if (result.success && result.token) {
        sessionStorage.setItem("catalog_auth", result.token);
        onSuccess();
      } else {
        setError(true);
        setTimeout(() => setError(false), 2000);
      }
    } catch (err) {
      setError(true);
      setTimeout(() => setError(false), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.06]">
            <Lock size={20} className="text-white/40" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-white/90">Panel Admin</h1>
            <p className="mt-1 text-xs text-white/30">Ingresa la contraseña para continuar</p>
          </div>
          <div className="w-full">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className={`w-full rounded-lg border bg-white/[0.04] px-4 py-2.5 text-sm text-white/90 placeholder-white/25 outline-none transition-all ${
                error ? 'border-red-500/50' : 'border-white/[0.08] focus:border-white/[0.15]'
              }`}
              autoFocus
            />
            {error && (
              <p className="mt-2 text-xs text-red-400">Contraseña incorrecta</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/[0.08] py-2.5 text-sm font-medium text-white/80 hover:bg-white/[0.12] transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Acceder'}
          </button>
        </div>
      </form>
    </div>
  );
}
