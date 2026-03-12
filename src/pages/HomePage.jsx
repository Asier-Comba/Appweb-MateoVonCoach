import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Play,
  ChevronDown,
  Calendar,
  ExternalLink,
  Sparkles,
  Dumbbell,
  Apple,
  Folder,
  MessageCircle,
  LineChart
} from 'lucide-react';

const CALENDLY_URL = 'https://calendly.com/vonwuthenaumateo/new-meeting';
const CLIENT_ACCESS_PATH = '/login';

// ✅ Video servido desde /public (NO import directo - evita errores de build)
const LOCAL_HERO_MP4_PATH = '/v14044g50000d5dd1c7og65kmql16tsg.mp4';

// IDs de videos en Drive
const DRIVE_NICO_ID = '1OJRuGLm8LDsg9pT7wn_VlAnxqHWxevNG';
const DRIVE_NARO_ID = '1M0_Ts_fpRb5Try3JdrHWP5lQjZ2QNe2U';
const DRIVE_NACA_ID = '1I2iO_9XNdWYJYKjAQ8QlBjLZN67evwa8';

// Drive preview (reproduce mejor que /view en muchos casos)
const drivePreview = (id) => `https://drive.google.com/file/d/${id}/preview`;
// Extrae el ID desde un enlace compartido de Google Drive o desde un ID puro
const extractDriveId = (input = '') => {
  const raw = String(input || '').trim();
  if (!raw) return '';

  // Si ya parece un ID (Drive IDs suelen ser largos y alfanuméricos con -/_)
  if (/^[a-zA-Z0-9_-]{10,}$/.test(raw) && !raw.includes('http')) return raw;

  // file/d/<id>/...
  const m1 = raw.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m1?.[1]) return m1[1];

  // open?id=<id>
  const m2 = raw.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2?.[1]) return m2[1];

  return '';
};

const driveView = (id) => `https://drive.google.com/file/d/${id}/view`;
const driveDownload = (id) => `https://drive.google.com/uc?export=download&id=${id}`;

const HomePage = () => {
  // Si querés video en el HERO, pegá aquí un embed (YouTube/Vimeo). Si no, dejalo vacío.
  // Video de presentación (Mateo) — pega aquí el enlace compartido de Google Drive (o el ID).
  // Ejemplos válidos:
  //  - https://drive.google.com/file/d/<ID>/view?usp=sharing
  //  - https://drive.google.com/open?id=<ID>
  //  - <ID>
  const MATEO_INTRO_DRIVE_SHARE_URL = 'https://drive.google.com/file/d/1XIiulWI2NPBSNByP1NQGRVRSTZxNMzom/view?usp=drive_link';
  const heroVideo = useMemo(() => {
    const id = extractDriveId(MATEO_INTRO_DRIVE_SHARE_URL);
    if (!id) return null;
    return {
      id,
      previewUrl: drivePreview(id),
      downloadUrl: driveDownload(id),
      viewUrl: driveView(id),
    };
  }, []);

  const [useIframeFallback, setUseIframeFallback] = useState(false);

  // TESTIMONIOS: 3 en total (sin embed, solo botón para abrir)
  const testimonials = useMemo(
    () => [
      {
        name: 'NICO',
        openUrl: drivePreview(DRIVE_NICO_ID),
        highlights: ['-7 kg en 60 días', 'Padre de 3 hijos'],
      },
      {
        name: 'NARO',
        openUrl: drivePreview(DRIVE_NARO_ID),
        highlights: ['Cambio físico'],
      },
      {
        name: 'NACA',
        openUrl: drivePreview(DRIVE_NACA_ID),
        highlights: ['Recomposición corporal'],
      },
    ],
    []
  );

  const faqs = useMemo(
    () => [
      {
        q: '¿Quién puede crear una cuenta?',
        a: 'El Área de Clientes es exclusiva. Solo se puede crear cuenta con el código de acceso que Mateo comparte con sus clientes.',
      },
      {
        q: '¿Cada cuánto actualiza Mateo mi plan?',
        a: 'Depende del programa y tu semana, pero siempre tendrás un plan claro y feedback en el chat. La prioridad es que sepas exactamente qué hacer.',
      },
      {
        q: '¿Puedo ver mi progreso?',
        a: 'Sí. Tenés una página de progreso con gráficos y registros. Recomendación: 1–2 registros semanales para ver tendencia real.',
      },
      {
        q: '¿Cómo envío dudas o archivos?',
        a: 'Desde el chat con Mateo. Podés enviar mensajes y adjuntos. Mateo te responde dentro del flujo del plan.',
      },
      {
        q: '¿Qué pasa si me pierdo una semana?',
        a: 'No pasa nada. Ajustamos y continuamos. Lo importante es sostener hábitos y ejecución; el plan se adapta.',
      },
      {
        q: '¿Es un plan genérico?',
        a: 'No. Todo se carga por cliente (rutina por días, menú semanal y recursos). Tu área es tu plan, no un PDF suelto.',
      },
    ],
    []
  );

  return (
    <>
      <Helmet>
        <title>Metafit Coaching by Mateo von Wuthenau</title>
        <meta
          name="description"
          content="Coaching online para hombres ocupados. Bajá grasa, ganá músculo y ordená tus hábitos sin vivir en el gimnasio."
        />
      </Helmet>

      <div className="pt-16 lg:pt-20 overflow-x-hidden">
        {/* HERO */}
        <section className="relative overflow-hidden bg-[#071421] text-white">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-blue-500/15 blur-3xl" />
            <div className="absolute -bottom-56 left-1/2 h-[680px] w-[680px] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0b2740] via-[#071421] to-[#071421]" />
          </div>

          <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="py-16 lg:py-24 text-center">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold tracking-wider"
              >
                <span className="text-blue-200">HOMBRES +25</span>
                <span className="text-white/40">•</span>
                <span className="text-white/80">COACHING ONLINE</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.05 }}
                className="mt-6 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl"
              >
                Bajá grasa, tonificá y recuperá tu energía
                <span className="block text-white/80">en 90 días con solo 3 horas por semana.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg"
              >
                Mirá el video para entender cómo trabajamos y si esto es para vos.
              </motion.p>

              {/* Video HERO */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="mx-auto mt-10 w-full max-w-[420px] sm:max-w-[520px]"
              >
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-2xl">
                  <div className="relative aspect-[9/16] w-full bg-black">
                    {heroVideo ? (
                      <>
                        {!useIframeFallback ? (
                          <video
                            className="absolute inset-0 h-full w-full object-cover"
                            controls
                            playsInline
                            preload="metadata"
                            onError={() => setUseIframeFallback(true)}
                          >
                            {/* ✅ Usa el path público en lugar de import directo */}
                            <source src={LOCAL_HERO_MP4_PATH} type="video/mp4" />
                          </video>
                        ) : (
                          <iframe
                            className="absolute inset-0 h-full w-full"
                            src={heroVideo.previewUrl}
                            title="Video presentación"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        )}

                        <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-black/20 px-4 py-3">
                          <p className="text-xs text-white/70">
                            Si el reproductor no carga, se abrirá el modo alternativo automáticamente.
                          </p>
                          <a
                            href={heroVideo.viewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/15"
                          >
                            Ver en Drive <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-black/30">
                        <div className="flex flex-col items-center gap-3 px-6 text-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                            <Play className="h-7 w-7 text-white" />
                          </div>
                          <p className="text-sm font-extrabold text-white/95">Video de presentación</p>
                          <p className="text-xs text-white/60">
                            Próximamente. (Cuando tengas el enlace de Drive listo, pégalo en el código.)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              <div className="mt-10 flex flex-col items-center gap-4">
                <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:max-w-none sm:w-auto">
                  <Button
                    asChild
                    size="lg"
                    className="h-auto w-full sm:w-auto rounded-xl bg-white px-8 py-6 text-base font-extrabold text-[#071421] hover:bg-gray-100"
                  >
                    <a href="#agendar">AGENDAR CONSULTORÍA</a>
                  </Button>

                  <Button
                    asChild
                    size="lg"
                    className="h-auto w-full sm:w-auto rounded-xl bg-cyan-400 px-8 py-6 text-base font-extrabold text-[#071421] hover:bg-cyan-300"
                  >
                    <Link to={CLIENT_ACCESS_PATH}>
                      <span className="inline-flex items-center gap-2">
                        <ExternalLink className="h-5 w-5" />
                        ACCESO CLIENTES
                      </span>
                    </Link>
                  </Button>
                </div>

                <a
                  href="#testimonios"
                  className="group inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white"
                >
                  <span>Ver testimonios</span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 transition group-hover:bg-white/10">
                    <ChevronDown className="h-5 w-5" />
                  </span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* EXPERIENCIA METAFIT */}
        <section id="experiencia" className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-gray-700">
                <Sparkles className="h-4 w-4 text-blue-600" />
                Experiencia Metafit
              </p>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Un área exclusiva para clientes, simple y potente
              </h2>
              <p className="mt-4 text-base text-gray-700">
                Entrenamiento, nutrición, recursos y progreso en un solo lugar. Diseñado para que el plan sea claro, y la ejecución
                sea fácil.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: 'Rutinas por día',
                  desc: 'Rutina semanal por días con ejercicios, series y repeticiones. Video opcional.',
                  Icon: Dumbbell,
                },
                {
                  title: 'Menú semanal',
                  desc: 'Plantilla por día: desayuno, comida, cena y snack. Todo manual por el coach.',
                  Icon: Apple,
                },
                {
                  title: 'Recursos exclusivos',
                  desc: 'PDFs, guías y material de apoyo global o por cliente.',
                  Icon: Folder,
                },
                {
                  title: 'Chat 1:1',
                  desc: 'Comunicación directa con el coach, con adjuntos y mensajes claros.',
                  Icon: MessageCircle,
                },
                {
                  title: 'Progreso con gráficos',
                  desc: 'Registro de peso y medidas con visualización clara por fecha.',
                  Icon: LineChart,
                },
                {
                  title: 'Feedback constante',
                  desc: 'Notas del coach y ajustes del plan cuando se necesita.',
                  Icon: CheckCircle2,
                },
              ].map(({ title, desc, Icon }) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.35 }}
                  className="group rounded-2xl border border-gray-200 bg-white p-7 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 border border-blue-100">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-base font-extrabold text-gray-900">{title}</p>
                      <p className="mt-2 text-sm text-gray-700">{desc}</p>
                    </div>
                  </div>
                  <div className="mt-5 h-1 w-0 rounded-full bg-blue-600 transition-all duration-300 group-hover:w-16" />
                </motion.div>
              ))}
            </div>

            <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-auto w-full sm:w-auto rounded-xl bg-[#0D1B2A] px-8 py-6 text-base font-extrabold text-white hover:bg-[#10263d]"
              >
                <Link to={CLIENT_ACCESS_PATH}>ACCESO CLIENTES</Link>
              </Button>

              <Button
                asChild
                size="lg"
                className="h-auto w-full sm:w-auto rounded-xl border border-gray-300 bg-white px-8 py-6 text-base font-extrabold text-[#0D1B2A] hover:bg-gray-50"
              >
                <a href="#agendar">AGENDAR CONSULTORÍA</a>
              </Button>
            </div>
          </div>
        </section>

        {/* VISTA PREVIA CLIENT AREA */}
        <section id="area-clientes" className="bg-gray-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-gray-700 shadow-sm">
                <Folder className="h-4 w-4 text-blue-600" />
                Tu plan, sin ruido
              </p>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Todo lo importante en un solo lugar
              </h2>
              <p className="mt-4 text-base text-gray-700">
                La experiencia está diseñada para que ejecutes sin dudas: rutina por días, menú semanal manual, recursos descargables,
                chat directo y progreso visual.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {[
                {
                  icon: <Dumbbell className="h-5 w-5 text-white" />,
                  title: 'Entrenamiento por días',
                  desc: 'Rutinas claras (series/reps + vídeo opcional) para saber qué toca hoy sin pensar de más.',
                },
                {
                  icon: <Apple className="h-5 w-5 text-white" />,
                  title: 'Menú semanal manual',
                  desc: 'Mateo carga tu menú día por día. Vos solo seguís el plan, con cantidades y notas.',
                },
                {
                  icon: <MessageCircle className="h-5 w-5 text-white" />,
                  title: 'Chat directo',
                  desc: 'Preguntás, enviás adjuntos y recibís feedback dentro del contexto de tu plan.',
                },
                {
                  icon: <Folder className="h-5 w-5 text-white" />,
                  title: 'Recursos',
                  desc: 'PDFs, guías y materiales. Globales o asignados a vos, siempre disponibles.',
                },
                {
                  icon: <LineChart className="h-5 w-5 text-white" />,
                  title: 'Progreso',
                  desc: 'Gráficos profesionales para ver tendencia (peso y media de medidas) con límites por día.',
                },
                {
                  icon: <CheckCircle2 className="h-5 w-5 text-white" />,
                  title: 'Experiencia premium',
                  desc: 'Menos fricción, más ejecución. Diseño limpio para que se use con gusto.',
                },
              ].map((item) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0D1B2A]">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-extrabold text-gray-900">{item.title}</p>
                      <p className="mt-2 text-sm text-gray-700">{item.desc}</p>
                    </div>
                  </div>

                  <div className="mt-5 h-1 w-0 rounded-full bg-blue-600 transition-all duration-300 group-hover:w-16" />
                </motion.div>
              ))}
            </div>

            <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-auto w-full sm:w-auto rounded-xl bg-[#0D1B2A] px-8 py-6 text-base font-extrabold text-white hover:bg-[#10263d]">
                <Link to={CLIENT_ACCESS_PATH}>ACCESO CLIENTES</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-auto w-full sm:w-auto rounded-xl border-gray-300 px-8 py-6 text-base font-extrabold text-gray-900 hover:bg-white">
                <Link to="/agendar">
                  <Calendar className="mr-2 h-4 w-4" />
                  Agendar reunión
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ROADMAP */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-gray-700">
                <Sparkles className="h-4 w-4 text-blue-600" />
                Primeros pasos
              </p>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Empezá con claridad en 10 minutos
              </h2>
              <p className="mt-4 text-base text-gray-700">
                El objetivo es que entres, entiendas tu plan y ejecutes. Sin PDFs perdidos, sin confusión.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-4">
              {[
                { n: '01', t: 'Acceso al área', d: 'Entrás con tu cuenta y tenés todo centralizado.' },
                { n: '02', t: 'Rutina por días', d: 'Tu semana de entrenamiento queda clara desde el minuto 1.' },
                { n: '03', t: 'Menú semanal', d: 'Mateo carga el plan manualmente y vos lo seguís sin dudas.' },
                { n: '04', t: 'Progreso', d: 'Registrás 1–2 veces por semana para ver tendencia real.' },
              ].map((s) => (
                <motion.div
                  key={s.n}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35 }}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <p className="text-xs font-extrabold tracking-widest text-blue-700">{s.n}</p>
                  <p className="mt-2 text-lg font-extrabold text-gray-900">{s.t}</p>
                  <p className="mt-2 text-sm text-gray-700">{s.d}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIOS */}
        <section id="testimonios" className="bg-[#1b7fb3] py-20 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center rounded-md bg-[#203a9b] px-4 py-2 text-lg font-extrabold uppercase tracking-wider">
                Algunos testimonios
              </div>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t, idx) => (
                <div key={idx} className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
                  {t.name ? <div className="mb-4 text-center text-2xl font-extrabold">{t.name}</div> : null}

                  <div className="overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-white/10 to-black/20 shadow-xl">
                    {/* Altura fija responsive (en vez de aspect-video) */}
                    <div className="h-[240px] sm:h-[260px] lg:h-[280px]">
                      <div className="flex h-full w-full items-center justify-center px-6 py-7">
                        <div className="flex w-full max-w-md flex-col items-center text-center">
                          <div className="relative">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
                              <Play className="h-8 w-8 text-white" />
                            </div>
                            <div className="pointer-events-none absolute -inset-3 rounded-3xl bg-cyan-300/10 blur-xl" />
                          </div>

                          {t.highlights?.length ? (
                            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                              {t.highlights.map((h) => (
                                <span
                                  key={h}
                                  className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-extrabold tracking-wide text-white/95"
                                >
                                  {h}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-4">
                              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-extrabold tracking-wide text-white/80">
                                Testimonio en video
                              </span>
                            </div>
                          )}

                          <Button
                            asChild
                            size="lg"
                            className="mt-5 h-auto w-full rounded-xl px-6 py-4 text-sm sm:text-base font-extrabold text-[#071421]
                                       bg-gradient-to-r from-cyan-300 via-white to-white
                                       hover:from-cyan-200 hover:via-white hover:to-white
                                       shadow-lg shadow-black/25 transition"
                          >
                            <a href={t.openUrl} target="_blank" rel="noopener noreferrer">
                              <span className="inline-flex items-center justify-center gap-2">
                                <ExternalLink className="h-5 w-5" />
                                ABRIR VIDEO
                              </span>
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="bg-gray-50 py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-gray-700 shadow-sm">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                Preguntas frecuentes
              </p>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Respuestas rápidas, cero dudas
              </h2>
              <p className="mt-4 text-base text-gray-700">
                Si sos cliente, el Área es tu centro de trabajo. Si todavía no lo sos, agendá y vemos si encaja con vos.
              </p>
            </div>

            <div className="mt-10 space-y-3">
              {faqs.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                    <span className="text-base font-extrabold text-gray-900">{item.q}</span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 border border-gray-200">
                      <ChevronDown className="h-5 w-5 text-gray-900 transition-transform group-open:rotate-180" />
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-gray-700 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-auto w-full sm:w-auto rounded-xl bg-[#0D1B2A] px-8 py-6 text-base font-extrabold text-white hover:bg-[#10263d]">
                <Link to={CLIENT_ACCESS_PATH}>ACCESO CLIENTES</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-auto w-full sm:w-auto rounded-xl border-gray-300 px-8 py-6 text-base font-extrabold text-gray-900 hover:bg-white">
                <Link to="/agendar">
                  <Calendar className="mr-2 h-4 w-4" />
                  Agendar reunión
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="agendar" className="bg-[#071421] py-20 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-white">
                <Calendar className="h-4 w-4 text-cyan-200" />
                Agenda tu sesión de consultoría gratuita
              </div>
              <h2 className="mt-6 text-3xl font-extrabold sm:text-4xl">Elegí un día y hora</h2>
              <p className="mt-4 text-lg text-white/75">
                En Horizons el embebido puede bloquearse por seguridad. Así que lo hacemos simple: abrís Calendly y reservás.
              </p>
            </div>

            <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm">
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="inline-flex items-center justify-center rounded-2xl bg-white/10 p-4 border border-white/10">
                  <ExternalLink className="h-6 w-6 text-cyan-200" />
                </div>

                <div>
                  <p className="text-2xl font-extrabold">Consultoría (30 min)</p>
                  <p className="mt-2 text-sm text-white/70">Se abre en una pestaña nueva. Reservás rápido y listo.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                  <Button
                    asChild
                    size="lg"
                    className="h-auto w-full sm:w-auto rounded-xl px-8 py-6 text-base font-extrabold bg-cyan-500 text-[#071421] hover:bg-cyan-400"
                  >
                    <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                      ABRIR CALENDLY
                    </a>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    className="h-auto w-full sm:w-auto rounded-xl border border-white/15 bg-transparent px-6 py-4 text-sm sm:text-base font-extrabold text-white hover:bg-white/10"
                  >
                    <Link to={CLIENT_ACCESS_PATH}>
                      <span className="inline-flex items-center justify-center gap-2">
                        <ExternalLink className="h-5 w-5" />
                        ACCESO CLIENTES
                      </span>
                    </Link>
                  </Button>

                </div>

                <p className="text-xs text-white/60">
                  Si estás dentro del navegador de Instagram/TikTok, tocá "Abrir en Safari/Chrome" para evitar bloqueos raros.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFICIOS */}
        <section className="bg-gray-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-extrabold text-[#0D1B2A] sm:text-4xl">¿Qué cambia cuando lo hacés bien?</h2>
              <p className="mt-4 text-lg text-gray-600">Menos ruido, más resultados.</p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                'Plan de entrenamiento eficiente',
                'Nutrición flexible',
                'Seguimiento real con ajustes',
                'Hábitos sostenibles',
                'Más energía y mejor descanso',
                'Estrategia clara',
              ].map((b) => (
                <div key={b} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                    <p className="text-sm font-semibold text-gray-800">{b}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-auto w-full sm:w-auto rounded-xl bg-[#0D1B2A] px-8 py-6 text-base font-extrabold text-white hover:bg-[#10263d]"
              >
                <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                  QUIERO AGENDAR
                </a>
              </Button>

              <Button
                asChild
                size="lg"
                className="h-auto w-full sm:w-auto rounded-xl border border-gray-300 bg-white px-8 py-6 text-base font-extrabold text-[#0D1B2A] hover:bg-gray-50"
              >
                <Link to={CLIENT_ACCESS_PATH}>
                  ACCESO CLIENTES
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Acceso a clientes siempre visible */}
        <div className="fixed bottom-4 right-4 z-40 hidden md:block">
          <Button
            asChild
            className="rounded-full bg-[#0D1B2A] px-5 py-5 text-white shadow-lg hover:bg-[#10263d]"
          >
            <Link to={CLIENT_ACCESS_PATH}>
              <span className="inline-flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Acceso Clientes
              </span>
            </Link>
          </Button>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-gray-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
            <Button asChild className="flex-1 rounded-xl bg-[#0D1B2A] text-white hover:bg-[#10263d]">
              <Link to={CLIENT_ACCESS_PATH}>Acceso Clientes</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 rounded-xl border-gray-300 bg-white text-[#0D1B2A] hover:bg-gray-50">
              <a href="#agendar">Agendar</a>
            </Button>
          </div>
        </div>

      </div>
    </>
  );
};

export default HomePage;