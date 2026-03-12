import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, Target, TrendingUp, Zap, Crown, User } from 'lucide-react';

const ProgramsPage = () => {
  const programs = [
    {
      title: 'Plan Principiantes',
      description: 'Empieza desde cero con las bases correctas de entrenamiento y nutrición.',
      duration: '8 semanas',
      level: 'Principiante',
      icon: User,
      highlight: false,
      includes: [
        'Rutina de 3 días por semana',
        'Guía básica de nutrición',
        'Vídeos de técnica',
        'Plan de progresión gradual',
      ],
    },
    {
      title: 'Plan Transformación 90 días',
      description: 'El plan más completo para conseguir un cambio físico visible en 3 meses.',
      duration: '90 días',
      level: 'Intermedio',
      icon: Zap,
      highlight: false,
      includes: [
        'Plan progresivo de 12 semanas',
        'Guía de nutrición flexible',
        'Seguimiento semanal',
        'Acceso a plataforma Metafit',
      ],
    },
    {
      title: 'Plan Premium 1 a 1',
      description: 'Máxima personalización y contacto directo. Tu éxito es mi prioridad.',
      duration: 'Mensual',
      level: 'Todos los niveles',
      icon: Crown,
      highlight: true,
      includes: [
        'Rutina 100% personalizada',
        'Nutrición a medida',
        'Chat directo WhatsApp 24/7',
        'Videollamadas de revisión',
        'Análisis de técnica en video',
      ],
    },
     {
      title: 'Rutinas para viajes',
      description: 'Entrena donde sea con poco o ningún equipo. Sin excusas.',
      duration: 'Flexible',
      level: 'Todos los niveles',
      icon: Clock,
      highlight: false,
      includes: [
        'Rutinas de 30-45 minutos',
        'Con peso corporal o bandas',
        'Para hotel o casa',
        'Guía de mantenimiento',
      ],
    },
  ];

  return (
    <>
      <Helmet>
        <title>Planes - Metafit Coaching</title>
        <meta
          name="description"
          content="Elige el plan Metafit perfecto para ti: Transformación, Principiantes o Premium 1 a 1."
        />
      </Helmet>

      <div className="pt-16 lg:pt-20">
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl lg:text-5xl font-bold text-[#0D1B2A] mb-6">
                Planes Metafit
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Estructura, ciencia y experiencia. Elige la opción que mejor se adapte a tus objetivos actuales.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="pb-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {programs.map((program, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex flex-col h-full rounded-2xl overflow-hidden border transition-all hover:shadow-xl ${
                    program.highlight 
                      ? 'bg-[#0D1B2A] border-[#0D1B2A] text-white transform lg:-translate-y-4 shadow-2xl relative z-10' 
                      : 'bg-white border-gray-100 text-[#0D1B2A] hover:border-gray-300'
                  }`}
                >
                  {program.highlight && (
                    <div className="bg-yellow-400 text-[#0D1B2A] text-xs font-bold text-center py-2 uppercase tracking-wide">
                      Más Popular
                    </div>
                  )}
                  <div className="p-8 flex-1 flex flex-col">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-6 ${program.highlight ? 'bg-white/10 text-white' : 'bg-gray-100 text-[#0D1B2A]'}`}>
                        <program.icon size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{program.title}</h3>
                    <p className={`text-sm mb-6 ${program.highlight ? 'text-gray-300' : 'text-gray-600'}`}>
                        {program.description}
                    </p>

                    <div className="mt-auto space-y-4">
                        <div className="space-y-3 mb-8">
                            {program.includes.map((item, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className={`flex-shrink-0 mt-0.5 ${program.highlight ? 'text-green-400' : 'text-[#0D1B2A]'}`} />
                                    <span className={`text-sm ${program.highlight ? 'text-gray-300' : 'text-gray-600'}`}>{item}</span>
                                </div>
                            ))}
                        </div>
                        
                        <Button
                            asChild
                            className={`w-full ${program.highlight ? 'bg-white text-[#0D1B2A] hover:bg-gray-100' : 'bg-[#0D1B2A] text-white hover:bg-[#1a2f45]'}`}
                        >
                            <Link to="/contacto">CONTACTO</Link>
                        </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
             <h2 className="text-3xl font-bold text-[#0D1B2A] mb-6">¿Dudas?</h2>
             <p className="text-gray-600 mb-8">
                Si no estás seguro de qué plan es el mejor para ti, escríbeme y lo vemos juntos.
             </p>
             <Button
                asChild
                variant="outline"
                size="lg"
                className="border-[#0D1B2A] text-[#0D1B2A] hover:bg-white"
            >
                <Link to="/contacto">Hablar con Mateo</Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
};

export default ProgramsPage;