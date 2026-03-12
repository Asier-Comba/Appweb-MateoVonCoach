import React from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button'; const CheckInPage = () => {
  return (
    <>
      <Helmet><title>Check-in Semanal - Metafit App</title></Helmet>

      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#0D1B2A]">Check-in Semanal</h1>
          <p className="text-gray-500">Completa todos los campos para ajustar tu plan.</p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <form className="space-y-6">
            {/* Metrics */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Peso (kg)</label>
                <input type="number" step="0.1" className="w-full border rounded-lg px-4 py-2" placeholder="78.5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cintura (cm)</label>
                <input type="number" step="0.5" className="w-full border rounded-lg px-4 py-2" placeholder="85" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pasos diarios (media)</label>
                <input type="number" className="w-full border rounded-lg px-4 py-2" placeholder="8000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Horas sueño</label>
                <input type="number" step="0.5" className="w-full border rounded-lg px-4 py-2" placeholder="7.5" />
              </div>
            </div>

            {/* Qualitative */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nivel de energía (1-10)</label>
              <input type="range" min="1" max="10" className="w-full" />
              <div className="flex justify-between text-xs text-gray-400"><span>1 (Agotado)</span><span>10 (A tope)</span></div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Adherencia a la dieta (1-10)</label>
              <input type="range" min="1" max="10" className="w-full" />
              <div className="flex justify-between text-xs text-gray-400"><span>1 (Nada)</span><span>10 (Perfecto)</span></div>
            </div>

            {/* Comments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Comentarios / Sensaciones</label>
              <textarea rows="4" className="w-full border rounded-lg px-4 py-2" placeholder="Esta semana me sentí..."></textarea>
            </div>

            {/* Photo Upload Placeholders */}


            <Button className="w-full bg-[#0D1B2A] hover:bg-[#1a2f45] py-6 text-lg">
              Enviar Reporte
            </Button>
          </form>
        </div>
      </div>
    </>
  );
};

export default CheckInPage;