import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Mail, CalendarDays, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Footer = () => {
  const TikTokIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-1.92-2.72V9.24a6.35 6.35 0 1 0 5.37 6.28V8.67a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );

  return (
    <footer className="bg-[#071421] text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* Top CTA */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-extrabold uppercase tracking-widest text-white/70">Área de clientes</p>
              <p className="mt-1 text-xl font-extrabold">Accedé a tu plan en un solo lugar</p>
              <p className="mt-2 text-sm text-white/70">
                Entrenamiento, nutrición, recursos y progreso. Todo ordenado, simple y exclusivo.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="h-11 rounded-xl bg-white text-slate-900 hover:bg-white/90">
              <Link to="/login">Acceso clientes</Link>
            </Button>
            <Button asChild className="h-11 rounded-xl bg-white text-slate-900 hover:bg-white/90">
              <Link to="/agendar" className="inline-flex items-center">
                <CalendarDays className="mr-2 h-4 w-4" />
                Agendar reunión
              </Link>
            </Button>
          </div>
        </div>

        {/* Columns */}
        <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-lg font-extrabold">Metafit</h3>
            <p className="mt-3 text-sm text-white/70 leading-relaxed">
              Coaching online para clientes que quieren resultados reales con un plan claro, seguimiento y una experiencia premium.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-white">Enlaces</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-white/70 hover:text-white transition-colors">Inicio</Link>
              </li>
              <li>
                <Link to="/agendar" className="text-white/70 hover:text-white transition-colors">Agendar reunión</Link>
              </li>
              <li>
                <Link to="/login" className="text-white/70 hover:text-white transition-colors">Acceso clientes</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-white">Contacto</h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a
                  href="mailto:vonwuthenaumateo@gmail.com"
                  className="hover:text-white transition-colors"
                >
                  vonwuthenaumateo@gmail.com
                </a>
              </li>
              <li className="text-xs text-white/50">
                Soporte: respondemos en horario laboral (España).
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-white">Sígueme</h3>
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/mateovon.coach?igsh=MXNxaGZzZ2Y1cTlqYw%3D%3D&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 p-3 rounded-full text-white hover:bg-white/20 transition-all hover:scale-105"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="http://www.tiktok.com/@m00n11k"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 p-3 rounded-full text-white hover:bg-white/20 transition-all hover:scale-105"
                aria-label="TikTok"
              >
                <TikTokIcon />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm text-white/60 flex flex-col items-center">
          <p className="mb-2">
            &copy; {new Date().getFullYear()} Metafit Coaching by Mateo von Wuthenau. Todos los derechos reservados.
          </p>
          <p className="text-white/40 text-xs">
            Esta página ha sido desarrollada por{' '}
            <a
              href="https://www.iazti.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              www.iazti.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;