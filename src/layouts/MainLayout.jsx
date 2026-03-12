import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { CalendarDays, Lock, ArrowRight } from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';

/**
 * MainLayout
 * - Public/marketing layout (outside /app)
 * - Adds: scroll-to-hash, scroll-to-top, and a persistent "Acceso Clientes" dock
 *   so clients can enter the app from anywhere on the site.
 */
const MainLayout = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const location = useLocation();

  /* Scroll progress + back-to-top (marketing only) */
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      const progress = scrollHeight > 0 ? Math.min(1, Math.max(0, scrollTop / scrollHeight)) : 0;
      setScrollProgress(progress);
      setShowTop(scrollTop > 600);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const { user } = useAuth();

  const clientAccessPath = useMemo(() => (user ? '/app' : '/login'), [user]);

  useEffect(() => {
    // Smooth scroll for hash links (e.g. /#testimonios)
    const hash = location.hash;
    if (hash) {
      const id = hash.replace('#', '');
      // Wait a tick for the DOM to paint after route changes
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }

    // Default: scroll to top
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [location.pathname, location.hash]);

  const hideDock = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[999] focus:left-4 focus:top-4 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-900 focus:shadow"
      >
        Saltar al contenido
      </a>

      <Header />

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-4 z-[70] hidden items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#0D1B2A] shadow-lg hover:bg-gray-50 md:flex"
        >
          ↑ Volver arriba
        </button>
      )}

      <Footer />

      {!hideDock && (
        <>
          {/* Desktop floating dock */}
          <div className="hidden md:block fixed bottom-6 right-6 z-50">
            <div className="w-[340px] rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-extrabold text-slate-900">Área de Clientes</div>
                    <div className="mt-1 text-xs text-slate-600">
                      Accedé en 1 clic a tu entrenamiento, nutrición, recursos y progreso.
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button asChild className="h-10 rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                    <Link to={clientAccessPath}>
                      Acceso clientes
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="h-10 rounded-xl text-slate-900 border-slate-300">
                    <Link to="/agendar">
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Agendar
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile bottom bar */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto max-w-7xl px-4 py-3 flex gap-2">
              <Button asChild className="flex-1 h-11 rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                <Link to={clientAccessPath}>
                  <Lock className="mr-2 h-4 w-4" />
                  Acceso clientes
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1 h-11 rounded-xl text-slate-900 border-slate-300">
                <Link to="/agendar">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Agendar
                </Link>
              </Button>
            </div>
          </div>

          {/* Spacer so mobile bottom bar doesn't cover last content */}
          <div className="md:hidden h-16" />
        </>
      )}
    </div>
  );
};

export default MainLayout;