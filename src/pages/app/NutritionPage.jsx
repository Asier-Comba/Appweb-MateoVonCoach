import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { Utensils, BookOpen, AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/lib/customSupabaseClient";

const WEEK_DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const JS_DAY_TO_ES = { 0: "Domingo", 1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves", 5: "Viernes", 6: "Sábado" };

const WEEKLY_MENU_SLOTS = [
  { key: "desayuno", label: "Desayuno" },
  { key: "comida", label: "Comida" },
  { key: "cena", label: "Cena" },
  { key: "snack", label: "Snack" },
];

function emptyWeeklyMenu() {
  const obj = {};
  for (const d of WEEK_DAYS) {
    obj[d] = { desayuno: "", comida: "", cena: "", snack: "" };
  }
  return obj;
}

export default function NutritionPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState("");
  const [planRow, setPlanRow] = useState(null);

  const todayName = useMemo(() => JS_DAY_TO_ES[new Date().getDay()] ?? "Lunes", []);
  const [weeklyDay, setWeeklyDay] = useState(todayName);

  const weeklyMenu = useMemo(() => {
    const wm = planRow?.meal_plan?.weekly_menu;
    return wm && typeof wm === "object" ? wm : null;
  }, [planRow]);

  const todayMenu = useMemo(() => {
    if (!weeklyMenu) return null;
    const day = weeklyMenu?.[weeklyDay] ?? weeklyMenu?.[todayName] ?? null;
    return day && typeof day === "object" ? day : null;
  }, [weeklyMenu, weeklyDay, todayName]);

  const hasAnyWeeklyMenu = useMemo(() => {
    if (!weeklyMenu) return false;
    return WEEK_DAYS.some((d) => WEEKLY_MENU_SLOTS.some((s) => (weeklyMenu?.[d]?.[s.key] ?? "").trim().length > 0));
  }, [weeklyMenu]);

  const refresh = async () => {
    if (!user?.id) return;

    setLoading(true);
    setErrorBanner("");

    try {
      const { data: planData, error: planErr } = await supabase
        .from("nutrition_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (planErr) throw planErr;

      let row = planData?.[0] ?? null;

      if (!row) {
        const payload = {
          user_id: user.id,
          calories: 2600,
          protein: 180,
          carbs: 320,
          fats: 70,
          coach_notes: "",
          meal_plan: { weekly_menu: emptyWeeklyMenu() },
        };

        const { data: insData, error: insErr } = await supabase.from("nutrition_plans").insert(payload).select("*").single();
        if (insErr) throw insErr;
        row = insData;
      }

      // Asegura que exista weekly_menu (por estabilidad)
      if (!row.meal_plan || typeof row.meal_plan !== "object") {
        row.meal_plan = { weekly_menu: emptyWeeklyMenu() };
      } else if (!row.meal_plan.weekly_menu || typeof row.meal_plan.weekly_menu !== "object") {
        row.meal_plan.weekly_menu = emptyWeeklyMenu();
      }

      setPlanRow(row);
    } catch (e) {
      setErrorBanner(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Nutrición | Metafit</title>
      </Helmet>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Plan Nutricional</h1>
          <p className="text-gray-700">Tu coach define tu objetivo, macros y menú semanal.</p>
        </div>

        <Button variant="outline" onClick={refresh} className="gap-2">
          <RefreshCw size={16} />
          Actualizar
        </Button>
      </div>

      {errorBanner ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-gray-900 flex gap-2">
          <AlertCircle size={18} className="mt-0.5 text-amber-700" />
          <div>
            <p className="font-semibold">No se pudo cargar Nutrición</p>
            <p className="text-gray-900">{errorBanner}</p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Utensils className="text-orange-600" size={18} />
            <h2 className="text-lg font-bold text-gray-900">Objetivo diario</h2>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="rounded-xl bg-slate-900 p-5">
              <p className="text-sm text-slate-100">Kcal</p>
              <p className="mt-1 text-3xl font-extrabold text-white">{planRow?.calories ?? "—"}</p>
              <p className="text-xs text-slate-200">kcal/día</p>
            </div>

            <div className="rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-900">Proteína</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{planRow?.protein ?? "—"}g</p>
            </div>

            <div className="rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-900">Carbos</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{planRow?.carbs ?? "—"}g</p>
            </div>

            <div className="rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-900">Grasas</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{planRow?.fats ?? "—"}g</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-bold text-gray-900">Notas del coach</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
              {(planRow?.coach_notes ?? "").trim() ? planRow.coach_notes : "Tu coach aún no añadió notas."}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <BookOpen className="text-blue-600" size={18} />
            <h2 className="text-lg font-bold text-gray-900">Guías rápidas</h2>
          </div>

          <ul className="mt-3 space-y-2 text-sm text-gray-900">
            <li className="list-disc ml-4">Cómo contar calorías sin obsesionarse</li>
            <li className="list-disc ml-4">Guía para comer en restaurantes</li>
            <li className="list-disc ml-4">Lista de la compra básica</li>
            <li className="list-disc ml-4">Suplementación recomendada</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Menú de hoy</h2>
              <p className="text-sm text-gray-700">
                Hoy es <span className="font-semibold text-gray-900">{todayName}</span>. Tu coach puede ajustar el menú cuando lo necesite.
              </p>
            </div>

            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-900">
              {todayName}
            </span>
          </div>

          {!loading && (!weeklyMenu || !hasAnyWeeklyMenu) ? (
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-900">
              Tu coach todavía no cargó tu menú semanal.
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {WEEKLY_MENU_SLOTS.map((slot) => (
                <div key={slot.key} className="rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-bold text-gray-900">{slot.label}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-900">
                    {(todayMenu?.[slot.key] ?? "").trim() ? todayMenu?.[slot.key] : "—"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Menú semanal</h2>
              <p className="text-sm text-gray-700">Selecciona un día para ver el detalle.</p>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setWeeklyDay(todayName);
                toast({ title: "Mostrando el menú de hoy", description: todayName });
              }}
            >
              Ir a hoy
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {WEEK_DAYS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setWeeklyDay(d)}
                className={[
                  "rounded-full border px-3 py-1 text-xs font-semibold",
                  weeklyDay === d ? "border-blue-300 bg-blue-50 text-gray-900" : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50",
                ].join(" ")}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {WEEKLY_MENU_SLOTS.map((slot) => (
              <div key={slot.key} className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-bold text-gray-900">{slot.label}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-900">
                  {(weeklyMenu?.[weeklyDay]?.[slot.key] ?? "").trim() ? weeklyMenu?.[weeklyDay]?.[slot.key] : "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}