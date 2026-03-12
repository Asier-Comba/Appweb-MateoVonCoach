import React from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const SuccessStoriesPage = () => {
  const stories = [
    {
      id: 1,
      image: "https://horizons-cdn.hostinger.com/9468b3ae-6fb7-4252-88fd-6121cd9f331f/34610d657bd117f1d0fc6fd136d60fc9.jpg",
      name: "Juan P.",
      age: "28 años",
      objective: "Ganar masa muscular",
      result: "+8kg en 6 meses",
      testimonial: "Increíble el cambio. Nunca pensé que podría verme así de fuerte y definido al mismo tiempo. La dieta flexible me cambió la vida."
    },
    {
      id: 2,
      image: "https://horizons-cdn.hostinger.com/9468b3ae-6fb7-4252-88fd-6121cd9f331f/6c1a7449646c034f7794410c59e5e1d4.jpg",
      name: "Pedro S.",
      age: "32 años",
      objective: "Definición",
      result: "Abdominales visibles",
      testimonial: "Había intentado mil dietas y siempre rebotaba. Con Mateo aprendí a comer sin ansiedad y logré secarme como nunca."
    },
    {
      id: 3,
      image: "https://horizons-cdn.hostinger.com/9468b3ae-6fb7-4252-88fd-6121cd9f331f/419521e5ae4553d85cc05e3d10e45791.jpg",
      name: "Lucas M.",
      age: "25 años",
      objective: "Fuerza y Estética",
      result: "Récords personales",
      testimonial: "Ahora levanto pesos que antes ni soñaba y mi físico ha respondido acorde. El entrenamiento es duro pero muy efectivo."
    },
    {
      id: 4,
      image: "https://horizons-cdn.hostinger.com/9468b3ae-6fb7-4252-88fd-6121cd9f331f/621d7c8ef8ab4aec0e248e1d39f975c9.jpg",
      name: "Mateo R.",
      age: "30 años",
      objective: "Salud y postura",
      result: "Mejor postura y físico",
      testimonial: "Trabajo todo el día sentado y me dolía la espalda. El plan no solo mejoró mi estética, sino que eliminó mis dolores."
    },
    {
      id: 5,
      image: "https://horizons-cdn.hostinger.com/9468b3ae-6fb7-4252-88fd-6121cd9f331f/eb47c4070e74b6fcd51f449713bf7a85.jpg",
      name: "Diego F.",
      age: "35 años",
      objective: "Pérdida de grasa",
      result: "-10kg sostenibles",
      testimonial: "Lo mejor es que he aprendido a comer y a entrenar de forma eficiente. No paso horas en el gym y tengo mejores resultados."
    },
    {
      id: 6,
      image: "https://horizons-cdn.hostinger.com/9468b3ae-6fb7-4252-88fd-6121cd9f331f/e1a5a095c03a084e1839aaa8022a9acd.jpg",
      name: "Andrés G.",
      age: "29 años",
      objective: "Recomposición",
      result: "Más músculo, menos grasa",
      testimonial: "El seguimiento 1 a 1 marca la diferencia. Tener a alguien que ajuste el plan semana a semana es impagable."
    }
  ];

  return (
    <>
      <Helmet>
        <title>Casos de Éxito - Metafit Coaching</title>
        <meta name="description" content="Resultados reales de clientes reales. Transformaciones físicas con el método Metafit." />
      </Helmet>

      <div className="pt-24 lg:pt-32 pb-20 min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0D1B2A] mb-6">
              Casos de Éxito
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
               Hombres reales, resultados reales. Sin trucos, solo trabajo inteligente.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
             {stories.map((story) => (
                <div key={story.id} className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 flex flex-col h-full">
                   {/* Image Container with precise aspect ratio control */}
                   <div className="aspect-[3/4] overflow-hidden bg-gray-100 relative">
                      <img 
                         src={story.image} 
                         alt={`Transformación de ${story.name}`}
                         className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0D1B2A] via-[#0D1B2A]/70 to-transparent p-6 pt-16">
                         <h3 className="text-white font-bold text-xl">{story.name}</h3>
                         <p className="text-gray-300 text-sm">{story.age}</p>
                      </div>
                   </div>
                   
                   <div className="p-6 flex-1 flex flex-col bg-white">
                      <div className="space-y-3 mb-4">
                         <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Objetivo</p>
                            <p className="text-gray-900 font-medium">{story.objective}</p>
                         </div>
                         <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Resultado</p>
                            <p className="text-[#0D1B2A] font-bold text-lg">{story.result}</p>
                         </div>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-100 mt-auto">
                         <p className="text-gray-600 italic text-sm leading-relaxed">
                            "{story.testimonial}"
                         </p>
                      </div>
                   </div>
                </div>
             ))}
          </div>

          <div className="mt-16 text-center bg-[#0D1B2A] text-white p-12 rounded-2xl">
             <h2 className="text-2xl font-bold mb-4">¿Quieres ser el próximo caso de éxito?</h2>
             <p className="mb-8 text-gray-300">Agenda tu llamada y empecemos a trabajar en tu transformación.</p>
             <Button asChild size="lg" className="bg-white text-[#0D1B2A] hover:bg-gray-100 px-8 py-6 h-auto font-bold text-lg">
                <Link to="/agendar">EMPEZAR AHORA</Link>
             </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SuccessStoriesPage;