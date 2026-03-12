import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { TrendingUp, Trash2, Pencil, RefreshCw, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/lib/customSupabaseClient";

/* ---------------- Helpers ---------------- */
const toDate = (iso) => new Date(iso);
const nowMs = () => Date.now();

const pad2 = (n) => String(n).padStart(2, "0");
const dayKeyLocal = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
};

const formatShortDate = (iso) => {
  try {
    return toDate(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  } catch {
    return "";
  }
};

const formatAxisDate = (iso) => {
  try {
    // dd/mm
    return toDate(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
};

const formatLongDate = (iso) => {
  try {
    return toDate(iso).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const safeNum = (v) => (v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v));

const getCutoffMs = (range) => {
  const day = 24 * 60 * 60 * 1000;
  if (range === "7d") return nowMs() - 7 * day;
  if (range === "30d") return nowMs() - 30 * day;
  if (range === "90d") return nowMs() - 90 * day;
  return 0;
};

const fmtDelta = (d, unit) => {
  if (d === null || d === undefined) return "—";
  const num = Number(d);
  if (Number.isNaN(num)) return "—";
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toFixed(1)}${unit}`;
};

const findBaselineForDelta = (rows, fieldOrFn, daysBack) => {
  const cutoff = nowMs() - daysBack * 24 * 60 * 60 * 1000;
  const filtered = rows.filter((r) => toDate(r.created_at).getTime() <= cutoff);
  if (!filtered.length) return null;
  const last = filtered[filtered.length - 1];
  if (typeof fieldOrFn === "function") return fieldOrFn(last);
  return safeNum(last[fieldOrFn]);
};

/**
 * Media de medidas corporales:
 * - Usa todas las columnas que terminen en _measurement (si existen)
 * - Si tu tabla solo tiene cintura/cadera, hace la media de ambas.
 */
const avgMeasurements = (row) => {
  try {
    const vals = Object.entries(row || {})
      .filter(([k, v]) => k && k.endsWith("_measurement") && v !== null && v !== undefined && v !== "")
      .map(([, v]) => Number(v))
      .filter((n) => !Number.isNaN(n));

    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  } catch {
    return null;
  }
};

const buildSeries = (rows, field) =>
  rows
    .map((r) => ({
      id: r.id,
      x: r.created_at,
      y: safeNum(r[field]),
    }))
    .filter((p) => p.y !== null);

const buildDerivedSeries = (rows, fn, idPrefix = "d") =>
  rows
    .map((r) => ({
      id: `${idPrefix}_${r.id}`,
      x: r.created_at,
      y: safeNum(fn(r)),
    }))
    .filter((p) => p.y !== null);

const niceStep = (range) => {
  // Steps "bonitos" según rango aproximado
  if (range <= 2) return 0.5;
  if (range <= 5) return 1;
  if (range <= 12) return 2;
  if (range <= 25) return 5;
  if (range <= 60) return 10;
  return 20;
};

const niceDomain = (min, max) => {
  const spread = Math.max(0.001, max - min);
  const pad = Math.max(spread * 0.12, spread < 2 ? 0.6 : 0.0);
  const rawMin = min - pad;
  const rawMax = max + pad;

  const step = niceStep(rawMax - rawMin);
  const nMin = Math.floor(rawMin / step) * step;
  const nMax = Math.ceil(rawMax / step) * step;

  return { minY: nMin, maxY: nMax, step };
};

/* ---------------- UI Components ---------------- */
const RangePill = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={[
      "px-3 py-1.5 rounded-full text-sm font-medium border transition",
      active
        ? "bg-[#0D1B2A] text-white border-[#0D1B2A]"
        : "bg-white text-black border-gray-200 hover:bg-gray-50",
    ].join(" ")}
  >
    {children}
  </button>
);

const StatCard = ({ title, value, sub }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
    <p className="text-sm font-medium text-black">{title}</p>
    <p className="text-2xl font-bold text-black">{value}</p>
    {sub ? <p className="text-sm text-black/70">{sub}</p> : null}
  </div>
);

const LineChart = ({ title, icon, series, color = "#0D1B2A", unit = "", yLabel = "" }) => {
  const points = useMemo(() => series || [], [series]);

  const dims = { w: 620, h: 260, padL: 56, padR: 16, padT: 18, padB: 38 };
  const { minY, maxY, step } = useMemo(() => {
    if (!points.length) return { minY: 0, maxY: 0, step: 1 };
    const ys = points.map((p) => p.y);
    return niceDomain(Math.min(...ys), Math.max(...ys));
  }, [points]);

  const mapped = useMemo(() => {
    if (!points.length) return [];
    const n = points.length;
    const usableW = dims.w - dims.padL - dims.padR;
    const usableH = dims.h - dims.padT - dims.padB;

    return points.map((p, i) => {
      const x = dims.padL + (n === 1 ? usableW / 2 : (i / (n - 1)) * usableW);
      const yNorm = (p.y - minY) / (maxY - minY || 1);
      const y = dims.h - dims.padB - yNorm * usableH;
      return { ...p, sx: x, sy: y, label: formatShortDate(p.x), axisLabel: formatAxisDate(p.x) };
    });
  }, [points, minY, maxY]);

  const polyline = useMemo(() => mapped.map((p) => `${p.sx},${p.sy}`).join(" "), [mapped]);
  const area = useMemo(() => {
    if (!mapped.length) return "";
    const baseY = dims.h - dims.padB;
    const first = mapped[0];
    const last = mapped[mapped.length - 1];
    const pts = [
      `${first.sx},${baseY}`,
      ...mapped.map((p) => `${p.sx},${p.sy}`),
      `${last.sx},${baseY}`,
    ];
    return pts.join(" ");
  }, [mapped]);

  const yTicks = useMemo(() => {
    if (!mapped.length) return [];
    const ticks = [];
    // intentamos 5 ticks
    const target = 5;
    const total = maxY - minY || 1;
    const rawStep = total / (target - 1);
    const s = Math.max(step, niceStep(rawStep));
    const start = Math.ceil(minY / s) * s;
    for (let v = start; v <= maxY + 0.0001; v += s) ticks.push(Number(v.toFixed(2)));
    // si quedó muy largo, recorta
    if (ticks.length > 6) return [minY, minY + (maxY - minY) / 2, maxY].map((v) => Number(v.toFixed(2)));
    return ticks;
  }, [mapped, minY, maxY, step]);

  const xTickIdx = useMemo(() => {
    if (!mapped.length) return [];
    const n = mapped.length;
    if (n <= 7) return [...Array(n)].map((_, i) => i);
    // max 6 etiquetas
    const maxLabels = 6;
    const stepIdx = Math.ceil(n / maxLabels);
    const idxs = [];
    for (let i = 0; i < n; i += stepIdx) idxs.push(i);
    if (idxs[idxs.length - 1] !== n - 1) idxs.push(n - 1);
    return idxs;
  }, [mapped]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-black flex items-center gap-2">
          {icon} {title}
        </h3>
        {yLabel ? <span className="text-xs text-black/70">{yLabel}</span> : null}
      </div>

      {!mapped.length ? (
        <div className="h-64 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-sm text-black/70">
          Sin datos en este rango.
        </div>
      ) : (
        <>
          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${dims.w} ${dims.h}`} className="w-full h-64">
              <defs>
                <linearGradient id={`fill_${title.replace(/\s+/g, "_")}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* grid horizontal + y labels */}
              {yTicks.map((v) => {
                const yNorm = (v - minY) / (maxY - minY || 1);
                const y = dims.h - dims.padB - yNorm * (dims.h - dims.padT - dims.padB);
                return (
                  <g key={v}>
                    <line
                      x1={dims.padL}
                      y1={y}
                      x2={dims.w - dims.padR}
                      y2={y}
                      stroke="#EEF2F7"
                      strokeWidth="1"
                    />
                    <text x={dims.padL - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#111827">
                      {step < 1 ? Number(v).toFixed(1) : Number(v).toFixed(0)}
                    </text>
                  </g>
                );
              })}

              {/* axis */}
              <line x1={dims.padL} y1={dims.padT} x2={dims.padL} y2={dims.h - dims.padB} stroke="#E5E7EB" />
              <line
                x1={dims.padL}
                y1={dims.h - dims.padB}
                x2={dims.w - dims.padR}
                y2={dims.h - dims.padB}
                stroke="#E5E7EB"
              />

              {/* area + line */}
              <polygon points={area} fill={`url(#fill_${title.replace(/\s+/g, "_")})`} />
              <polyline fill="none" stroke={color} strokeWidth="2.6" points={polyline} />

              {/* dots */}
              {mapped.map((p) => (
                <g key={p.id || p.x}>
                  <circle cx={p.sx} cy={p.sy} r="4" fill={color} stroke="white" strokeWidth="2" />
                </g>
              ))}

              {/* x labels */}
              {xTickIdx.map((i) => {
                const p = mapped[i];
                return (
                  <text
                    key={p.id}
                    x={p.sx}
                    y={dims.h - 12}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#111827"
                  >
                    {p.axisLabel}
                  </text>
                );
              })}
            </svg>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-black/70">
            <span>
              Mín:{" "}
              <span className="font-semibold text-black">
                {Math.min(...points.map((p) => p.y)).toFixed(1)}
                {unit}
              </span>
            </span>
            <span>
              Máx:{" "}
              <span className="font-semibold text-black">
                {Math.max(...points.map((p) => p.y)).toFixed(1)}
                {unit}
              </span>
            </span>
          </div>
        </>
      )}
    </div>
  );
};

const Field = ({ label, value, onChange, placeholder }) => (
  <label className="block">
    <span className="text-sm font-medium text-black">{label}</span>
    <input
      type="number"
      step="0.1"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-black shadow-sm outline-none transition focus:border-[#0D1B2A] focus:ring-2 focus:ring-[#0D1B2A]/20"
    />
  </label>
);

/* ---------------- Page ---------------- */

const ProgressPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [range, setRange] = useState("30d");

  const [checkinsAll, setCheckinsAll] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorData, setErrorData] = useState("");

  const [openCreate, setOpenCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errSave, setErrSave] = useState("");

  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");

  const [openEdit, setOpenEdit] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [errEdit, setErrEdit] = useState("");

  const [deletingId, setDeletingId] = useState(null);

  const todayKey = useMemo(() => dayKeyLocal(new Date()), []);
  const rowDayKey = (r) => dayKeyLocal(r?.created_at);

  const todayRow = useMemo(() => {
    if (!checkinsAll?.length) return null;
    for (let i = checkinsAll.length - 1; i >= 0; i--) {
      if (rowDayKey(checkinsAll[i]) === todayKey) return checkinsAll[i];
    }
    return null;
  }, [checkinsAll, todayKey]);

  const editedToday = useMemo(() => {
    if (!todayRow) return false;
    // last_edit_date viene del SQL opcional; si no existe, el UI igualmente limita a 1 edición por sesión
    const v = todayRow.last_edit_date;
    if (!v) return false;
    return String(v) === todayKey;
  }, [todayRow, todayKey]);

  const cutoffMs = useMemo(() => getCutoffMs(range), [range]);

  const checkinsInRange = useMemo(() => {
    if (!cutoffMs) return checkinsAll;
    return (checkinsAll || []).filter((r) => toDate(r.created_at).getTime() >= cutoffMs);
  }, [checkinsAll, cutoffMs]);

  const latest = useMemo(() => {
    if (!checkinsAll.length) return null;
    return checkinsAll[checkinsAll.length - 1];
  }, [checkinsAll]);

  const weightSeries = useMemo(() => buildSeries(checkinsInRange, "weight"), [checkinsInRange]);
  const measuresAvgSeries = useMemo(() => buildDerivedSeries(checkinsInRange, avgMeasurements, "m"), [checkinsInRange]);

  const deltas = useMemo(() => {
    if (!latest) return { w7: null, w30: null, m7: null, m30: null };

    const wNow = safeNum(latest.weight);
    const mNow = avgMeasurements(latest);

    const bW7 = findBaselineForDelta(checkinsAll, "weight", 7);
    const bW30 = findBaselineForDelta(checkinsAll, "weight", 30);

    const bM7 = findBaselineForDelta(checkinsAll, (r) => avgMeasurements(r), 7);
    const bM30 = findBaselineForDelta(checkinsAll, (r) => avgMeasurements(r), 30);

    return {
      w7: wNow === null || bW7 === null ? null : wNow - bW7,
      w30: wNow === null || bW30 === null ? null : wNow - bW30,
      m7: mNow === null || bM7 === null ? null : mNow - bM7,
      m30: mNow === null || bM30 === null ? null : mNow - bM30,
    };
  }, [latest, checkinsAll]);

  const resetCreate = () => {
    setWeight("");
    setWaist("");
    setHip("");
    setErrSave("");
  };

  const resetEdit = () => {
    setEditRow(null);
    setErrEdit("");
  };

  const selectCheckinsSafe = async () => {
    // Intentamos traer last_edit_date si existe. Si no, hacemos fallback sin romper.
    const base = supabase.from("checkins");
    const attempt = await base
      .select("id, created_at, weight, waist_measurement, hip_measurement, last_edit_date")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (!attempt.error) return attempt;

    const msg = String(attempt.error?.message || "");
    if (msg.toLowerCase().includes("last_edit_date") && msg.toLowerCase().includes("does not exist")) {
      return await supabase
        .from("checkins")
        .select("id, created_at, weight, waist_measurement, hip_measurement")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
    }

    return attempt;
  };

  const fetchCheckins = async () => {
    if (!user?.id) return;
    setLoadingData(true);
    setErrorData("");

    const { data, error } = await selectCheckinsSafe();

    setLoadingData(false);

    if (error) {
      setErrorData(error.message);
      return;
    }

    setCheckinsAll((data || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
  };

  useEffect(() => {
    fetchCheckins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const openEditFor = (row) => {
    if (!row) return;
    setEditRow({
      ...row,
      weight: row.weight ?? "",
      waist_measurement: row.waist_measurement ?? "",
      hip_measurement: row.hip_measurement ?? "",
    });
    setErrEdit("");
    setOpenEdit(true);
  };

  const handleSave = async () => {
    if (!user?.id) return;

    // Hard rule: 1 registro por día (UI)
    if (todayRow) {
      toast({
        title: "Ya registraste hoy",
        description: editedToday
          ? "Solo puedes editar una vez al día."
          : "Puedes editar el registro de hoy si necesitas corregir un valor.",
      });
      if (!editedToday) openEditFor(todayRow);
      return;
    }

    const w = weight === "" ? null : Number(weight);
    const wa = waist === "" ? null : Number(waist);
    const h = hip === "" ? null : Number(hip);

    if ((weight !== "" && Number.isNaN(w)) || (waist !== "" && Number.isNaN(wa)) || (hip !== "" && Number.isNaN(h))) {
      setErrSave("Revisa los valores: tienen que ser números.");
      return;
    }

    setSaving(true);
    setErrSave("");

    const payload = {
      user_id: user.id,
      weight: w,
      waist_measurement: wa,
      hip_measurement: h,
    };

    const { error } = await supabase.from("checkins").insert([payload]);

    setSaving(false);

    if (error) {
      const msg = String(error.message || "");
      // Si ya existe registro (por constraint), guía al usuario
      if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("unique")) {
        toast({
          title: "Máximo 1 registro por día",
          description: "Ya hay un registro para hoy. Edita el de hoy si necesitas corregirlo.",
        });
        await fetchCheckins();
        return;
      }
      setErrSave(msg);
      return;
    }

    await fetchCheckins();
    toast({ title: "Registro guardado", description: "Tu progreso se actualizó correctamente." });
    resetCreate();
    setOpenCreate(false);
  };

  const handleEditSave = async () => {
    if (!editRow?.id) return;

    // Solo permitimos editar el registro del día actual (y una vez)
    if (rowDayKey(editRow) !== todayKey) {
      toast({
        title: "Edición no disponible",
        description: "Solo puedes corregir el registro del día de hoy.",
      });
      return;
    }

    if (editedToday) {
      toast({
        title: "Límite alcanzado",
        description: "Solo puedes editar tu registro una vez al día.",
      });
      return;
    }

    const w = editRow.weight === "" ? null : Number(editRow.weight);
    const wa = editRow.waist_measurement === "" ? null : Number(editRow.waist_measurement);
    const h = editRow.hip_measurement === "" ? null : Number(editRow.hip_measurement);

    if (
      (editRow.weight !== "" && Number.isNaN(w)) ||
      (editRow.waist_measurement !== "" && Number.isNaN(wa)) ||
      (editRow.hip_measurement !== "" && Number.isNaN(h))
    ) {
      setErrEdit("Revisa los valores: tienen que ser números.");
      return;
    }

    setEditSaving(true);
    setErrEdit("");

    const { error } = await supabase
      .from("checkins")
      .update({
        weight: w,
        waist_measurement: wa,
        hip_measurement: h,
      })
      .eq("id", editRow.id);

    setEditSaving(false);

    if (error) {
      const msg = String(error.message || "");
      setErrEdit(msg);
      toast({ title: "No se pudo guardar", description: msg });
      return;
    }

    await fetchCheckins();

    toast({ title: "Cambios guardados", description: "Registro actualizado correctamente." });
    resetEdit();
    setOpenEdit(false);
  };

  const handleDelete = async (id) => {
    if (!id) return;
    // Solo borrar hoy (para evitar borrar historial accidentalmente)
    const row = checkinsAll.find((r) => r.id === id);
    if (!row || rowDayKey(row) !== todayKey) {
      toast({
        title: "Acción no disponible",
        description: "Solo puedes borrar el registro del día de hoy.",
      });
      return;
    }

    setDeletingId(id);

    const { error } = await supabase.from("checkins").delete().eq("id", id);

    setDeletingId(null);

    if (error) {
      toast({ title: "No se pudo borrar", description: error.message });
      return;
    }

    setCheckinsAll((prev) => (prev || []).filter((r) => r.id !== id));
    toast({ title: "Registro eliminado", description: "Se eliminó el registro de hoy." });
  };

  const recommended = "Recomendado: 1–2 registros semanales";
  const rules = "Máximo 1 registro al día";

  return (
    <>
      <Helmet>
        <title>Progreso | Metafit</title>
      </Helmet>

      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-black">Mi Progreso</h1>
            {latest ? (
              <p className="mt-1 text-sm text-black/70">
                Último registro: <span className="font-semibold text-black">{formatLongDate(latest.created_at)}</span>
              </p>
            ) : (
              <p className="mt-1 text-sm text-black/70">Aún no tienes registros. Empieza con un primer registro.</p>
            )}

            <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-black">
              <Info size={16} className="text-black/70" />
              <span className="font-medium">{rules}</span>
              <span className="text-black/70">· {recommended}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-lg" onClick={fetchCheckins}>
              <RefreshCw size={16} className="mr-2" />
              Actualizar
            </Button>

            {!todayRow ? (
              <Dialog
                open={openCreate}
                onOpenChange={(v) => {
                  setOpenCreate(v);
                  if (!v) resetCreate();
                }}
              >
                <DialogTrigger asChild>
                  <Button className="bg-[#0D1B2A] text-white hover:bg-[#15263F] shadow-sm">
                    Nuevo Registro
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-lg rounded-2xl border border-gray-200 bg-white p-0 shadow-xl">
                  <DialogHeader className="px-6 pt-6 pb-3 border-b border-gray-100">
                    <DialogTitle className="text-lg font-bold text-black flex items-center justify-between">
                      Nuevo registro
                      <DialogClose asChild>
                        <button className="p-1 rounded hover:bg-gray-100 text-black/70">
                          <span className="sr-only">Cerrar</span>
                          <X size={18} />
                        </button>
                      </DialogClose>
                    </DialogTitle>
                    <p className="text-sm text-black/70 mt-1">
                      Registra tu progreso de hoy. {rules}.
                    </p>
                  </DialogHeader>

                  <div className="px-6 py-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Field label="Peso (kg)" value={weight} onChange={setWeight} placeholder="Ej: 82.5" />
                      <Field label="Cintura (cm)" value={waist} onChange={setWaist} placeholder="Ej: 78" />
                      <Field label="Cadera (cm)" value={hip} onChange={setHip} placeholder="Ej: 96" />
                    </div>

                    {errSave ? (
                      <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
                        {errSave}
                      </div>
                    ) : null}
                  </div>

                  <div className="px-6 pb-6 flex items-center justify-end gap-2">
                    <DialogClose asChild>
                      <Button variant="outline" className="rounded-lg">
                        Cancelar
                      </Button>
                    </DialogClose>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-[#0D1B2A] text-white hover:bg-[#15263F]"
                    >
                      {saving ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Button
                className="bg-[#0D1B2A] text-white hover:bg-[#15263F]"
                onClick={() => {
                  if (editedToday) {
                    toast({ title: "Límite alcanzado", description: "Solo puedes editar una vez al día." });
                    return;
                  }
                  openEditFor(todayRow);
                }}
              >
                Editar registro de hoy
              </Button>
            )}
          </div>
        </div>

        {errorData ? (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-4 text-sm">{errorData}</div>
        ) : null}

        {/* Range */}
        <div className="flex flex-wrap items-center gap-2">
          <RangePill active={range === "7d"} onClick={() => setRange("7d")}>
            7 días
          </RangePill>
          <RangePill active={range === "30d"} onClick={() => setRange("30d")}>
            30 días
          </RangePill>
          <RangePill active={range === "90d"} onClick={() => setRange("90d")}>
            90 días
          </RangePill>
          <RangePill active={range === "all"} onClick={() => setRange("all")}>
            Todo
          </RangePill>

          <div className="ml-auto text-sm text-black/70">
            Mostrando: <span className="font-semibold text-black">{checkinsInRange.length}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            title="Peso actual"
            value={latest?.weight == null ? "—" : `${Number(latest.weight).toFixed(1)} kg`}
            sub={`7d: ${fmtDelta(deltas.w7, " kg")} · 30d: ${fmtDelta(deltas.w30, " kg")}`}
          />
          <StatCard
            title="Media de medidas"
            value={latest ? (avgMeasurements(latest) == null ? "—" : `${avgMeasurements(latest).toFixed(1)} cm`) : "—"}
            sub={`7d: ${fmtDelta(deltas.m7, " cm")} · 30d: ${fmtDelta(deltas.m30, " cm")}`}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <LineChart
            title="Evolución de peso"
            icon={<TrendingUp size={20} className="text-black" />}
            series={weightSeries}
            color="#0D1B2A"
            unit=" kg"
            yLabel="kg"
          />
          <LineChart
            title="Media de medidas corporales"
            icon={<TrendingUp size={20} className="text-black" />}
            series={measuresAvgSeries}
            color="#2563eb"
            unit=" cm"
            yLabel="cm"
          />
        </div>

        {/* History */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="font-bold text-black">Historial</h3>
            <p className="text-sm text-black/70">
              Recuerda: {recommended}.
            </p>
          </div>

          {loadingData ? (
            <div className="py-10 text-center text-black/70 text-sm">Cargando…</div>
          ) : !checkinsInRange.length ? (
            <div className="py-10 text-center text-black/70 text-sm">Aún no hay registros.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-black/70 border-b">
                    <th className="py-2 pr-4">Fecha</th>
                    <th className="py-2 pr-4">Peso</th>
                    <th className="py-2 pr-4">Media medidas</th>
                    <th className="py-2 pr-4">Cintura</th>
                    <th className="py-2 pr-4">Cadera</th>
                    <th className="py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {[...checkinsInRange].reverse().map((r) => {
                    const isToday = rowDayKey(r) === todayKey;
                    const avg = avgMeasurements(r);
                    return (
                      <tr key={r.id} className="border-b last:border-b-0">
                        <td className="py-3 pr-4 text-black">{formatLongDate(r.created_at)}</td>
                        <td className="py-3 pr-4 text-black">{r.weight == null ? "—" : `${Number(r.weight).toFixed(1)} kg`}</td>
                        <td className="py-3 pr-4 text-black">{avg == null ? "—" : `${avg.toFixed(1)} cm`}</td>
                        <td className="py-3 pr-4 text-black">
                          {r.waist_measurement == null ? "—" : `${Number(r.waist_measurement).toFixed(1)} cm`}
                        </td>
                        <td className="py-3 pr-4 text-black">
                          {r.hip_measurement == null ? "—" : `${Number(r.hip_measurement).toFixed(1)} cm`}
                        </td>
                        <td className="py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              variant="outline"
                              className="rounded-lg"
                              disabled={!isToday || editedToday}
                              onClick={() => openEditFor(r)}
                              title={!isToday ? "Solo puedes editar el registro de hoy" : editedToday ? "Solo 1 edición al día" : "Editar"}
                            >
                              <Pencil size={16} />
                            </Button>
                            <Button
                              variant="outline"
                              className="rounded-lg"
                              disabled={!isToday || deletingId === r.id}
                              onClick={() => handleDelete(r.id)}
                              title={!isToday ? "Solo puedes borrar el registro de hoy" : "Borrar"}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog
          open={openEdit}
          onOpenChange={(v) => {
            setOpenEdit(v);
            if (!v) resetEdit();
          }}
        >
          <DialogContent className="max-w-lg rounded-2xl border border-gray-200 bg-white p-0 shadow-xl">
            <DialogHeader className="px-6 pt-6 pb-3 border-b border-gray-100">
              <DialogTitle className="text-lg font-bold text-black flex items-center justify-between">
                Editar registro
                <DialogClose asChild>
                  <button className="p-1 rounded hover:bg-gray-100 text-black/70">
                    <span className="sr-only">Cerrar</span>
                    <X size={18} />
                  </button>
                </DialogClose>
              </DialogTitle>
              <p className="text-sm text-black/70 mt-1">
                Puedes corregir el registro de hoy. Límite: 1 edición al día.
              </p>
            </DialogHeader>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field
                  label="Peso (kg)"
                  value={editRow?.weight ?? ""}
                  onChange={(v) => setEditRow((p) => ({ ...p, weight: v }))}
                  placeholder="Ej: 82.5"
                />
                <Field
                  label="Cintura (cm)"
                  value={editRow?.waist_measurement ?? ""}
                  onChange={(v) => setEditRow((p) => ({ ...p, waist_measurement: v }))}
                  placeholder="Ej: 78"
                />
                <Field
                  label="Cadera (cm)"
                  value={editRow?.hip_measurement ?? ""}
                  onChange={(v) => setEditRow((p) => ({ ...p, hip_measurement: v }))}
                  placeholder="Ej: 96"
                />
              </div>

              {errEdit ? (
                <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
                  {errEdit}
                </div>
              ) : null}
            </div>

            <div className="px-6 pb-6 flex items-center justify-end gap-2">
              <DialogClose asChild>
                <Button variant="outline" className="rounded-lg">
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                onClick={handleEditSave}
                disabled={editSaving || editedToday}
                className="bg-[#0D1B2A] text-white hover:bg-[#15263F]"
              >
                {editSaving ? "Guardando..." : editedToday ? "Editado hoy" : "Guardar cambios"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default ProgressPage;