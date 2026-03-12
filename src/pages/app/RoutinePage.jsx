import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { PlayCircle, Info, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Convierte cualquier formato común de YouTube a una URL embebible:
 * - ID directo: "bbHPPIQeu6Y"
 * - Watch: https://www.youtube.com/watch?v=bbHPPIQeu6Y
 * - Short: https://www.youtube.com/shorts/bbHPPIQeu6Y
 * - Share: https://youtu.be/bbHPPIQeu6Y
 * - Embed ya hecho: https://www.youtube.com/embed/bbHPPIQeu6Y
 */
const toYouTubeEmbedUrl = (input) => {
  if (!input) return null;

  const raw = String(input).trim();
  if (!raw) return null;

  // Si ya es un embed, lo devolvemos tal cual
  if (raw.includes("youtube.com/embed/")) return raw;

  // Si NO es URL, asumimos que es el ID
  if (!raw.startsWith("http")) {
    return `https://www.youtube.com/embed/${raw}`;
  }

  try {
    const url = new URL(raw);

    // youtu.be/<id>
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    // youtube.com/watch?v=<id>
    const v = url.searchParams.get("v");
    if (v) return `https://www.youtube.com/embed/${v}`;

    // youtube.com/shorts/<id>
    const shortsMatch = url.pathname.match(/\/shorts\/([^/?]+)/);
    if (shortsMatch?.[1]) return `https://www.youtube.com/embed/${shortsMatch[1]}`;

    // Fallback: último segmento como posible ID
    const parts = url.pathname.split("/").filter(Boolean);
    const maybeId = parts[parts.length - 1];
    return maybeId ? `https://www.youtube.com/embed/${maybeId}` : null;
  } catch {
    return null;
  }
};

/**
 * Devuelve una URL "normal" de YouTube para abrir en pestaña nueva.
 * (Útil como fallback si el embed falla o si el usuario quiere ir directo a YouTube)
 */
const toYouTubeWatchUrl = (input) => {
  if (!input) return null;

  const raw = String(input).trim();
  if (!raw) return null;

  // Si ya es URL, devuélvela tal cual
  if (raw.startsWith("http")) return raw;

  // Si es ID
  return `https://www.youtube.com/watch?v=${raw}`;
};

const RoutinePage = () => {
  const [selectedDay, setSelectedDay] = useState(0);

  // Mock Data
  const routine = useMemo(() => ([
    {
      day: "Día 1 - Empuje",
      exercises: [
        { name: "Press Banca Plano", sets: 3, reps: "8-10", notes: "Controla la bajada en 3s", videoId: "xyz" },
        { name: "Press Militar Mancuernas", sets: 3, reps: "10-12", notes: "Sentado, espalda recta", videoId: "abc" },
        { name: "Elevaciones Laterales", sets: 4, reps: "15-20", notes: "Codos ligeramente flexionados", videoId: "def" },
      ]
    },
    {
      day: "Día 2 - Tracción",
      exercises: [
        { name: "Jalón al pecho", sets: 3, reps: "10-12", notes: "Lleva la barra al pecho alto", videoId: "ghi" },
        { name: "Remo con Barra", sets: 3, reps: "8-10", notes: "Torso a 45 grados", videoId: "jkl" },
      ]
    }
  ]), []);

  const safeSelectedDay = Math.min(Math.max(selectedDay, 0), routine.length - 1);

  return (
    <>
      <Helmet><title>Mi Rutina - Metafit App</title></Helmet>

      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Plan de Entrenamiento</h1>

        {/* Day Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {routine.map((day, i) => (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors ${
                safeSelectedDay === i
                  ? 'bg-[#0D1B2A] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {day.day}
            </button>
          ))}
        </div>

        {/* Exercises List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-[#0D1B2A]">{routine[safeSelectedDay].day}</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {routine[safeSelectedDay].exercises.map((ex, i) => {
              const embedUrl = toYouTubeEmbedUrl(ex.videoId);
              const watchUrl = toYouTubeWatchUrl(ex.videoId);

              return (
                <div key={i} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg text-gray-900">{ex.name}</h3>

                        {/* Botón: abre modal con video */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <button
                              className="text-blue-600 hover:text-blue-800"
                              aria-label={`Ver video de ${ex.name}`}
                              type="button"
                            >
                              <PlayCircle size={20} />
                            </button>
                          </DialogTrigger>

                          <DialogContent className="sm:max-w-xl">
                            <DialogHeader>
                              <DialogTitle>{ex.name}</DialogTitle>
                            </DialogHeader>

                            <div className="aspect-video bg-black rounded-lg overflow-hidden">
                              {embedUrl ? (
                                <iframe
                                  className="w-full h-full"
                                  src={embedUrl}
                                  title={`Video ${ex.name}`}
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-sm">
                                  No hay video asignado
                                </div>
                              )}
                            </div>

                            {/* Acceso directo a YouTube (por si el embed falla o el usuario lo quiere abrir fuera) */}
                            {watchUrl && (
                              <a
                                href={watchUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 mt-3"
                              >
                                Abrir en YouTube <ExternalLink size={16} />
                              </a>
                            )}

                            <p className="text-sm text-gray-500 mt-2">
                              Instrucciones detalladas de la técnica para {ex.name}.
                            </p>
                          </DialogContent>
                        </Dialog>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                        <span className="bg-gray-100 px-3 py-1 rounded-full font-medium text-[#0D1B2A]">
                          {ex.sets} Series
                        </span>
                        <span className="bg-gray-100 px-3 py-1 rounded-full font-medium text-[#0D1B2A]">
                          {ex.reps} Reps
                        </span>
                      </div>

                      {ex.notes && (
                        <div className="mt-3 flex items-start gap-2 text-sm text-gray-500 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                          <Info size={16} className="mt-0.5 text-yellow-600 shrink-0" />
                          {ex.notes}
                        </div>
                      )}
                    </div>

                    {/* Input Placeholders for Logging */}
                    <div className="hidden sm:flex flex-col gap-2 min-w-[100px]">
                      <input type="text" placeholder="Kg" className="text-sm border rounded px-2 py-1 text-center" />
                      <input type="text" placeholder="RIR" className="text-sm border rounded px-2 py-1 text-center" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default RoutinePage;