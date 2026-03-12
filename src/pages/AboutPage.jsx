import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';
const AboutPage = () => {
  const beliefs = ['En entrenamientos cortos pero intensos y efectivos', 'En una nutrición flexible que se adapte a tu vida real', 'En la constancia por encima de la perfección', 'En el progreso gradual y sostenible'];
  const thisIsNot = ['Dietas restrictivas que no puedes mantener', 'Rutinas de 2 horas diarias en el gimnasio', 'Promesas de transformaciones milagro en 30 días', 'Un método genérico que sirve para todos'];
  const thisIs = ['Un plan personalizado según tu situación', 'Entrenamientos eficientes de 45-60 minutos', 'Nutrición 80/20: come bien la mayor parte del tiempo', 'Seguimiento constante y ajustes cuando sea necesario'];
  return <>
      <Helmet>
        <title>Sobre Mateo - Metafit Coaching</title>
        <meta name="description" content="Conoce a Mateo von Wuthenau, coach personal con más de 8 años de experiencia ayudando a hombres ocupados a transformar su físico." />
      </Helmet>

      <div className="pt-16 lg:pt-20">
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <motion.div initial={{
              opacity: 0,
              scale: 0.95
            }} animate={{
              opacity: 1,
              scale: 1
            }} transition={{
              duration: 0.6
            }} className="order-2 lg:order-1">
                <div className="relative">
                    <div className="absolute inset-0 bg-[#0D1B2A] rounded-2xl transform translate-x-4 translate-y-4 -z-10"></div>
                    <img src="https://horizons-cdn.hostinger.com/9468b3ae-6fb7-4252-88fd-6121cd9f331f/3-dbent.jpg" alt="Mateo von Wuthenau" className="rounded-2xl shadow-xl w-full" />
                </div>
              </motion.div>

              <motion.div initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.6,
              delay: 0.2
            }} className="order-1 lg:order-2">
                <h1 className="text-4xl lg:text-5xl font-bold text-[#0D1B2A] mb-8">
                  Sobre Mateo
                </h1>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  Llevo más de 8 años entrenando y he trabajado con decenas de hombres que, como
                  tú, tienen una vida ocupada: trabajo exigente, familia, responsabilidades... y
                  poco tiempo libre.
                </p>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  Entiendo lo frustrante que es querer resultados pero no tener 2 horas diarias
                  para el gimnasio. Por eso creé Metafit: un método realista que funciona con tu
                  estilo de vida, no en contra de él.
                </p>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  Mi filosofía es simple: entrena de forma inteligente, come de forma flexible y sé
                  constante. No necesitas perfección, necesitas un sistema que puedas mantener a
                  largo plazo.
                </p>
                <Button asChild size="lg" className="bg-[#0D1B2A] hover:bg-[#1a2f45] text-white">
                    <Link to="/contacto">CONTACTO</Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-[#0D1B2A] mb-4">
                En qué creo
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {beliefs.map((belief, index) => <motion.div key={index} initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: index * 0.1
            }} className="flex items-start gap-4 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="bg-[#0D1B2A]/10 p-2 rounded-full">
                    <CheckCircle2 className="text-[#0D1B2A]" size={20} />
                  </div>
                  <p className="text-gray-700 font-medium pt-1">{belief}</p>
                </motion.div>)}
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
              <motion.div initial={{
              opacity: 0,
              x: -20
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }}>
                <h2 className="text-2xl lg:text-3xl font-bold text-[#0D1B2A] mb-8 pb-4 border-b border-gray-100">
                  Esto NO es
                </h2>
                <div className="space-y-6">
                  {thisIsNot.map((item, index) => <div key={index} className="flex items-start gap-4">
                      <XCircle className="text-red-500 flex-shrink-0 mt-1" size={24} />
                      <p className="text-gray-700 text-lg">{item}</p>
                    </div>)}
                </div>
              </motion.div>

              <motion.div initial={{
              opacity: 0,
              x: 20
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }}>
                <h2 className="text-2xl lg:text-3xl font-bold text-[#0D1B2A] mb-8 pb-4 border-b border-gray-100">
                  Esto SÍ es
                </h2>
                <div className="space-y-6">
                  {thisIs.map((item, index) => <div key={index} className="flex items-start gap-4">
                      <CheckCircle2 className="text-green-600 flex-shrink-0 mt-1" size={24} />
                      <p className="text-gray-700 text-lg">{item}</p>
                    </div>)}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }}>
              <h2 className="text-3xl lg:text-4xl font-bold text-[#0D1B2A] mb-6">
                Mi enfoque para hombres ocupados
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Trabajo principalmente con hombres de 25 a 45 años que tienen carreras exigentes,
                responsabilidades familiares y vidas sociales activas.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                Mi método se basa en la eficiencia y la flexibilidad. No busco que seas un atleta olímpico, busco que tengas un físico del que estés orgulloso mientras disfrutas de tu vida.
              </p>
              <Button asChild size="lg" className="bg-[#0D1B2A] hover:bg-[#1a2f45] text-white">
                <Link to="/servicios">Ver servicios</Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </div>
    </>;
};
export default AboutPage;