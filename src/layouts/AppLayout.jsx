import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Dumbbell,
  Utensils,
  LineChart,
  MessageSquare,
  Library,
  LogOut,
  Menu,
  X,
  Shield
} from 'lucide-react';

import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';

const ADMIN_EMAILS = [
  "vonwuthenaumateo@gmail.com",
];

const emailIsAdmin = (email) =>
  Boolean(email) && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(String(email).toLowerCase());

const profileRowIsAdmin = (row) => {
  if (!row) return false;

  const candidates = [
    row.role,
    row.user_role,
    row.rol,
    row.userRole,
  ].filter(Boolean);

  const roleStr = candidates.length ? String(candidates[0]).toLowerCase() : "";
  if (roleStr === "admin" || roleStr === "coach") return true;

  const bools = [row.is_admin, row.admin, row.isAdmin].filter(v => typeof v === "boolean");
  if (bools.includes(true)) return true;

  return false;
};

const THREADS_TABLE = 'chat_threads';
const MESSAGES_TABLE = 'chat_messages';

const AppLayout = () => {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);

  // ✅ Badge global del menú "Chat / Contacto"
  const [chatUnread, setChatUnread] = useState(0);
  const refreshTimerRef = useRef(null);

  useEffect(() => {
    const run = async () => {
      if (!user?.id) {
        setIsAdmin(false);
        return;
      }

      // 0) Preferido: función DB (si existe). No rompe si no está.
      try {
        const { data, error } = await supabase.rpc('is_admin');
        if (!error && typeof data === 'boolean') {
          setIsAdmin(data);
          return;
        }
      } catch {
        // ignore
      }

      // 1) Fallback por email
      if (emailIsAdmin(user.email)) {
        setIsAdmin(true);
        return;
      }

      // 2) Chequeo por profiles
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          setIsAdmin(false);
          return;
        }

        setIsAdmin(profileRowIsAdmin(data));
      } catch {
        setIsAdmin(false);
      }
    };

    run();
  }, [user?.id, user?.email]);

  const refreshChatUnread = useCallback(async () => {
    if (!user?.id) return;

    try {
      // 1) Intento eficiente: sumar unread_by_* desde chat_threads (si existe el esquema nuevo)
      let tQuery = supabase
        .from(THREADS_TABLE)
        .select('id, unread_by_admin, unread_by_client');

      tQuery = isAdmin ? tQuery.eq('admin_id', user.id) : tQuery.eq('client_id', user.id);

      const { data: thFast, error: teFast } = await tQuery.limit(1000);
      if (!teFast && Array.isArray(thFast) && thFast.length) {
        const hasCols = Object.prototype.hasOwnProperty.call(thFast[0] || {}, 'unread_by_admin');
        if (hasCols) {
          const sum = thFast.reduce((acc, t) => {
            const v = isAdmin ? t.unread_by_admin : t.unread_by_client;
            return acc + (Number(v) || 0);
          }, 0);
          setChatUnread(sum);
          return;
        }
      }

      // 2) Fallback legacy: contar mensajes no leídos por read_at
      let tQueryLegacy = supabase.from(THREADS_TABLE).select('id');
      tQueryLegacy = isAdmin ? tQueryLegacy.eq('admin_id', user.id) : tQueryLegacy.eq('client_id', user.id);

      const { data: th, error: te } = await tQueryLegacy.limit(1000);
      if (te) return;

      const threadIds = (th ?? []).map((r) => r.id).filter(Boolean);
      if (!threadIds.length) {
        setChatUnread(0);
        return;
      }

      const { data: msgs, error: me } = await supabase
        .from(MESSAGES_TABLE)
        .select('id')
        .in('thread_id', threadIds)
        .is('read_at', null)
        .neq('sender_id', user.id)
        .limit(5000);

      if (me) return;
      setChatUnread((msgs ?? []).length);
    } catch {
      // silencioso
    }
  }, [user?.id, isAdmin]);

  // Inicial + cuando cambia usuario/rol
  useEffect(() => {
    if (!user?.id) return;
    refreshChatUnread();
  }, [user?.id, isAdmin, refreshChatUnread]);

  // Realtime: INSERT/UPDATE en messages para mantener badge al día
  useEffect(() => {
    if (!user?.id) return;

    const scheduleRefresh = () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => refreshChatUnread(), 300);
    };

    const channel = supabase
      .channel('rt_chat_badge')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: MESSAGES_TABLE }, scheduleRefresh)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: MESSAGES_TABLE }, scheduleRefresh)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [user?.id, refreshChatUnread]);

  const navItems = useMemo(() => {
    const base = [
      { path: '/app', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/app/entrenamiento', label: 'Entrenamiento', icon: Dumbbell },
      { path: '/app/nutricion', label: 'Nutrición', icon: Utensils },
      { path: '/app/progreso', label: 'Progreso', icon: LineChart },
      { path: '/app/chat', label: 'Chat / Contacto', icon: MessageSquare, badge: chatUnread },
      { path: '/app/recursos', label: 'Recursos', icon: Library },
    ];

    if (isAdmin) {
      base.push({ path: '/app/admin', label: 'Admin / Coach', icon: Shield });
    }

    return base;
  }, [isAdmin, chatUnread]);

  const isActive = (path) => {
    if (path === '/app' && location.pathname === '/app') return true;
    if (path !== '/app' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0D1B2A] text-white transition-transform duration-300 transform
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col shadow-xl
        `}
      >
        <div className="p-6 border-b border-gray-700 flex justify-between items-center shrink-0">
          <Link to="/" className="text-xl font-bold tracking-tight text-white flex flex-col leading-none">
            <span>Metafit</span>
            <span className="text-[0.6rem] text-blue-300 tracking-wider">CLIENT AREA</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                isActive(item.path)
                  ? 'bg-white text-[#0D1B2A]'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon size={18} />
              <span className="truncate">{item.label}</span>

              {item.badge > 0 ? (
                <span
                  className={`ml-auto inline-flex min-w-[22px] h-[22px] items-center justify-center rounded-full px-2 text-[11px] font-extrabold ${
                    isActive(item.path) ? 'bg-red-600 text-white' : 'bg-red-600 text-white'
                  }`}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700 shrink-0 bg-[#0D1B2A]">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-400/10 gap-3 text-sm"
            onClick={() => signOut()}
          >
            <LogOut size={18} />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 lg:hidden sticky top-0 z-30 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 hover:text-[#0D1B2A]">
            <Menu size={24} />
          </button>
          <span className="ml-4 font-bold text-[#0D1B2A]">Menú</span>

          <span
            className="ml-auto inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm"
            title={isAdmin ? 'Panel de control Metafit' : 'Client Area'}
          >
            {isAdmin ? 'Panel de control Metafit' : 'Client Area'}
          </span>
        </header>

        <main className="app-main flex-1 p-4 lg:p-8 overflow-y-auto bg-gray-50 text-slate-900">
          <div className="max-w-6xl mx-auto">
            {/* Etiqueta superior derecha (desktop) */}
            <div className="hidden lg:flex justify-end pb-4">
              <div
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm"
                title={isAdmin ? 'Panel de control Metafit' : 'Client Area'}
              >
                {isAdmin ? 'Panel de control Metafit' : 'Client Area'}
              </div>
            </div>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;