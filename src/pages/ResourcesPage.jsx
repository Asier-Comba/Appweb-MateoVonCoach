import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dumbbell, Apple, Brain } from 'lucide-react';

const ResourcesPage = () => {
  const trainingPrinciples = [
    'Progresión gradual: aumenta peso o repeticiones cada semana',
    'Técnica correcta antes que carga pesada',
    'Volumen adecuado: 10-20 series por grupo muscular a la semana',
    'Descanso entre series: 2-3 minutos para ejercicios principales',
    'Entrena cada grupo muscular 2 veces por semana',
  ];

  const nutritionPrinciples = [
    'Come suficiente proteína: 1.6-2g por kg de peso corporal',
    'No elimines grupos de alimentos, aprende a moderarlos',
    'Regla 80/20: come nutritivo el 80% del tiempo, disfruta el 20%',
    'Hidrátate bien: 2-3 litros de agua al día',
    'No necesitas ser perfecto, necesitas ser constante',
  ];

  const mindsetPrinciples = [
    'La transformación lleva tiempo, ten paciencia',
    'Pequeños pasos consistentes > grandes cambios temporales',
    'No esperes motivación, crea disciplina',
    'Los días malos son parte del proceso',
    'Enfócate en el progreso, no en la perfección',
  ];

  return (
    <>
      <Helmet>
        <title>Recursos - Metafit Coaching</title>
        <meta
          name="description"
          content="Recursos gratuitos sobre entrenamiento, nutrición y mentalidad para hombres que quieren mejorar su físico."
        />
      </Helmet>

      <div className="pt-16 lg:pt-20">
        <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl lg:text-5xl font-bold text-[#0D1B2A] mb-6">Recursos</h1>
              <p className="text-lg lg:text-xl text-gray-600">
                Principios fundamentales sobre entrenamiento, nutrición y mentalidad que realmente
                funcionan
              </p>
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
              <div className="flex items-center gap-3 mb-8">
                <Dumbbell className="text-[#0D1B2A]" size={32} />
                <h2 className="text-3xl lg:text-4xl font-bold text-[#0D1B2A]">Entrenamiento</h2>
              </div>

              <p className="text-lg text-gray-600 mb-8">
                No necesitas rutinas complicadas ni entrenar 2 horas diarias. Necesitas enfocarte
                en los principios básicos que generan resultados.
              </p>

              <div className="bg-gray-50 p-8 rounded-lg mb-8">
                <h3 className="text-xl font-bold text-[#0D1B2A] mb-6">
                  Principios clave del entrenamiento
                </h3>
                <div className="space-y-4">
                  {trainingPrinciples.map((principle, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-[#0D1B2A] rounded-full mt-2 flex-shrink-0" />
                      <p className="text-gray-700">{principle}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-8 rounded-lg">
                <h3 className="text-xl font-bold text-[#0D1B2A] mb-4">
                  Enfoque para hombres ocupados
                </h3>
                <p className="text-gray-700 mb-4">
                  Si solo tienes 3-4 horas a la semana, enfócate en:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-[#0D1B2A] mt-1">•</span>
                    <span>Ejercicios compuestos (sentadilla, press banca, peso muerto, dominadas)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#0D1B2A] mt-1">•</span>
                    <span>Entrenamientos de cuerpo completo o rutinas divididas eficientes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#0D1B2A] mt-1">•</span>
                    <span>Intensidad alta en lugar de volumen excesivo</span>
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
              <div className="flex items-center gap-3 mb-8">
                <Apple className="text-[#0D1B2A]" size={32} />
                <h2 className="text-3xl lg:text-4xl font-bold text-[#0D1B2A]">Nutrición</h2>
              </div>

              <p className="text-lg text-gray-600 mb-8">
                Olvida las dietas restrictivas. La nutrición debe ser algo que puedas mantener a
                largo plazo, no una tortura temporal.
              </p>

              <div className="bg-white p-8 rounded-lg mb-8">
                <h3 className="text-xl font-bold text-[#0D1B2A] mb-6">
                  Principios de nutrición flexible
                </h3>
                <div className="space-y-4">
                  {nutritionPrinciples.map((principle, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-[#0D1B2A] rounded-full mt-2 flex-shrink-0" />
                      <p className="text-gray-700">{principle}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-8 rounded-lg">
                <h3 className="text-xl font-bold text-[#0D1B2A] mb-4">La regla 80/20</h3>
                <p className="text-gray-700 mb-4">
                  Come alimentos nutritivos el 80% del tiempo: proteínas magras, verduras,
                  frutas, carbohidratos complejos, grasas saludables.
                </p>
                <p className="text-gray-700">
                  El otro 20% disfruta con flexibilidad: una comida social, un postre, lo que
                  quieras. Esto hace que la nutrición sea sostenible.
                </p>
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
              <div className="flex items-center gap-3 mb-8">
                <Brain className="text-[#0D1B2A]" size={32} />
                <h2 className="text-3xl lg:text-4xl font-bold text-[#0D1B2A]">
                  Mentalidad y hábitos
                </h2>
              </div>

              <p className="text-lg text-gray-600 mb-8">
                La transformación física empieza en la mente. Estos son los principios que marcan
                la diferencia entre quienes consiguen resultados y quienes abandonan.
              </p>

              <div className="bg-gray-50 p-8 rounded-lg mb-8">
                <h3 className="text-xl font-bold text-[#0D1B2A] mb-6">
                  Mentalidad para el éxito
                </h3>
                <div className="space-y-4">
                  {mindsetPrinciples.map((principle, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-[#0D1B2A] rounded-full mt-2 flex-shrink-0" />
                      <p className="text-gray-700">{principle}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-8 rounded-lg">
                <h3 className="text-xl font-bold text-[#0D1B2A] mb-4">Crea sistemas, no metas</h3>
                <p className="text-gray-700 mb-4">
                  En lugar de "quiero perder 10kg", enfócate en "voy a entrenar 3 veces por
                  semana y comer proteína en cada comida".
                </p>
                <p className="text-gray-700">
                  Los sistemas son lo que haces cada día. Las metas son el resultado de esos
                  sistemas.
                </p>
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
                Si quieres esto aplicado a tu caso, hablemos
              </h2>
              <p className="text-lg mb-8 text-gray-300">
                Estos principios funcionan, pero aplicarlos correctamente a tu situación
                específica marca toda la diferencia
              </p>
              <Button
                asChild
                size="lg"
                className="bg-white text-[#0D1B2A] hover:bg-gray-100 text-lg px-8"
              >
                <Link to="/contacto">Aplicar al coaching</Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default ResourcesPage;