import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const location = useLocation();
  const { user } = useAuth();

  const clientAccessPath = useMemo(() => (user ? '/app' : '/login'), [user]);

  const navLinks = useMemo(
    () => [
      { name: 'Inicio', to: '/' },
      { name: 'Experiencia', to: '/#experiencia' },
      { name: 'Testimonios', to: '/#testimonios' },
    ],
    []
  );

  const isActive = (to) => {
    // Plain routes
    if (!to.includes('#')) return location.pathname === to;

    // Hash routes (only meaningful on home)
    const [path, hash] = to.split('#');
    const normalizedPath = path || '/';
    if (location.pathname !== normalizedPath) return false;
    return location.hash === `#${hash}`;
  };

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={[
        'fixed top-0 left-0 right-0 z-50',
        'border-b border-gray-200',
        'transition-all',
        isScrolled ? 'bg-white/95 backdrop-blur shadow-sm' : 'bg-white',
      ].join(' ')}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Navegación principal">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" aria-label="Ir a Inicio">
            <img
              className="h-8 w-8 lg:h-10 lg:w-10 rounded-full"
              alt="Metafit"
              src="https://horizons-cdn.hostinger.com/9468b3ae-6fb7-4252-88fd-6121cd9f331f/6ba4afe53b375c3e8c05a4669659b68e.png"
            />
            <div className="flex flex-col">
              <span className="text-xl lg:text-2xl font-bold text-[#0D1B2A] tracking-tight leading-none">Metafit</span>
              <span className="text-[0.65rem] lg:text-xs text-gray-500 font-medium tracking-wide leading-none">
                COACHING
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={[
                  'text-sm font-semibold transition-colors hover:text-[#0D1B2A]',
                  isActive(link.to) ? 'text-[#0D1B2A]' : 'text-gray-600',
                ].join(' ')}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Button asChild variant="outline" className="text-black border-gray-300">
              <Link to={clientAccessPath} className="flex items-center gap-2">
                <User size={18} />
                {user ? 'Ir a mi cuenta' : 'Acceso Clientes'}
              </Link>
            </Button>
            <Button asChild className="bg-[#0D1B2A] hover:bg-[#1a2f45] text-white">
              <Link to="/agendar">AGENDAR REUNIÓN</Link>
            </Button>
          </div>

          {/* Mobile button */}
          <div className="flex items-center gap-4 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-700 hover:text-[#0D1B2A] transition-colors"
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden bg-white border-t border-gray-200"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={[
                    'block py-2 text-base font-semibold transition-colors',
                    isActive(link.to) ? 'text-[#0D1B2A]' : 'text-gray-700',
                  ].join(' ')}
                >
                  {link.name}
                </Link>
              ))}

              <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                <Button asChild variant="outline" className="w-full justify-start text-black border-gray-300">
                  <Link to={clientAccessPath} onClick={() => setMobileMenuOpen(false)}>
                    <User size={18} className="mr-2" />
                    {user ? 'Ir a mi cuenta' : 'Acceso Clientes'}
                  </Link>
                </Button>

                <Button asChild className="w-full bg-[#0D1B2A] hover:bg-[#1a2f45] text-white">
                  <Link to="/agendar" onClick={() => setMobileMenuOpen(false)}>
                    AGENDAR REUNIÓN
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;