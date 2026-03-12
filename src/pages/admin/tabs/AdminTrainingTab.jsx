import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Save, RefreshCw, Plus, Trash2, Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/lib/customSupabaseClient";

const BUCKET = "training_media";

const DAYS = [
  { key: "lunes", label: "Lunes" },
  { key: "martes", label: "Martes" },
  { key: "miercoles", label: "Miércoles" },
  { key: "jueves", label: "Jueves" },
  { key: "viernes", label: "Viernes" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];

function makeId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}

function sanitizeFilename(name) {
  return String(name || "file")
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "_")
    .slice(0, 80);
}

function toIntOrNull(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export default function AdminTrainingTab({ selectedUser }) {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const isAdmin = String(profile?.role || "").toLowerCase() === "admin";
  const isClientSelected = String(selectedUser?.role || "").toLowerCase() === "client";

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeDay, setActiveDay] = useState("lunes");

  // Map dayKey -> { id, day_name, exercises: [] }
  const [byDay, setByDay] = useState({});

  const fileInputsRef = useRef({});

  const inputBase =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-gray-200";
  const labelBase = "text-xs font-medium text-gray-600";

  const canEdit = isAdmin && isClientSelected && !!selectedUser?.id;

  const loadRoutines = useCallback(async () => {
    if (!user || !selectedUser?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("routines")
        .select("id, user_id, day_name, duration, exercises, created_at")
        .eq("user_id", selectedUser.id)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      const map = {};
      for (const row of data || []) {
        const key = String(row?.day_name || "").trim().toLowerCase();
        if (!key) continue;
        if (map[key]) continue; // keep most recent per day
        map[key] = {
          id: row.id,
          day_name: key,
          duration: row.duration || "",
          exercises: Array.isArray(row.exercises)
            ? row.exercises.map((ex) => ({
                id: ex?.id || makeId(),
                name: ex?.name || "",
                sets: ex?.sets ?? "",
                reps: ex?.reps ?? "",
                video: ex?.video && typeof ex.video === "object" ? ex.video : null,
              }))
            : [],
        };
      }

      // ensure all days present
      for (const d of DAYS) {
        if (!map[d.key]) {
          map[d.key] = { id: null, day_name: d.key, duration: "", exercises: [] };
        }
      }

      setByDay(map);
    } catch (e) {
      toast({
        title: "Error cargando rutinas",
        description: e?.message || "No se pudieron cargar las rutinas del cliente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedUser?.id, toast, user]);

  useEffect(() => {
    loadRoutines();
  }, [loadRoutines]);

  useEffect(() => {
    // si el día activo no existe en map, reset
    setActiveDay((prev) => (byDay?.[prev] ? prev : "lunes"));
  }, [byDay]);

  const dayData = byDay?.[activeDay] || { id: null, exercises: [], duration: "" };

  const setExercise = (exId, patch) => {
    setByDay((prev) => {
      const day = prev?.[activeDay] || { id: null, exercises: [], duration: "" };
      const nextExercises = (day.exercises || []).map((e) => (e.id === exId ? { ...e, ...patch } : e));
      return { ...prev, [activeDay]: { ...day, exercises: nextExercises } };
    });
  };

  const addExercise = () => {
    setByDay((prev) => {
      const day = prev?.[activeDay] || { id: null, exercises: [], duration: "" };
      const nextExercises = [...(day.exercises || []), { id: makeId(), name: "", sets: "", reps: "", video: null }];
      return { ...prev, [activeDay]: { ...day, exercises: nextExercises } };
    });
  };

  const removeExercise = async (exId) => {
    const ex = (dayData.exercises || []).find((e) => e.id === exId);
    const video = ex?.video;
    setByDay((prev) => {
      const day = prev?.[activeDay] || { id: null, exercises: [], duration: "" };
      return { ...prev, [activeDay]: { ...day, exercises: (day.exercises || []).filter((e) => e.id !== exId) } };
    });

    // best-effort cleanup of storage object
    if (video?.bucket && video?.path) {
      try {
        await supabase.storage.from(video.bucket).remove([video.path]);
      } catch {
        // ignore
      }
    }
  };

  const triggerUpload = (exId) => {
    const key = `${activeDay}:${exId}`;
    const input = fileInputsRef.current[key];
    if (input) input.click();
  };

  const handleUpload = async (exId, file) => {
    if (!canEdit || !file) return;

    try {
      const safe = sanitizeFilename(file.name);
      const path = `training/${user.id}/${selectedUser.id}/${activeDay}/${makeId()}-${safe}`;

      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });
      if (error) throw error;

      setExercise(exId, {
        video: {
          bucket: BUCKET,
          path,
          mime: file.type || "application/octet-stream",
          size: file.size || null,
          filename: file.name || safe,
        },
      });

      toast({ title: "Vídeo subido", description: "Se adjuntó el vídeo a este ejercicio." });
    } catch (e) {
      toast({
        title: "Error subiendo vídeo",
        description:
          e?.message ||
          "No se pudo subir el vídeo. Revisa bucket/policies de Storage (training_media).",
        variant: "destructive",
      });
    }
  };

  const removeVideo = async (exId) => {
    const ex = (dayData.exercises || []).find((e) => e.id === exId);
    const video = ex?.video;
    setExercise(exId, { video: null });

    if (video?.bucket && video?.path) {
      try {
        await supabase.storage.from(video.bucket).remove([video.path]);
      } catch {
        // ignore
      }
    }
  };

  const saveDay = async () => {
    if (!canEdit) return;

    setSaving(true);
    try {
      const cleaned = (dayData.exercises || [])
        .filter((e) => String(e?.name || "").trim().length > 0)
        .map((e) => ({
          id: e.id,
          name: String(e.name || "").trim(),
          sets: toIntOrNull(e.sets),
          reps: String(e.reps || "").trim(),
          video: e.video || null,
        }));

      const payload = {
        user_id: selectedUser.id,
        day_name: activeDay,
        duration: String(dayData.duration || ""),
        exercises: cleaned,
      };

      if (dayData.id) {
        const { error } = await supabase.from("routines").update(payload).eq("id", dayData.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("routines").insert(payload).select("id").single();
        if (error) throw error;

        setByDay((prev) => ({
          ...prev,
          [activeDay]: { ...(prev?.[activeDay] || {}), id: data?.id || null },
        }));
      }

      toast({ title: "Rutina guardada", description: `Se guardó la rutina del ${DAYS.find(d => d.key===activeDay)?.label || activeDay}.` });
      await loadRoutines();
    } catch (e) {
      toast({
        title: "Error guardando rutina",
        description: e?.message || "No se pudo guardar la rutina.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteDayRoutine = async () => {
    if (!canEdit) return;
    if (!dayData.id) {
      // nothing persisted; just clear
      setByDay((prev) => ({ ...prev, [activeDay]: { id: null, day_name: activeDay, duration: "", exercises: [] } }));
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("routines").delete().eq("id", dayData.id);
      if (error) throw error;

      setByDay((prev) => ({ ...prev, [activeDay]: { id: null, day_name: activeDay, duration: "", exercises: [] } }));
      toast({ title: "Rutina eliminada", description: "Se eliminó la rutina de ese día." });
    } catch (e) {
      toast({
        title: "Error eliminando rutina",
        description: e?.message || "No se pudo eliminar la rutina.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!selectedUser) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700">
        Selecciona un cliente para gestionar sus rutinas.
      </div>
    );
  }

  if (!isClientSelected) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700">
        Para editar rutinas, selecciona un usuario con rol <span className="font-semibold">client</span>.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!isAdmin && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5" size={18} />
            <div>
              <div className="font-semibold">Solo el coach puede editar</div>
              <div className="text-sm">Este apartado es de solo lectura para usuarios no-admin.</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-900">Rutina por día</div>
          <div className="text-xs text-gray-500">
            Carga ejercicios (nombre, series, reps y vídeo opcional). El cliente lo verá en /app/entrenamiento.
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadRoutines} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button onClick={saveDay} disabled={!canEdit || saving}>
            <Save size={16} className="mr-2" />
            {saving ? "Guardando…" : "Guardar día"}
          </Button>
          <Button variant="outline" onClick={deleteDayRoutine} disabled={!canEdit || saving}>
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-7">
          {DAYS.map((d) => (
            <button
              key={d.key}
              onClick={() => setActiveDay(d.key)}
              className={[
                "rounded-lg border px-3 py-2 text-sm",
                activeDay === d.key
                  ? "border-gray-300 bg-gray-50 text-gray-900"
                  : "border-gray-100 bg-white text-gray-600 hover:bg-gray-50",
              ].join(" ")}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className={labelBase}>Duración (opcional)</div>
            <input
              className={inputBase}
              value={dayData.duration || ""}
              onChange={(e) =>
                setByDay((prev) => ({
                  ...prev,
                  [activeDay]: { ...(prev?.[activeDay] || {}), duration: e.target.value },
                }))
              }
              disabled={!canEdit}
              placeholder="Ej: 60 min"
            />
          </div>

          <div className="lg:col-span-2 flex justify-end">
            <Button variant="outline" onClick={addExercise} disabled={!canEdit}>
              <Plus size={16} className="mr-2" />
              Añadir ejercicio
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {(dayData.exercises || []).length === 0 ? (
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
              Sin ejercicios para este día.
            </div>
          ) : (
            (dayData.exercises || []).map((ex) => {
              const key = `${activeDay}:${ex.id}`;
              return (
                <div key={ex.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                    <div className="lg:col-span-5">
                      <div className={labelBase}>Ejercicio</div>
                      <input
                        className={inputBase}
                        value={ex.name}
                        onChange={(e) => setExercise(ex.id, { name: e.target.value })}
                        disabled={!canEdit}
                        placeholder="Ej: Sentadilla"
                      />
                    </div>
                    <div className="lg:col-span-2">
                      <div className={labelBase}>Series</div>
                      <input
                        className={inputBase}
                        value={ex.sets}
                        onChange={(e) => setExercise(ex.id, { sets: e.target.value })}
                        disabled={!canEdit}
                        inputMode="numeric"
                        placeholder="4"
                      />
                    </div>
                    <div className="lg:col-span-2">
                      <div className={labelBase}>Reps</div>
                      <input
                        className={inputBase}
                        value={ex.reps}
                        onChange={(e) => setExercise(ex.id, { reps: e.target.value })}
                        disabled={!canEdit}
                        placeholder="8-10"
                      />
                    </div>
                    <div className="lg:col-span-3">
                      <div className={labelBase}>Vídeo (opcional)</div>
                      <div className="flex gap-2">
                        <input
                          ref={(el) => (fileInputsRef.current[key] = el)}
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = "";
                            handleUpload(ex.id, f);
                          }}
                        />
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => triggerUpload(ex.id)}
                          disabled={!canEdit}
                        >
                          <Upload size={16} className="mr-2" />
                          {ex.video?.filename ? "Cambiar" : "Subir"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => removeVideo(ex.id)}
                          disabled={!canEdit || !ex.video}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                      {ex.video?.filename && (
                        <div className="mt-1 text-xs text-gray-500 truncate">{ex.video.filename}</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <Button variant="outline" onClick={() => removeExercise(ex.id)} disabled={!canEdit}>
                      <Trash2 size={16} className="mr-2" />
                      Quitar ejercicio
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}