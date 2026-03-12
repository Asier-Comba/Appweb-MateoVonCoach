import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <>
      <Helmet>
        <title>Página no encontrada - Metafit Coaching</title>
        <meta name="description" content="La página que buscas no existe." />
      </Helmet>

      <div className="min-h-screen pt-16 lg:pt-20 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-9xl font-bold text-[#0D1B2A] mb-4">404</h1>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-6">
              Página no encontrada
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Lo siento, la página que buscas no existe o ha sido movida
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-[#0D1B2A] hover:bg-[#1a2f45] text-white flex items-center gap-2"
              >
                <Link to="/">
                  <Home size={20} />
                  Ir al inicio
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-[#0D1B2A] text-[#0D1B2A] hover:bg-gray-50 flex items-center gap-2"
              >
                <button onClick={() => window.history.back()}>
                  <ArrowLeft size={20} />
                  Volver atrás
                </button>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;