import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutGrid, Tag, Settings, LogOut, ArrowLeft, Menu, X } from 'lucide-react';
import { logout } from '@/store';
import { useConfig } from '@/hooks/useStore';

export default function AdminLayout() {
  const location = useLocation();
  const config = useConfig();
  const [mobileNav, setMobileNav] = useState(false);

  const navItems = [
    { path: '/admin', label: 'Diseños', icon: LayoutGrid },
    { path: '/admin/niches', label: 'Nichos', icon: Tag },
    { path: '/admin/config', label: 'Configuración', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin' || location.pathname.startsWith('/admin/designs');
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-56 flex-col border-r border-white/[0.06] bg-[#0a0a0b]">
        <div className="flex h-14 items-center gap-2.5 px-5 border-b border-white/[0.06]">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.08] text-white text-xs font-bold">
            {config.siteName.charAt(0)}
          </div>
          <span className="text-[13px] font-semibold text-white/80">Admin</span>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
                isActive(path)
                  ? 'bg-white/[0.08] text-white/90'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/[0.06] space-y-0.5">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-white/30 hover:text-white/50 hover:bg-white/[0.04] transition-all"
          >
            <ArrowLeft size={15} />
            Ver sitio
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-white/30 hover:text-red-400 hover:bg-red-500/[0.06] transition-all"
          >
            <LogOut size={15} />
            Salir
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#0a0a0b]/90 backdrop-blur-xl px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.08] text-white text-xs font-bold">
            {config.siteName.charAt(0)}
          </div>
          <span className="text-[13px] font-semibold text-white/80">Admin</span>
        </div>
        <button onClick={() => setMobileNav(!mobileNav)} className="text-white/50">
          {mobileNav ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileNav && (
        <div className="lg:hidden fixed inset-0 z-40 bg-[#0a0a0b]/95 backdrop-blur-xl pt-14">
          <nav className="p-4 space-y-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileNav(false)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                  isActive(path)
                    ? 'bg-white/[0.08] text-white/90'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
            <div className="border-t border-white/[0.06] mt-4 pt-4 space-y-1">
              <Link
                to="/"
                onClick={() => setMobileNav(false)}
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white/30"
              >
                <ArrowLeft size={16} />
                Ver sitio
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-400/60"
              >
                <LogOut size={16} />
                Salir
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:overflow-y-auto">
        <div className="pt-14 lg:pt-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
