import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import {
  Dumbbell,
  Utensils,
  LineChart,
  MessageSquare,
  Library,
  Bell,
  Calendar,
  ArrowRight,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Activity,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/lib/customSupabaseClient";

const msInDay = 24 * 60 * 60 * 1000;

const toDate = (iso) => {
  try {
    return new Date(iso);
  } catch {
    return null;
  }
};

const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const formatDateShortEs = (iso) => {
  const d = toDate(iso);
  if (!d) return "—";
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
};

const formatDateLongEs = (iso) => {
  const d = toDate(iso);
  if (!d) return "—";
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
};

const daysAgo = (iso) => {
  const d = toDate(iso);
  if (!d) return null;
  return Math.floor((Date.now() - d.getTime()) / msInDay);
};

const normalizeText = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const getTodayNameEs = () => {
  const names = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  return names[new Date().getDay()];
};

const findBaselineOlderThanDays = (sortedDesc, fieldName, days) => {
  const cutoff = Date.now() - days * msInDay;
  for (const r of sortedDesc) {
    const t = toDate(r.created_at)?.getTime?.();
    const val = safeNum(r?.[fieldName]);
    if (!t || val === null) continue;
    if (t <= cutoff) return r;
  }
  return null;
};

const nextSundayAtNoon = () => {
  const now = new Date();
  const day = now.getDay();
  const daysUntilSunday = (7 - day) % 7;
  const target = new Date(now);
  target.setHours(12, 0, 0, 0);
  target.setDate(now.getDate() + daysUntilSunday);
  if (daysUntilSunday === 0 && now.getTime() > target.getTime()) target.setDate(target.getDate() + 7);
  return target;
};

const diffDaysFromNow = (future) => Math.ceil((future.getTime() - Date.now()) / msInDay);

const StatTile = ({ icon: Icon, title, value, subtitle, tone = "slate" }) => {
  const toneClasses = {
    slate: "bg-white border-gray-200",
    blue: "bg-blue-50 border-blue-100",
    amber: "bg-amber-50 border-amber-100",
    emerald: "bg-emerald-50 border-emerald-100",
    violet: "bg-violet-50 border-violet-100",
  };

  return (
    <div className={["rounded-xl border p-4 shadow-sm", toneClasses[tone] || toneClasses.slate].join(" ")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-[#0D1B2A]/70 font-semibold">{title}</p>
          <p className="mt-1 text-xl font-bold text-[#0D1B2A] leading-none">{value}</p>
          {subtitle ? <p className="mt-1 text-xs text-[#0D1B2A]/70">{subtitle}</p> : null}
        </div>
        {Icon ? (
          <div className="h-9 w-9 rounded-lg bg-white/70 border border-black/5 flex items-center justify-center">
            <Icon size={18} className="text-[#0D1B2A]" />
          </div>
        ) : null}
      </div>
    </div>
  );
};

const ActionTile = ({ icon: Icon, title, subtitle, to, cta }) => (
  <Link
    to={to}
    className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-bold text-[#0D1B2A]">{title}</p>
        <p className="text-sm text-[#0D1B2A]/70 mt-0.5">{subtitle}</p>
        <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#0D1B2A]">
          {cta} <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
      {Icon ? (
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-black/5 to-black/0 border border-black/5 flex items-center justify-center">
          <Icon size={20} className="text-[#0D1B2A]" />
        </div>
      ) : null}
    </div>
  </Link>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorBanner, setErrorBanner] = useState("");

  const [profile, setProfile] = useState(null);
  const [nutritionPlan, setNutritionPlan] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [routines, setRoutines] = useState([]);

  const displayName = useMemo(() => {
    const fromProfile = profile?.full_name || profile?.name || profile?.username;
    if (fromProfile) return String(fromProfile).trim();

    const meta = user?.user_metadata || {};
    const name =
      meta?.full_name ||
      meta?.name ||
      meta?.first_name ||
      meta?.username ||
      (user?.email ? user.email.split("@")[0] : null);

    return name ? String(name).trim().replace(/^\w/, (c) => c.toUpperCase()) : "Atleta";
  }, [profile, user]);

  const fetchDashboard = useCallback(async () => {
    if (!user?.id) return;

    setErrorBanner("");

    const profileReq = supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

    const planReq = supabase
      .from("nutrition_plans")
      .select("id, user_id, calories, protein, carbs, fats, coach_notes, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1);

    const checkinsReq = supabase
      .from("checkins")
      .select("id, user_id, created_at, weight, waist_measurement, hip_measurement, sleep_quality, energy_level, adherence_score, comments")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(250);

    const routinesReq = supabase
      .from("routines")
      .select("id, user_id, day_name, exercises, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    const [
      { data: profileData, error: profileErr },
      { data: planData, error: planErr },
      { data: checkinsData, error: checkinsErr },
      { data: routinesData, error: routinesErr },
    ] = await Promise.all([profileReq, planReq, checkinsReq, routinesReq]);

    if (profileErr) setErrorBanner(`No se pudo cargar tu perfil. (${profileErr.message})`);
    else setProfile(profileData ?? null);

    if (planErr) {
      setErrorBanner((p) =>
        p ? `${p} · No se pudo cargar tu plan de nutrición. (${planErr.message})` : `No se pudo cargar tu plan de nutrición. (${planErr.message})`
      );
      setNutritionPlan(null);
    } else setNutritionPlan(planData?.[0] ?? null);

    if (checkinsErr) {
      setErrorBanner((p) =>
        p ? `${p} · No se pudieron cargar tus check-ins. (${checkinsErr.message})` : `No se pudieron cargar tus check-ins. (${checkinsErr.message})`
      );
      setCheckins([]);
    } else setCheckins(checkinsData ?? []);

    if (routinesErr) {
      setErrorBanner((p) =>
        p ? `${p} · No se pudieron cargar tus rutinas. (${routinesErr.message})` : `No se pudieron cargar tus rutinas. (${routinesErr.message})`
      );
      setRoutines([]);
    } else setRoutines(routinesData ?? []);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const run = async () => {
      setLoading(true);
      try {
        await fetchDashboard();
      } catch (e) {
        const msg = e?.message ?? "Error cargando dashboard.";
        setErrorBanner(msg);
        toast({ variant: "destructive", title: "Error", description: msg });
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [user?.id, fetchDashboard, toast]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchDashboard();
      toast({ title: "Actualizado", description: "Tu dashboard está al día." });
    } catch (e) {
      const msg = e?.message ?? "No se pudo actualizar.";
      setErrorBanner(msg);
      toast({ variant: "destructive", title: "Error", description: msg });
    } finally {
      setRefreshing(false);
    }
  };

  const lastCheckin = checkins?.[0] ?? null;

  const currentWeight = useMemo(() => safeNum(lastCheckin?.weight), [lastCheckin]);

  const baseline7 = useMemo(() => findBaselineOlderThanDays(checkins, "weight", 7), [checkins]);

  const weeklyDelta = useMemo(() => {
    const wNow = safeNum(lastCheckin?.weight);
    const wBase = safeNum(baseline7?.weight);
    if (wNow === null || wBase === null) return null;
    return wNow - wBase;
  }, [lastCheckin, baseline7]);

  const weeklyDeltaLabel = useMemo(() => {
    if (weeklyDelta === null) return "—";
    const sign = weeklyDelta > 0 ? "+" : "";
    return `${sign}${weeklyDelta.toFixed(1)} kg`;
  }, [weeklyDelta]);

  const weeklyDeltaColor = useMemo(() => {
    if (weeklyDelta === null) return "text-gray-500";
    if (weeklyDelta < 0) return "text-green-600";
    if (weeklyDelta > 0) return "text-orange-600";
    return "text-gray-700";
  }, [weeklyDelta]);

  const checkinsLast30d = useMemo(() => {
    const cutoff = Date.now() - 30 * msInDay;
    return (checkins ?? []).filter((r) => {
      const t = toDate(r.created_at)?.getTime?.();
      return t && t >= cutoff;
    }).length;
  }, [checkins]);

  const adherenceAvg7d = useMemo(() => {
    const cutoff = Date.now() - 7 * msInDay;
    const vals = (checkins ?? [])
      .filter((r) => {
        const t = toDate(r.created_at)?.getTime?.();
        return t && t >= cutoff;
      })
      .map((r) => safeNum(r?.adherence_score))
      .filter((v) => v !== null);

    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [checkins]);

  const lastCheckinDaysAgo = useMemo(() => (lastCheckin?.created_at ? daysAgo(lastCheckin.created_at) : null), [lastCheckin]);

  const isCheckinDue = useMemo(() => {
    if (!lastCheckin?.created_at) return true;
    const d = daysAgo(lastCheckin.created_at);
    if (d === null) return false;
    return d >= 7;
  }, [lastCheckin]);

  const nutrition = useMemo(() => {
    const calories = safeNum(nutritionPlan?.calories);
    const protein = safeNum(nutritionPlan?.protein);
    const carbs = safeNum(nutritionPlan?.carbs);
    const fats = safeNum(nutritionPlan?.fats);
    return {
      calories: calories ?? 2600,
      protein: protein ?? 180,
      carbs: carbs ?? 320,
      fats: fats ?? 70,
      updatedAt: nutritionPlan?.updated_at ?? null,
      notes: nutritionPlan?.coach_notes ?? "",
    };
  }, [nutritionPlan]);

  const todayRoutine = useMemo(() => {
    const today = normalizeText(getTodayNameEs());
    // si guardás el nombre en español, perfecto. Si lo guardás en inglés, luego lo ajustamos.
    return (routines ?? []).find((r) => normalizeText(r?.day_name) === today) ?? null;
  }, [routines]);

  const routineDaysCount = useMemo(() => {
    const set = new Set((routines ?? []).map((r) => normalizeText(r?.day_name)).filter(Boolean));
    return set.size;
  }, [routines]);

  const nextReview = useMemo(() => nextSundayAtNoon(), []);
  const daysToReview = useMemo(() => diffDaysFromNow(nextReview), [nextReview]);

  const todayLabel = useMemo(() => {
    try {
      const w = new Date().toLocaleDateString("es-ES", { weekday: "long" });
      return w ? w.charAt(0).toUpperCase() + w.slice(1) : "Hoy";
    } catch {
      return "Hoy";
    }
  }, []);

  const todayExercisesCount = useMemo(() => {
    const ex = todayRoutine?.exercises;
    if (!ex) return 0;
    if (Array.isArray(ex)) return ex.length;
    if (typeof ex === "object") return Object.keys(ex).length;
    return 0;
  }, [todayRoutine]);

  const nutritionUpdatedDays = useMemo(() => (nutrition.updatedAt ? daysAgo(nutrition.updatedAt) : null), [nutrition.updatedAt]);

  return (
    <>
      <Helmet>
        <title>Dashboard - Metafit App</title>
      </Helmet>

      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#0D1B2A]">Hola, {displayName}</h1>
            <p className="text-[#0D1B2A]/70">{loading ? "Cargando tu resumen…" : "Resumen con datos reales de tu cuenta."}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1 text-xs font-semibold text-[#0D1B2A] shadow-sm">
                <Sparkles size={14} /> Metafit Client Area
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-semibold text-blue-900">
                <Calendar size={14} /> {todayLabel}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                <ShieldCheck size={14} /> Acceso exclusivo
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Button variant="outline" className="w-full sm:w-auto flex items-center gap-2" onClick={onRefresh} disabled={loading || refreshing}>
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Actualizando…" : "Actualizar"}
            </Button>

            <div
              className={[
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border w-full sm:w-auto",
                isCheckinDue ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-100",
              ].join(" ")}
            >
              <Bell size={16} />
              <span>{isCheckinDue ? "Check-in semanal pendiente" : "Todo al día"}</span>
            </div>
          </div>
        </div>

        {/* Hero / Highlights */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-slate-50" />
          <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-blue-100/50 blur-3xl" />
          <div className="absolute -bottom-28 -left-28 h-56 w-56 rounded-full bg-slate-200/40 blur-3xl" />

          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-semibold text-[#0D1B2A]">
                  <Sparkles size={14} className="text-[#0D1B2A]" />
                  <span>Área exclusiva Metafit</span>
                  <span className="text-[#0D1B2A]/40">•</span>
                  <span>{todayLabel}</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-[#0D1B2A]">Tu panel, en un vistazo</p>
                <h2 className="mt-1 text-xl sm:text-2xl font-bold text-[#0D1B2A]">
                  {isCheckinDue ? "Hoy toca ponerse al día" : "Vas genial — seguí así"}
                </h2>
                <p className="mt-2 text-sm text-[#0D1B2A]/70 max-w-2xl">
                  Encontrá tu rutina, tu plan nutricional y tu progreso en un solo lugar. Recomendación: 1–2 check-ins por semana para mantener el rumbo.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
                <ActionTile
                  icon={Dumbbell}
                  title={todayRoutine ? "Rutina de hoy" : "Ver rutina"}
                  subtitle={todayRoutine ? `${todayExercisesCount || ""} ejercicio${todayExercisesCount === 1 ? "" : "s"} · ${todayRoutine.day_name}` : "Tu rutina semanal"}
                  to="/app/entrenamiento"
                  cta="Abrir"
                />
                <ActionTile
                  icon={Utensils}
                  title="Nutrición"
                  subtitle={nutritionUpdatedDays !== null ? `Actualizado hace ${nutritionUpdatedDays} día${nutritionUpdatedDays === 1 ? "" : "s"}` : "Plan en preparación"}
                  to="/app/nutricion"
                  cta="Ver plan"
                />
                <ActionTile
                  icon={TrendingUp}
                  title="Progreso"
                  subtitle={lastCheckin?.created_at ? `Último registro: ${formatDateShortEs(lastCheckin.created_at)}` : "Sin registros"}
                  to="/app/progreso"
                  cta={lastCheckin ? "Abrir" : "Registrar"}
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <StatTile
                icon={Activity}
                title="Estado"
                value={isCheckinDue ? "Check-in pendiente" : "Todo al día"}
                subtitle={isCheckinDue ? "Te recomendamos completar el semanal" : "Mantené la consistencia"}
                tone={isCheckinDue ? "amber" : "emerald"}
              />
              <StatTile
                icon={Dumbbell}
                title="Rutina"
                value={todayRoutine ? `${todayExercisesCount} ejercicio${todayExercisesCount === 1 ? "" : "s"}` : "Sin rutina"}
                subtitle={todayRoutine ? `Hoy: ${todayRoutine.day_name}` : "Tu coach la cargará pronto"}
                tone="blue"
              />
              <StatTile
                icon={Utensils}
                title="Calorías"
                value={`${nutrition.calories} kcal`}
                subtitle={`P ${nutrition.protein}g · C ${nutrition.carbs}g · G ${nutrition.fats}g`}
                tone="amber"
              />
              <StatTile
                icon={TrendingUp}
                title="Peso"
                value={currentWeight !== null ? `${currentWeight.toFixed(1)} kg` : "—"}
                subtitle={weeklyDelta !== null ? `7 días: ${weeklyDeltaLabel}` : "Registrá tu check-in"}
                tone="violet"
              />
            </div>
          </div>
        </div>

        {/* Error banner */}
        {errorBanner ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="font-semibold">Aviso:</p>
              <p className="text-red-700">{errorBanner}</p>
              <Button variant="outline" className="border-red-200 text-red-800 hover:bg-red-100" onClick={onRefresh}>
                Reintentar
              </Button>
            </div>
          </div>
        ) : null}

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Training */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0D1B2A] flex items-center gap-2">
                <Dumbbell className="text-blue-600" size={20} /> Entrenamiento
              </h3>
              <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded font-bold">
                {routineDaysCount ? `${routineDaysCount} días` : "SIN PLAN"}
              </span>
            </div>

            <div className="flex-1 mb-6">
              <p className="text-lg font-bold text-gray-800">{todayRoutine ? "Rutina de hoy lista" : "Tu rutina semanal"}</p>
              <p className="text-sm text-gray-500">
                {todayRoutine ? `Hoy: ${todayRoutine.day_name}` : routineDaysCount ? "Entrá a ver tu plan y marcá el entreno." : "Todavía no tenés rutinas cargadas."}
              </p>
            </div>

            <Button asChild className="w-full bg-[#0D1B2A] text-white hover:bg-[#1a2f45]">
              <Link to="/app/entrenamiento">Ver Rutina</Link>
            </Button>
          </div>

          {/* Nutrition */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0D1B2A] flex items-center gap-2">
                <Utensils className="text-orange-500" size={20} /> Nutrición
              </h3>
              <span className="text-xs text-gray-400">{nutrition.updatedAt ? `Actualizado ${formatDateShortEs(nutrition.updatedAt)}` : "Sin fecha"}</span>
            </div>

            <div className="flex-1 mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#0D1B2A]">{nutrition.calories}</span>
                <span className="text-gray-500">kcal</span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">Prote</p>
                  <p className="font-bold text-gray-800">{nutrition.protein}g</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">Carbs</p>
                  <p className="font-bold text-gray-800">{nutrition.carbs}g</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">Grasas</p>
                  <p className="font-bold text-gray-800">{nutrition.fats}g</p>
                </div>
              </div>

              {nutrition.notes ? (
                <div className="mt-4 rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <p className="text-xs font-bold text-gray-700 mb-1">Notas del coach</p>
                  <p className="text-xs text-gray-600 line-clamp-3">{nutrition.notes}</p>
                </div>
              ) : null}
            </div>

            <Button asChild variant="outline" className="w-full">
              <Link to="/app/nutricion">Ver Plan</Link>
            </Button>
          </div>

          {/* Progress */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0D1B2A] flex items-center gap-2">
                <LineChart className="text-purple-500" size={20} /> Progreso
              </h3>
              <span className="text-xs text-gray-400">{lastCheckin?.created_at ? `Último: ${formatDateShortEs(lastCheckin.created_at)}` : "Sin registros"}</span>
            </div>

            <div className="flex-1 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Peso actual</span>
                <span className="font-bold text-[#0D1B2A]">{currentWeight !== null ? `${currentWeight.toFixed(1)} kg` : "—"}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Cambio 7 días</span>
                <span className={`font-bold ${weeklyDeltaColor}`}>{weeklyDeltaLabel}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Check-ins (30 días)</span>
                <span className="font-bold text-blue-600">{checkinsLast30d}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Adherencia 7 días</span>
                <span className="font-bold text-gray-800">{adherenceAvg7d !== null ? `${adherenceAvg7d.toFixed(1)}/10` : "—"}</span>
              </div>

              <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                {lastCheckin?.created_at ? (
                  <>
                    Último check-in: <span className="font-semibold">{formatDateLongEs(lastCheckin.created_at)}</span>
                    {typeof lastCheckinDaysAgo === "number" ? <span> · hace {lastCheckinDaysAgo} día{lastCheckinDaysAgo === 1 ? "" : "s"}</span> : null}
                  </>
                ) : (
                  <>Todavía no registraste un check-in. Arrancá hoy.</>
                )}
              </div>
            </div>

            <Button asChild variant="outline" className="w-full">
              <Link to="/app/progreso">{lastCheckin ? "Ver progreso" : "Registrar primer check-in"}</Link>
            </Button>
          </div>
        </div>

        {/* Quick Access */}
        <div>
          <h2 className="text-lg font-bold text-[#0D1B2A] mb-4">Acceso rápido</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[
              { label: "Entrenar", icon: Dumbbell, path: "/app/entrenamiento", color: "text-blue-600" },
              { label: "Nutrición", icon: Utensils, path: "/app/nutricion", color: "text-orange-500" },
              { label: "Progreso", icon: LineChart, path: "/app/progreso", color: "text-purple-600" },
              { label: "Chat", icon: MessageSquare, path: "/app/chat", color: "text-green-600" },
              { label: "Recursos", icon: Library, path: "/app/recursos", color: "text-red-500" },
            ].map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all flex flex-col items-center justify-center gap-2 text-center group"
              >
                <item.icon className={`${item.color} group-hover:scale-110 transition-transform`} size={24} />
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Next Review */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-blue-900 mb-1 flex items-center gap-2">
              <Calendar size={18} /> Próxima revisión
            </h3>
            <p className="text-blue-700 text-sm">
              Ideal: completar tu check-in semanal antes del domingo 12:00.{" "}
              <span className="font-semibold">
                {daysToReview <= 0 ? "Es hoy." : `Faltan ${daysToReview} día${daysToReview === 1 ? "" : "s"}.`}
              </span>
            </p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 w-full sm:w-auto">
              <Link to="/app/progreso" className="flex items-center justify-center gap-2">
                {isCheckinDue ? "Hacer check-in" : "Ver progreso"} <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;