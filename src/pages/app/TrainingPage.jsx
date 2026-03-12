import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import {
  PlayCircle,
  CheckCircle2,
  Trophy,
  Clock,
  BarChart2,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/lib/customSupabaseClient";

const DAY_ORDER = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const normalize = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const daySortIndex = (dayName) => {
  const d = normalize(dayName);
  const i = DAY_ORDER.indexOf(d);
  return i === -1 ? 999 : i;
};

/**
 * Convierte URL/ID de YouTube (watch, shorts, youtu.be, embed, ID directo) a embed URL.
 */
const toYouTubeEmbedUrl = (input) => {
  if (!input) return null;

  const raw = String(input).trim();
  if (!raw) return null;

  if (raw.includes("youtube.com/embed/")) return raw;

  if (!raw.startsWith("http")) {
    return `https://www.youtube.com/embed/${raw}`;
  }

  try {
    const url = new URL(raw);

    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    const v = url.searchParams.get("v");
    if (v) return `https://www.youtube.com/embed/${v}`;

    const shortsMatch = url.pathname.match(/\/shorts\/([^/?]+)/);
    if (shortsMatch?.[1]) return `https://www.youtube.com/embed/${shortsMatch[1]}`;

    const parts = url.pathname.split("/").filter(Boolean);
    const maybeId = parts[parts.length - 1];
    return maybeId ? `https://www.youtube.com/embed/${maybeId}` : null;
  } catch {
    return null;
  }
};

const toYouTubeWatchUrl = (input) => {
  if (!input) return null;
  const raw = String(input).trim();
  if (!raw) return null;
  if (raw.startsWith("http")) return raw;
  return `https://www.youtube.com/watch?v=${raw}`;
};

const LOCAL_LOG_KEY = "metafit_workout_logs_v1";

/** helpers ultra seguros */
function safeJsonParseArray(raw) {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function safeTrim(v) {
  return String(v ?? "").trim();
}
function makeLocalId(prefix = "local") {
  // id estable para evitar colisiones si se guarda muy rápido
  const t = new Date().toISOString();
  const r = Math.random().toString(16).slice(2);
  return `${prefix}_${t}_${r}`;
}

// ✅ helpers PRO "día completado" (solo añade, no rompe)
function normalizeDayKey(dayName) {
  return normalize(String(dayName || "").split(":")[0]);
}
function formatNiceDateTime(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return String(iso || "");
  }
}

const TrainingPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState("");
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  const [routines, setRoutines] = useState([]);

  // Inputs del usuario (kg y reps hechas) por ejercicio
  // Estructura: { [exerciseIndex]: { weight: string, repsDone: string } }
  const [workoutInputs, setWorkoutInputs] = useState({});
  const [finishing, setFinishing] = useState(false);

  // ✅ completado por día: { lunes: { at, source } }
  const [completedByDay, setCompletedByDay] = useState({});

  const prs = [
    { lift: "Squat", weight: "—" },
    { lift: "Bench", weight: "—" },
    { lift: "Deadlift", weight: "—" },
    { lift: "Pull-up", weight: "—" },
    { lift: "OHP", weight: "—" },
  ];

  // ✅ Carga completados desde BD + localStorage (robusto)
  const loadCompletions = async () => {
    if (!user?.id) return;

    // 1) LocalStorage (fallback)
    let localMap = {};
    try {
      const raw = localStorage.getItem(LOCAL_LOG_KEY);
      const arr = safeJsonParseArray(raw);

      for (const row of arr) {
        const k = normalizeDayKey(row?.day_name);
        if (!k) continue;
        const at = row?.performed_at || row?.created_at || null;
        if (!at) continue;

        if (!localMap[k] || new Date(at).getTime() > new Date(localMap[k].at).getTime()) {
          localMap[k] = { at, source: "local" };
        }
      }
    } catch {
      // ignore
    }

    // 2) BD: últimos 7 días (si falla, seguimos con local)
    let dbMap = {};
    try {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("workout_logs")
        .select("day_name, performed_at")
        .eq("user_id", user.id)
        .gte("performed_at", since)
        .order("performed_at", { ascending: false })
        .limit(200);

      if (!error && Array.isArray(data)) {
        for (const row of data) {
          const k = normalizeDayKey(row?.day_name);
          if (!k) continue;
          if (!dbMap[k]) dbMap[k] = { at: row?.performed_at || null, source: "db" }; // desc => primer match es el más reciente
        }
      }
    } catch {
      // ignore
    }

    // merge: BD gana sobre local si existe
    setCompletedByDay({ ...localMap, ...dbMap });
  };

  const loadRoutines = async () => {
    if (!user?.id) return;

    setLoading(true);
    setErrorBanner("");

    try {
      const { data, error } = await supabase
        .from("routines")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      // si hay varios por día, nos quedamos con el más reciente por day_name
      const map = new Map();
      for (const r of data ?? []) {
        const key = normalize(r?.day_name);
        if (!key) continue;
        if (!map.has(key)) map.set(key, r);
      }

      const unique = Array.from(map.values()).sort(
        (a, b) => daySortIndex(a?.day_name) - daySortIndex(b?.day_name) // mantiene el orden semanal
      );

      setRoutines(unique);
      setSelectedDayIdx(0);
      setWorkoutInputs({}); // resetea inputs cuando recargas rutinas

      // ✅ refresca el estado completado (no rompe si falla)
      loadCompletions();
    } catch (e) {
      setErrorBanner(e?.message ?? "No se pudieron cargar las rutinas.");
      toast({
        variant: "destructive",
        title: "Error",
        description: e?.message ?? "Fallo cargando rutinas.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutines();
    loadCompletions(); // ✅ por si hay logs ya guardados
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const routineForUI = useMemo(() => {
    return (routines ?? []).map((r) => ({
      id: r?.id ?? null,
      day: r?.day_name ?? "Día",
      duration: r?.duration ?? "—",
      exercises: Array.isArray(r?.exercises) ? r.exercises : [],
    }));
  }, [routines]);

  const hasRoutines = routineForUI.length > 0;
  const safeSelectedDayIdx = Math.min(
    Math.max(selectedDayIdx, 0),
    Math.max(routineForUI.length - 1, 0)
  );
  const selected = hasRoutines ? routineForUI[safeSelectedDayIdx] : null;

  const selectedDayKey = useMemo(() => normalizeDayKey(selected?.day), [selected?.day]);
  const selectedCompletion = useMemo(() => (selectedDayKey ? completedByDay?.[selectedDayKey] : null), [
    completedByDay,
    selectedDayKey,
  ]);

  const updateWorkoutInput = (exerciseIndex, patch) => {
    setWorkoutInputs((prev) => ({
      ...prev,
      [exerciseIndex]: { ...(prev?.[exerciseIndex] ?? {}), ...patch },
    }));
  };

  function buildEntries() {
    const exs = selected?.exercises ?? [];
    return exs.map((ex, idx) => {
      const name = ex?.name ?? `Ejercicio ${idx + 1}`;
      const sets = ex?.sets ?? null;
      const reps = ex?.reps ?? null;
      const rir = ex?.rir ?? null;
      const video = ex?.video ?? ex?.video_url ?? "";
      const notes = ex?.notes ?? "";

      const inp = workoutInputs?.[idx] ?? {};
      const weight = safeTrim(inp?.weight);
      const repsDone = safeTrim(inp?.repsDone);

      // NO forzamos a number para no romper nada; guardamos strings o null.
      return {
        name,
        sets,
        reps,
        rir,
        video,
        notes,
        weight: weight || null,
        reps_done: repsDone || null,
      };
    });
  }

  function buildPayload() {
    const performedAt = new Date().toISOString();
    const entries = buildEntries();

    return {
      user_id: user.id,
      routine_id: selected?.id ?? null,
      day_name: selected?.day ?? null,
      performed_at: performedAt,
      entries, // jsonb
    };
  }

  function saveLocal(payload) {
    const fallback = {
      id: makeLocalId("local"),
      ...payload,
      // por si acaso, mantenemos performed_at estable
      performed_at: payload?.performed_at ?? new Date().toISOString(),
    };

    const raw = localStorage.getItem(LOCAL_LOG_KEY);
    const arr = safeJsonParseArray(raw);
    arr.unshift(fallback);
    localStorage.setItem(LOCAL_LOG_KEY, JSON.stringify(arr));
  }

  /**
   * Guardado blindado:
   * - Inserta en Supabase SIN .single()/.select() para evitar falsos fallos.
   * - Si falla por cualquier motivo: fallback localStorage garantizado.
   */
  const finalizeWorkout = async () => {
    if (finishing) return; // evita doble click
    if (!user?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Necesitas iniciar sesión.",
      });
      return;
    }
    if (!selected?.exercises?.length) {
      toast({
        variant: "destructive",
        title: "Sin ejercicios",
        description: "No hay ejercicios para registrar.",
      });
      return;
    }

    setFinishing(true);

    const payload = buildPayload();

    try {
      // ✅ INSERT robusto: no pedimos retorno (evita errores por RLS/select/single)
      const { error: insErr } = await supabase.from("workout_logs").insert([payload]);
      if (insErr) throw insErr;

      // ✅ marca completado instantáneo (UI PRO)
      setCompletedByDay((prev) => {
        const k = normalizeDayKey(payload?.day_name);
        if (!k) return prev;
        return { ...prev, [k]: { at: payload?.performed_at, source: "db" } };
      });

      toast({
        title: "Entrenamiento guardado",
        description: "Se registró tu entrenamiento correctamente.",
      });

      setWorkoutInputs({});
    } catch (e) {
      // ✅ fallback local garantizado
      try {
        saveLocal(payload);

        // ✅ marca completado instantáneo (local)
        setCompletedByDay((prev) => {
          const k = normalizeDayKey(payload?.day_name);
          if (!k) return prev;
          return { ...prev, [k]: { at: payload?.performed_at, source: "local" } };
        });

        toast({
          title: "Entrenamiento guardado (modo local)",
          description:
            "Se guardó en tu navegador porque la BD no está lista o está bloqueando el guardado. No se perdió.",
        });
      } catch {
        toast({
          variant: "destructive",
          title: "Error",
          description: e?.message ?? "No se pudo guardar el entrenamiento.",
        });
      }
    } finally {
      setFinishing(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Entrenamiento - Metafit App</title>
      </Helmet>

      <div className="space-y-8">
        <div className="flex justify-between items-center gap-3">
          <h1 className="text-2xl font-bold text-[#0D1B2A]">Entrenamiento</h1>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
              <BarChart2 size={16} /> Ver Historial
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={loadRoutines}
              disabled={loading}
              title="Actualizar rutinas"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              {loading ? "Cargando…" : "Actualizar"}
            </Button>
          </div>
        </div>

        {errorBanner ? (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-sm">
            <div className="font-bold mb-1 flex items-center gap-2">
              <AlertCircle size={18} /> Algo falla
            </div>
            <div className="whitespace-pre-line">{errorBanner}</div>
          </div>
        ) : null}

        {/* PRs Section (placeholder) */}
        <div className="bg-gradient-to-r from-[#0D1B2A] to-[#1a2f45] rounded-xl p-6 text-white overflow-x-auto">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Trophy className="text-yellow-400" size={20} /> Récords Personales (PRs)
          </h3>
          <div className="flex gap-6 min-w-max">
            {prs.map((pr, i) => (
              <div key={i} className="text-center">
                <p className="text-xs text-gray-300 uppercase tracking-wider">{pr.lift}</p>
                <p className="font-bold text-xl">{pr.weight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Routine Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Day Selector Tabs */}
          <div className="border-b border-gray-200 overflow-x-auto">
            <div className="flex">
              {hasRoutines ? (
                routineForUI.map((day, i) => {
                  const dayLabel = String(day.day).split(":")[0];
                  const dayKey = normalizeDayKey(day.day);
                  const done = dayKey ? completedByDay?.[dayKey] : null;

                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedDayIdx(i);
                        setWorkoutInputs({});
                      }}
                      className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                        safeSelectedDayIdx === i
                          ? "border-[#0D1B2A] text-[#0D1B2A]"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                      title={done?.at ? `Completado · ${formatNiceDateTime(done.at)}` : ""}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span>{dayLabel}</span>
                        {done ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            ✓
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="px-6 py-4 text-sm text-gray-500">
                  {loading ? "Cargando…" : "Todavía no tenés rutinas asignadas."}
                </div>
              )}
            </div>
          </div>

          {/* Selected Routine Content */}
          <div className="p-6">
            {!hasRoutines ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-sm text-gray-700">
                <p className="font-bold mb-1">Sin rutinas aún</p>
                <p>Tu coach todavía no cargó tu rutina.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#0D1B2A]">{selected?.day}</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    <Clock size={16} /> {selected?.duration ?? "—"}
                  </div>
                </div>

                <div className="space-y-4">
                  {(selected?.exercises ?? []).map((ex, i) => {
                    const name = ex?.name ?? `Ejercicio ${i + 1}`;
                    const sets = ex?.sets ?? "—";
                    const reps = ex?.reps ?? "—";
                    const rir = ex?.rir ?? "—";
                    const videoRaw = ex?.video ?? ex?.video_url ?? "";
                    const notes = ex?.notes ?? "";

                    const embedUrl = videoRaw ? toYouTubeEmbedUrl(videoRaw) : null;
                    const watchUrl = videoRaw ? toYouTubeWatchUrl(videoRaw) : null;

                    const wVal = workoutInputs?.[i]?.weight ?? "";
                    const rVal = workoutInputs?.[i]?.repsDone ?? "";

                    return (
                      <div
                        key={i}
                        className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            {videoRaw ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <button
                                    className="text-blue-600 hover:text-blue-800 mt-1"
                                    title="Ver video"
                                  >
                                    <PlayCircle size={24} />
                                  </button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-xl">
                                  <DialogHeader>
                                    <DialogTitle>{name} - Técnica</DialogTitle>
                                  </DialogHeader>

                                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                    {embedUrl ? (
                                      <iframe
                                        className="w-full h-full"
                                        src={embedUrl}
                                        title={`Video ${name}`}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-white text-sm">
                                        No se pudo embebeder el video
                                      </div>
                                    )}
                                  </div>

                                  {watchUrl ? (
                                    <a
                                      href={watchUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 mt-3"
                                    >
                                      Abrir en YouTube <ExternalLink size={16} />
                                    </a>
                                  ) : null}
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <div className="text-gray-300 mt-1">
                                <PlayCircle size={24} />
                              </div>
                            )}

                            <div>
                              <h4 className="font-bold text-gray-900">{name}</h4>
                              <div className="flex flex-wrap gap-2 text-sm text-gray-600 mt-1">
                                <span className="bg-white border border-gray-200 px-2 py-0.5 rounded">
                                  {sets} Sets
                                </span>
                                <span className="bg-white border border-gray-200 px-2 py-0.5 rounded">
                                  {reps} Reps
                                </span>
                                <span className="bg-white border border-gray-200 px-2 py-0.5 rounded">
                                  RIR {rir}
                                </span>
                              </div>
                              {notes ? (
                                <p className="text-xs text-gray-500 mt-2 whitespace-pre-line">
                                  {notes}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 pl-9 sm:pl-0">
                            <div className="flex flex-col w-24">
                              <span className="text-[10px] text-gray-400 uppercase">Carga</span>
                              <input
                                type="text"
                                placeholder="kg"
                                className="border rounded px-2 py-1 text-sm text-center"
                                value={wVal}
                                onChange={(e) => updateWorkoutInput(i, { weight: e.target.value })}
                              />
                            </div>
                            <div className="flex flex-col w-24">
                              <span className="text-[10px] text-gray-400 uppercase">Reps</span>
                              <input
                                type="text"
                                placeholder="hechas"
                                className="border rounded px-2 py-1 text-sm text-center"
                                value={rVal}
                                onChange={(e) => updateWorkoutInput(i, { repsDone: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ✅ Banner PRO “día completado” (solo si existe completion) */}
                {selectedCompletion?.at ? (
                  <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    <div className="font-semibold">
                      ✅ {String(selected?.day || "Día").split(":")[0]} completado
                    </div>
                    <div className="mt-1 text-xs text-emerald-800/80">
                      Último registro: {formatNiceDateTime(selectedCompletion.at)}{" "}
                      {selectedCompletion.source === "local" ? "(guardado en este dispositivo)" : ""}
                    </div>
                  </div>
                ) : null}

                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                  <Button
                    className="bg-[#0D1B2A] text-white hover:bg-[#1a2f45]"
                    onClick={finalizeWorkout}
                    disabled={finishing}
                    title="Guardar entrenamiento"
                  >
                    <CheckCircle2 className="mr-2" size={18} />
                    {finishing ? "Guardando…" : "Finalizar Entrenamiento"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TrainingPage;