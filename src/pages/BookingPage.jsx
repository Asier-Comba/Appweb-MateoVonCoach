import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, ExternalLink, Info, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const CALENDLY_URL = 'https://calendly.com/vonwuthenaumateo/30-minute-meeting';

const BookingPage = () => {
  const { user } = useAuth();

  return (
    <>
      <Helmet>
        <title>Agendar reunión - Metafit Coaching</title>
        <meta name="description" content="Agenda tu consultoría gratuita en Calendly." />
      </Helmet>

      <div className="pt-24 lg:pt-32 pb-20 min-h-screen bg-[#071421] text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-white/80">
              <Calendar className="h-4 w-4 text-cyan-200" />
              Consultoría gratuita
            </div>

            <h1 className="mt-6 text-3xl font-extrabold leading-tight sm:text-4xl">
              Agendá tu reunión con Mateo
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-white/70">
              Abrís Calendly, elegís día y hora, confirmás y listo. Si ya sos cliente, también podés entrar directo al Área de
              Clientes.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-white/10 border border-white/10 p-3">
                  <ExternalLink className="h-6 w-6 text-cyan-200" />
                </div>

                <div className="flex-1">
                  <p className="text-2xl font-extrabold">Abrir Calendly</p>
                  <p className="mt-2 text-sm text-white/70">
                    Se abre en una pestaña nueva. Elegís día y hora, confirmás, y listo.
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Button
                      asChild
                      size="lg"
                      className="h-11 rounded-xl px-8 font-extrabold bg-cyan-500 text-[#071421] hover:bg-cyan-400 w-full sm:w-auto"
                    >
                      <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                        AGENDAR AHORA
                      </a>
                    </Button>

                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="h-11 rounded-xl px-8 font-extrabold border-white/20 text-white hover:bg-white/10 w-full sm:w-auto"
                    >
                      <Link to={user ? '/app' : '/login'}>
                        <Lock className="mr-2 h-4 w-4" />
                        {user ? 'IR A MI CUENTA' : 'ACCESO CLIENTES'}
                      </Link>
                    </Button>
                  </div>

                  <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                        <Info className="h-5 w-5 text-white/80" />
                      </div>
                      <div className="text-sm text-white/70">
                        <p className="font-extrabold text-white">Tip rápido</p>
                        <p className="mt-1">
                          Elegí un horario donde puedas hablar 15–20 min sin distracciones. La claridad del plan empieza por aquí.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          

{/* What to expect */}
<div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
    <div className="flex items-center gap-2 text-white">
      <Info className="h-4 w-4" />
      <p className="font-semibold">Objetivo claro</p>
    </div>
    <p className="mt-2 text-sm text-white/70">
      Definimos tu punto de partida y el plan para las próximas semanas.
    </p>
  </div>
  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
    <div className="flex items-center gap-2 text-white">
      <Calendar className="h-4 w-4" />
      <p className="font-semibold">Acción inmediata</p>
    </div>
    <p className="mt-2 text-sm text-white/70">
      Te vas con próximos pasos concretos para arrancar sin dudas.
    </p>
  </div>
  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
    <div className="flex items-center gap-2 text-white">
      <Lock className="h-4 w-4" />
      <p className="font-semibold">Área de Clientes</p>
    </div>
    <p className="mt-2 text-sm text-white/70">
      Si ya sos cliente, tu seguimiento principal está en el Área de Clientes.
    </p>
  </div>
</div>

{/* FAQ */}
<div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6">
  <h2 className="text-lg font-extrabold text-white">Preguntas frecuentes</h2>
  <div className="mt-5 grid gap-6 sm:grid-cols-2">
    <div>
      <p className="text-sm font-semibold text-white">¿Qué necesito para la reunión?</p>
      <p className="mt-2 text-sm text-white/70">
        Traé tu objetivo y, si querés, datos básicos (peso aproximado, nivel, lesiones). Con eso alcanza.
      </p>
    </div>
    <div>
      <p className="text-sm font-semibold text-white">¿Cómo sigo después?</p>
      <p className="mt-2 text-sm text-white/70">
        Si avanzamos, tendrás tu plan y recursos cargados en el Área de Clientes para verlo todo en un solo lugar.
      </p>
    </div>
  </div>
  <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <p className="text-xs text-white/60">
      Recomendación: agendá con 24–48h de anticipación para asegurar un horario cómodo.
    </p>
    <Button asChild className="h-10 rounded-xl bg-white text-slate-900 hover:bg-white/90">
      <Link to="/login">Acceso clientes</Link>
    </Button>
  </div>
</div>

          <div className="mt-10 text-center text-xs text-white/50">
            Al agendar, aceptás recibir el link de la reunión y recordatorios. Si ya sos cliente, el soporte principal es dentro del
            Área de Clientes.
          </div>
        </div>
      </div>
    </>
  );
};

export default BookingPage;