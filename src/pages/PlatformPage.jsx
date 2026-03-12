import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dumbbell,
  Apple,
  TrendingUp,
  BookOpen,
  MessageSquare,
  Video,
  CheckCircle2,
  BarChart3,
  CalendarDays,
  ArrowRight,
  PlayCircle
} from 'lucide-react';

const PlatformPage = () => {
  const [activeTab, setActiveTab] = useState('entrenamiento');

  const exerciseList = [
      { name: 'Sentadilla', sets: 4, reps: '6-8', load: '100kg', rpe: 8 },
      { name: 'Press Banca', sets: 4, reps: '8-10', load: '80kg', rpe: 9 },
      { name: 'Remo con Barra', sets: 3, reps: '10-12', load: '70kg', rpe: 8 },
      { name: 'Press Militar', sets: 3, reps: '10-12', load: '50kg', rpe: 9 }
  ];

  return (
    <>
      <Helmet>
        <title>Plataforma - Metafit Coaching</title>
        <meta
          name="description"
          content="Descubre la plataforma Metafit: tu zona personal con entrenamiento, nutrición, progreso, recursos y comunicación directa."
        />
      </Helmet>

      <div className="pt-16 lg:pt-20">
        <section className="bg-[#0D1B2A] text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                        Tu Centro de Control
                    </h1>
                    <p className="text-xl text-gray-300 mb-8">
                        Olvídate de PDFs y Excels desordenados. Metafit te ofrece una experiencia digital completa para gestionar tu transformación.
                    </p>
                    <Button
                        asChild
                        size="lg"
                        className="bg-white text-[#0D1B2A] hover:bg-gray-100 px-8"
                    >
                        <Link to="/contacto">CONTACTO</Link>
                    </Button>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="relative"
                >
                   <div className="relative z-10 rounded-xl overflow-hidden shadow-2xl border border-gray-700">
                      <img 
                        src="https://horizons-cdn.hostinger.com/9468b3ae-6fb7-4252-88fd-6121cd9f331f/449bf081be5cfb72a7df9aa18f7f1745.jpg" 
                        alt="Plataforma Metafit" 
                        className="w-full h-auto"
                      />
                   </div>
                   {/* Decorative elements */}
                   <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
                   <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-purple-500 rounded-full blur-3xl opacity-20"></div>
                </motion.div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-center mb-12">
                <TabsList className="bg-gray-100 p-1 rounded-full overflow-x-auto flex-nowrap w-full max-w-4xl justify-start sm:justify-center overflow-y-hidden scrollbar-hide">
                  {[
                      { id: 'entrenamiento', label: 'Entrenamiento', icon: Dumbbell },
                      { id: 'nutricion', label: 'Nutrición', icon: Apple },
                      { id: 'progreso', label: 'Progreso', icon: TrendingUp },
                      { id: 'recursos', label: 'Recursos', icon: BookOpen },
                      { id: 'comunicacion', label: 'Chat', icon: MessageSquare },
                  ].map((tab) => (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="rounded-full px-6 py-3 text-sm font-medium data-[state=active]:bg-[#0D1B2A] data-[state=active]:text-white flex items-center gap-2 transition-all"
                      >
                        <tab.icon size={18} />
                        <span className="whitespace-nowrap">{tab.label}</span>
                      </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="min-h-[500px]">
                <AnimatePresence mode="wait">
                  <TabsContent value="entrenamiento" className="mt-0 outline-none">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="grid lg:grid-cols-3 gap-8"
                    >
                      {/* Left: Workout Plan */}
                      <div className="lg:col-span-2 space-y-6">
                         <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                            <div className="bg-[#0D1B2A] text-white p-6 flex justify-between items-center">
                               <div>
                                  <h3 className="text-xl font-bold">Día 1: Empuje (Pecho + Hombro)</h3>
                                  <p className="text-sm text-gray-300 mt-1">Semana 5 - Hipertrofia</p>
                               </div>
                               <CalendarDays size={24} className="text-gray-300" />
                            </div>
                            <div className="p-6">
                               <div className="space-y-4">
                                  {exerciseList.map((ex, i) => (
                                      <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                                          <div className="flex items-center gap-4">
                                              <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#0D1B2A] shadow-sm hover:text-blue-600 transition-colors">
                                                  <PlayCircle size={24} />
                                              </button>
                                              <div>
                                                  <h4 className="font-bold text-gray-900">{ex.name}</h4>
                                                  <p className="text-sm text-gray-500">{ex.sets} series x {ex.reps}</p>
                                              </div>
                                          </div>
                                          <div className="flex gap-4 text-sm">
                                              <div className="text-center hidden sm:block">
                                                  <p className="text-gray-400 text-xs">Carga</p>
                                                  <p className="font-bold text-gray-900">{ex.load}</p>
                                              </div>
                                              <div className="text-center hidden sm:block">
                                                  <p className="text-gray-400 text-xs">RPE</p>
                                                  <p className="font-bold text-gray-900">{ex.rpe}</p>
                                              </div>
                                              <div className="flex items-center">
                                                  <input type="checkbox" className="w-6 h-6 rounded border-gray-300 text-[#0D1B2A] focus:ring-[#0D1B2A]" />
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                               </div>
                            </div>
                         </div>
                      </div>

                      {/* Right: Stats */}
                      <div className="space-y-6">
                          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                              <h3 className="font-bold text-[#0D1B2A] mb-4 flex items-center gap-2">
                                  <BarChart3 size={20} />
                                  Progreso en Básicos
                              </h3>
                              <div className="space-y-6">
                                  {['Sentadilla', 'Press Banca', 'Peso Muerto'].map((lift, i) => (
                                      <div key={i}>
                                          <div className="flex justify-between text-sm mb-1">
                                              <span className="text-gray-600">{lift}</span>
                                              <span className="font-bold text-[#0D1B2A]">+5 kg este mes</span>
                                          </div>
                                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                              <div 
                                                className="h-full bg-[#0D1B2A] rounded-full" 
                                                style={{ width: `${60 + (i * 15)}%` }}
                                              ></div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                              <h4 className="font-bold text-[#0D1B2A] mb-2">Nota del Coach</h4>
                              <p className="text-sm text-gray-600">
                                  "Esta semana enfócate en controlar la excéntrica en la sentadilla. Baja en 3 segundos. ¡Vamos fuerte!"
                              </p>
                          </div>
                      </div>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="nutricion" className="mt-0 outline-none">
                     <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="grid lg:grid-cols-2 gap-8"
                    >
                       <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                          <h3 className="text-2xl font-bold text-[#0D1B2A] mb-6">Tu Plan Nutricional</h3>
                          
                          <div className="grid grid-cols-2 gap-4 mb-8">
                             <div className="bg-gray-50 p-4 rounded-lg text-center">
                                <p className="text-gray-500 text-sm mb-1">Calorías Diarias</p>
                                <p className="text-3xl font-bold text-[#0D1B2A]">2,600</p>
                             </div>
                             <div className="bg-gray-50 p-4 rounded-lg text-center">
                                <p className="text-gray-500 text-sm mb-1">Proteína</p>
                                <p className="text-3xl font-bold text-[#0D1B2A]">180g</p>
                             </div>
                          </div>

                          <div className="mb-8">
                             <h4 className="font-bold text-[#0D1B2A] mb-3">Enfoque 80/20</h4>
                             <div className="flex h-4 rounded-full overflow-hidden mb-2">
                                <div className="w-[80%] bg-green-500"></div>
                                <div className="w-[20%] bg-yellow-400"></div>
                             </div>
                             <div className="flex justify-between text-xs text-gray-500">
                                <span>80% Nutritivo (Base)</span>
                                <span>20% Flexible (Disfrute)</span>
                             </div>
                          </div>

                          <div className="space-y-3">
                             <h4 className="font-bold text-[#0D1B2A]">Ejemplos de comidas</h4>
                             {['Desayuno: Tortilla francesa + Fruta + Café', 'Almuerzo: Arroz con Pollo y Verduras', 'Cena: Pescado al horno con Patata'].map((meal, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                   <div className="w-2 h-2 bg-[#0D1B2A] rounded-full"></div>
                                   <span className="text-gray-700 text-sm">{meal}</span>
                                </div>
                             ))}
                          </div>
                       </div>

                       <div className="space-y-6">
                          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                             <h3 className="text-xl font-bold text-[#0D1B2A] mb-4">Checklist Diario</h3>
                             <div className="space-y-4">
                                {['Beber 3L de agua', 'Comer 3 raciones de fruta/verdura', 'Proteína en cada comida', 'Creatina (5g)'].map((item, i) => (
                                   <div key={i} className="flex items-center gap-3">
                                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${i < 2 ? 'bg-green-100 border-green-500 text-green-600' : 'border-gray-300'}`}>
                                         {i < 2 && <CheckCircle2 size={16} />}
                                      </div>
                                      <span className={i < 2 ? 'text-gray-900 line-through decoration-gray-400' : 'text-gray-700'}>{item}</span>
                                   </div>
                                ))}
                             </div>
                          </div>
                       </div>
                    </motion.div>
                  </TabsContent>

                   <TabsContent value="progreso" className="mt-0 outline-none">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                      >
                         <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                            <div className="flex justify-between items-center mb-6">
                               <h3 className="text-xl font-bold text-[#0D1B2A]">Evolución Corporal</h3>
                               <div className="flex gap-2">
                                  <span className="px-3 py-1 bg-[#0D1B2A] text-white text-xs rounded-full">Peso</span>
                                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Medidas</span>
                               </div>
                            </div>
                            {/* Simulated Graph Area */}
                            <div className="h-64 flex items-end justify-between gap-2 px-4 pb-4 border-b border-l border-gray-200">
                               {[78, 77.5, 77.2, 76.8, 76.5, 76.2, 75.8, 75.5].map((val, i) => (
                                  <div key={i} className="w-full bg-blue-50 rounded-t-sm relative group">
                                     <div 
                                        className="absolute bottom-0 w-full bg-[#0D1B2A] rounded-t-sm transition-all duration-500"
                                        style={{ height: `${(val - 70) * 10}%` }}
                                     ></div>
                                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        {val}kg
                                     </div>
                                  </div>
                               ))}
                            </div>
                            <div className="flex justify-between text-xs text-gray-400 mt-2 px-4">
                               <span>Semana 1</span>
                               <span>Semana 8</span>
                            </div>
                         </div>

                         <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                            <h3 className="text-xl font-bold text-[#0D1B2A] mb-6">Comparativa Visual</h3>
                            <div className="grid md:grid-cols-2 gap-8">
                               <div className="space-y-2">
                                  <p className="text-center font-bold text-gray-500">Inicio</p>
                                  <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                                     <span className="text-gray-400">Foto Frontal</span>
                                  </div>
                                  <p className="text-center text-sm text-gray-400">12 Ene 2024</p>
                               </div>
                               <div className="space-y-2">
                                  <p className="text-center font-bold text-[#0D1B2A]">Actual</p>
                                  <div className="aspect-[3/4] bg-gray-200 rounded-lg flex items-center justify-center border-2 border-[#0D1B2A]">
                                     <span className="text-gray-600">Foto Frontal</span>
                                  </div>
                                  <p className="text-center text-sm text-gray-600">Hoy</p>
                               </div>
                            </div>
                         </div>
                      </motion.div>
                   </TabsContent>

                   <TabsContent value="recursos" className="mt-0 outline-none">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid md:grid-cols-2 gap-6"
                      >
                         <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:border-[#0D1B2A] transition-colors cursor-pointer group">
                            <div className="flex items-start gap-4">
                               <div className="bg-red-50 p-3 rounded-lg text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                  <Video size={24} />
                               </div>
                               <div>
                                  <h4 className="font-bold text-[#0D1B2A] mb-1">Biblioteca de Ejercicios</h4>
                                  <p className="text-sm text-gray-600">Más de 100 vídeos explicando la técnica perfecta.</p>
                               </div>
                            </div>
                         </div>
                         <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:border-[#0D1B2A] transition-colors cursor-pointer group">
                            <div className="flex items-start gap-4">
                               <div className="bg-green-50 p-3 rounded-lg text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                  <BookOpen size={24} />
                               </div>
                               <div>
                                  <h4 className="font-bold text-[#0D1B2A] mb-1">Guías PDF</h4>
                                  <p className="text-sm text-gray-600">Manuales sobre nutrición, descanso y suplementación.</p>
                               </div>
                            </div>
                         </div>
                      </motion.div>
                   </TabsContent>

                   <TabsContent value="comunicacion" className="mt-0 outline-none">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
                      >
                         <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#0D1B2A] rounded-full flex items-center justify-center text-white font-bold">M</div>
                            <div>
                               <p className="font-bold text-[#0D1B2A]">Mateo Coach</p>
                               <p className="text-xs text-green-600 flex items-center gap-1">
                                  <span className="w-2 h-2 bg-green-500 rounded-full"></span> Online
                               </p>
                            </div>
                         </div>
                         <div className="h-[400px] bg-gray-50 p-6 overflow-y-auto space-y-4">
                            <div className="flex justify-end">
                               <div className="bg-[#0D1B2A] text-white p-3 rounded-2xl rounded-tr-none max-w-[80%]">
                                  <p>Hola Mateo, ¿puedo cambiar el arroz por patata en la cena?</p>
                               </div>
                            </div>
                            <div className="flex justify-start">
                               <div className="bg-white border border-gray-200 text-gray-800 p-3 rounded-2xl rounded-tl-none max-w-[80%] shadow-sm">
                                  <p>¡Claro! 200g de patata equivalen a tus 50g de arroz. Sin problema.</p>
                               </div>
                            </div>
                         </div>
                         <div className="p-4 border-t border-gray-100 bg-white flex gap-2">
                            <input 
                              type="text" 
                              placeholder="Escribe tu mensaje..." 
                              className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D1B2A]"
                            />
                            <button className="w-10 h-10 bg-[#0D1B2A] text-white rounded-full flex items-center justify-center hover:bg-[#1a2f45]">
                               <ArrowRight size={20} />
                            </button>
                         </div>
                      </motion.div>
                   </TabsContent>
                </AnimatePresence>
              </div>
            </Tabs>
          </div>
        </section>

        <section className="py-20 bg-gray-50">
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold text-[#0D1B2A] mb-6">
                 Esto es lo que te espera dentro
              </h2>
              <p className="text-gray-600 mb-8">
                 Una herramienta profesional diseñada para maximizar tus resultados y minimizar tus dudas.
              </p>
              <Button
                  asChild
                  size="lg"
                  className="bg-[#0D1B2A] hover:bg-[#1a2f45] text-white px-8"
              >
                  <Link to="/contacto">CONTACTO</Link>
              </Button>
           </div>
        </section>
      </div>
    </>
  );
};

export default PlatformPage;