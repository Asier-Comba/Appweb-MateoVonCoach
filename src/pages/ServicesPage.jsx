import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

const ServicesPage = () => {
  const coachingIncludes = [
    'Plan de entrenamiento personalizado adaptado a tu disponibilidad',
    'Plan de nutrición flexible basado en tus preferencias y objetivos',
    'Acceso a la plataforma Metafit 24/7',
    'Seguimiento semanal de tu progreso',
    'Ajustes continuos según tus resultados',
    'Comunicación directa conmigo vía WhatsApp',
    'Biblioteca de vídeos de técnica de ejercicios',
    'Recursos educativos sobre entrenamiento y nutrición',
  ];

  const programsIncludes = [
    'Planes estructurados de 8-12 semanas',
    'Rutinas de entrenamiento detalladas',
    'Guías de nutrición paso a paso',
    'Seguimiento de progreso mediante plantillas',
    'Soporte vía email durante el plan',
  ];

  const futureServices = [
    'Planes de nutrición específicos (volumen, definición)',
    'Planes de entrenamiento para equipamiento limitado',
    'Masterclasses sobre técnicas avanzadas',
  ];

  return (
    <>
      <Helmet>
        <title>Servicios - Metafit Coaching</title>
        <meta
          name="description"
          content="Descubre los servicios de coaching 1:1 y planes estructurados de Metafit. Planes personalizados para hombres ocupados."
        />
      </Helmet>

      <div className="pt-16 lg:pt-20">
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl lg:text-5xl font-bold text-[#0D1B2A] mb-6">Servicios</h1>
              <p className="text-lg lg:text-xl text-gray-600">
                Soluciones diseñadas para hombres ocupados que quieren resultados reales.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-10 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="bg-[#0D1B2A] text-white p-8 lg:p-12 rounded-2xl shadow-xl mb-12 relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-3xl lg:text-4xl font-bold mb-4">Coaching 1:1 Online</h2>
                    <p className="text-lg text-gray-300 mb-8 max-w-2xl">
                    El servicio más completo y personalizado. Trabajamos juntos para conseguir tus
                    objetivos con un plan adaptado 100% a tu vida.
                    </p>
                    <span className="inline-block bg-white text-[#0D1B2A] px-6 py-2 rounded-full font-bold text-sm mb-8">
                    Servicio Premium
                    </span>
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-8">
                        {coachingIncludes.map((item, index) => (
                            <div key={index} className="flex items-start gap-3">
                            <CheckCircle2 className="text-green-400 flex-shrink-0 mt-1" size={20} />
                            <p className="text-gray-300 text-sm">{item}</p>
                            </div>
                        ))}
                    </div>

                    <Button
                        asChild
                        size="lg"
                        className="bg-white text-[#0D1B2A] hover:bg-gray-100 text-lg px-8 font-bold"
                    >
                        <Link to="/contacto">CONTACTO</Link>
                    </Button>
                </div>
                {/* Decorative blob */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600 rounded-full blur-3xl opacity-20"></div>
              </div>

              <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 mb-16">
                <h3 className="text-xl font-bold text-[#0D1B2A] mb-4">
                  ¿Para quién es el coaching 1:1?
                </h3>
                <p className="text-gray-700 mb-4">Este servicio es ideal para ti si:</p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-[#0D1B2A] rounded-full mt-2"></div>
                    <span>
                      Tienes un horario exigente y necesitas un plan que se adapte a tu realidad
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-[#0D1B2A] rounded-full mt-2"></div>
                    <span>Quieres seguimiento cercano y ajustes constantes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-[#0D1B2A] rounded-full mt-2"></div>
                    <span>Buscas una transformación real y duradera, no soluciones rápidas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-[#0D1B2A] rounded-full mt-2"></div>
                    <span>Valoras tener acceso directo a tu coach para resolver dudas</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-[#0D1B2A] mb-6">
                Planes estructurados
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl">
                Planes completos y autoguiados para objetivos específicos. Perfectos si prefieres
                más autonomía pero con un plan claro a seguir.
              </p>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
                <h3 className="text-2xl font-bold text-[#0D1B2A] mb-6">Qué incluyen</h3>
                <div className="space-y-4">
                  {programsIncludes.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="text-[#0D1B2A] flex-shrink-0 mt-1" size={20} />
                      <p className="text-gray-700">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center">
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-[#0D1B2A] text-[#0D1B2A] hover:bg-[#0D1B2A] hover:text-white text-lg px-8 transition-colors"
                >
                  <Link to="/programas">Ver planes disponibles</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-[#0D1B2A] mb-6">
                Próximamente
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Estoy trabajando en nuevos servicios y recursos para ayudarte aún más:
              </p>

              <div className="space-y-4 mb-12">
                {futureServices.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-[#0D1B2A] rounded-full flex-shrink-0" />
                    <p className="text-gray-700 font-medium">{item}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 bg-[#0D1B2A] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                ¿Listo para dar el siguiente paso?
              </h2>
              <p className="text-lg mb-8 text-gray-300">
                Aplica ahora y cuéntame tu situación. Veamos cómo puedo ayudarte.
              </p>
              <Button
                asChild
                size="lg"
                className="bg-white text-[#0D1B2A] hover:bg-gray-100 text-lg px-8 font-bold"
              >
                <Link to="/contacto">CONTACTO</Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default ServicesPage;