import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Mail, Send, Instagram } from 'lucide-react';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    edad: '',
    plan: '',
    objetivo: '',
    mensaje: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const TikTokIcon = ({ size = 20, className }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      toast({
        title: 'Campo requerido',
        description: 'Por favor ingresa tu nombre',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.email.trim()) {
      toast({
        title: 'Campo requerido',
        description: 'Por favor ingresa tu email',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.email.includes('@')) {
      toast({
        title: 'Email inválido',
        description: 'Por favor ingresa un email válido',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.objetivo.trim()) {
      toast({
        title: 'Campo requerido',
        description: 'Por favor cuéntame cuál es tu objetivo principal',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const emailBody = `
Nuevo mensaje desde la web Metafit

Nombre: ${formData.nombre}
Email: ${formData.email}
Edad: ${formData.edad || 'No especificada'}
Tipo de plan: ${formData.plan || 'No especificado'}
Objetivo principal: ${formData.objetivo}

Mensaje:
${formData.mensaje || 'Sin mensaje adicional'}
      `.trim();

      const mailtoLink = `mailto:vonwuthenaumateo@gmail.com?subject=${encodeURIComponent(
        'Nuevo mensaje desde la web Metafit'
      )}&body=${encodeURIComponent(emailBody)}`;

      window.location.href = mailtoLink;

      toast({
        title: '¡Solicitud preparada!',
        description: 'Se abrirá tu cliente de correo para enviar el mensaje.',
      });

      setFormData({
        nombre: '',
        email: '',
        edad: '',
        plan: '',
        objetivo: '',
        mensaje: '',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Hubo un problema. Por favor intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contacto - Metafit Coaching</title>
        <meta
          name="description"
          content="Aplica al coaching online Metafit. Cuéntame tu situación y objetivos para transformar tu físico."
        />
      </Helmet>

      <div className="pt-16 lg:pt-20">
        <section className="py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl lg:text-5xl font-bold text-[#0D1B2A] mb-6">
                Aplica al coaching Metafit
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                ¿Tienes dudas sobre tu plan o cualquier duda sobre tu seguimiento? Déjanos tu pregunta y te responderemos personalmente.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                 <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                        <label htmlFor="nombre" className="block text-sm font-semibold text-[#0D1B2A] mb-2">
                            Nombre *
                        </label>
                        <input
                            type="text"
                            id="nombre"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0D1B2A] focus:border-transparent transition-all outline-none text-gray-800 placeholder-gray-500"
                            placeholder="Tu nombre completo"
                        />
                        </div>

                        <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-[#0D1B2A] mb-2">
                            Email *
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0D1B2A] focus:border-transparent transition-all outline-none text-gray-800 placeholder-gray-500"
                            placeholder="tu@email.com"
                        />
                        </div>

                        <div>
                            <label htmlFor="plan" className="block text-sm font-semibold text-[#0D1B2A] mb-2">
                                Tipo de plan (opcional)
                            </label>
                            <input
                                type="text"
                                id="plan"
                                name="plan"
                                value={formData.plan}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0D1B2A] focus:border-transparent transition-all outline-none text-gray-800 placeholder-gray-500"
                                placeholder="Ejemplo: Metafit Transformación 90 días, Plan Principiantes, etc."
                            />
                        </div>

                        <div>
                        <label htmlFor="edad" className="block text-sm font-semibold text-[#0D1B2A] mb-2">
                            Edad (opcional)
                        </label>
                        <input
                            type="number"
                            id="edad"
                            name="edad"
                            value={formData.edad}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0D1B2A] focus:border-transparent transition-all outline-none text-gray-800 placeholder-gray-500"
                            placeholder="Ej: 32"
                        />
                        </div>

                        <div>
                        <label
                            htmlFor="objetivo"
                            className="block text-sm font-semibold text-[#0D1B2A] mb-2"
                        >
                            Objetivo principal *
                        </label>
                        <input
                            type="text"
                            id="objetivo"
                            name="objetivo"
                            value={formData.objetivo}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0D1B2A] focus:border-transparent transition-all outline-none text-gray-800 placeholder-gray-500"
                            placeholder="Ej: Perder grasa, ganar músculo..."
                        />
                        </div>

                        <div>
                        <label htmlFor="mensaje" className="block text-sm font-semibold text-[#0D1B2A] mb-2">
                            Mensaje (opcional)
                        </label>
                        <textarea
                            id="mensaje"
                            name="mensaje"
                            value={formData.mensaje}
                            onChange={handleChange}
                            rows={5}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0D1B2A] focus:border-transparent transition-all resize-none outline-none text-gray-800 placeholder-gray-500"
                            placeholder="Cuéntame más sobre tu situación..."
                        />
                        </div>

                        <Button
                        type="submit"
                        size="lg"
                        disabled={isSubmitting}
                        className="w-full bg-[#0D1B2A] hover:bg-[#1a2f45] text-white text-lg py-6 flex items-center justify-center gap-2 shadow-lg"
                        >
                        {isSubmitting ? (
                            'Enviando...'
                        ) : (
                            <>
                            <Send size={20} />
                            Enviar solicitud
                            </>
                        )}
                        </Button>
                    </form>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex flex-col justify-center"
              >
                  <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 mb-8">
                     <h2 className="text-2xl font-bold text-[#0D1B2A] mb-6">Dudas frecuentes y contacto</h2>
                     <div className="space-y-6">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-[#0D1B2A]">
                              <Mail size={24} />
                           </div>
                           <div>
                              <p className="text-sm text-gray-500 font-medium">Email</p>
                              <a href="mailto:vonwuthenaumateo@gmail.com" className="text-[#0D1B2A] font-semibold hover:underline">
                                 vonwuthenaumateo@gmail.com
                              </a>
                           </div>
                        </div>

                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-[#0D1B2A]">
                              <Instagram size={24} />
                           </div>
                           <div>
                              <p className="text-sm text-gray-500 font-medium">Instagram</p>
                              <a 
                                 href="https://www.instagram.com/mateovon.coach?igsh=MXNxaGZzZ2Y1cTlqYw%3D%3D&utm_source=qr" 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="text-[#0D1B2A] font-semibold hover:underline"
                              >
                                 @mateovon.coach
                              </a>
                           </div>
                        </div>

                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-[#0D1B2A]">
                              <TikTokIcon size={24} />
                           </div>
                           <div>
                              <p className="text-sm text-gray-500 font-medium">TikTok</p>
                              <a 
                                 href="http://www.tiktok.com/@m00n11k" 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="text-[#0D1B2A] font-semibold hover:underline"
                              >
                                 @m00n11k
                              </a>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-[#0D1B2A] p-8 rounded-2xl text-white">
                     <h3 className="text-xl font-bold mb-4">¿Por qué aplicar?</h3>
                     <p className="text-gray-300 mb-4">
                        Cada plan es personalizado. Necesito conocer tu situación para asegurarme de que puedo ayudarte y recomendarte la mejor opción.
                     </p>
                     <p className="text-gray-300">
                        No hay compromiso. Hablemos y decide tú mismo.
                     </p>
                  </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default ContactPage;