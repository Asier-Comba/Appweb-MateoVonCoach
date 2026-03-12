import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Save, RefreshCw, Plus, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/lib/customSupabaseClient";

const MEALS = [
  { key: "desayuno", label: "Desayuno" },
  { key: "comida", label: "Comida" },
  { key: "cena", label: "Cena" },
  { key: "snack", label: "Snack" },
];

function makeId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}

function toInt(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function defaultMeals() {
  return {
    desayuno: [],
    comida: [],
    cena: [],
    snack: [],
  };
}

export default function AdminNutritionTab({ selectedUser }) {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const isAdmin = String(profile?.role || "").toLowerCase() === "admin";
  const isClientSelected = String(selectedUser?.role || "").toLowerCase() === "client";

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [planId, setPlanId] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  const [form, setForm] = useState({
    calories: 2600,
    protein: 180,
    carbs: 320,
    fats: 70,
    coach_notes: "",
  });

  const [meals, setMeals] = useState(defaultMeals());

  const inputBase =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-gray-200";
  const labelBase = "text-xs font-medium text-gray-600";

  const formatDate = useCallback((iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat("es-ES", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return "";
    }
  }, []);

  const loadPlan = useCallback(async () => {
    if (!user || !selectedUser?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("nutrition_plans")
        .select("id, calories, protein, carbs, fats, coach_notes, meal_plan, updated_at")
        .eq("user_id", selectedUser.id)
        .maybeSingle();

      // supabase-js v2 doesn't always have maybeSingle in some templates; fallback:
      if (error && (error.code === "PGRST116" || error.status === 406)) {
        setPlanId(null);
        setUpdatedAt(null);
        setMeals(defaultMeals());
        return;
      }
      if (error) throw error;

      if (!data) {
        setPlanId(null);
        setUpdatedAt(null);
        setMeals(defaultMeals());
        return;
      }

      setPlanId(data.id);
      setUpdatedAt(data.updated_at || null);

      setForm({
        calories: data.calories ?? 0,
        protein: data.protein ?? 0,
        carbs: data.carbs ?? 0,
        fats: data.fats ?? 0,
        coach_notes: data.coach_notes ?? "",
      });

      const mp = data.meal_plan && typeof data.meal_plan === "object" ? data.meal_plan : {};
      const next = defaultMeals();
      for (const m of MEALS) {
        const arr = Array.isArray(mp[m.key]) ? mp[m.key] : [];
        next[m.key] = arr.map((it) => ({
          id: it?.id || makeId(),
          name: it?.name || "",
          grams: it?.grams ?? "",
        }));
      }
      setMeals(next);
    } catch (e) {
      toast({
        title: "Error cargando nutrición",
        description: e?.message || "No se pudo cargar el plan nutricional.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedUser?.id, toast, user]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const canEdit = isAdmin && isClientSelected && !!selectedUser?.id;

  const setMealRow = (mealKey, rowId, patch) => {
    setMeals((prev) => {
      const list = Array.isArray(prev?.[mealKey]) ? prev[mealKey] : [];
      return {
        ...prev,
        [mealKey]: list.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
      };
    });
  };

  const addMealRow = (mealKey) => {
    setMeals((prev) => {
      const list = Array.isArray(prev?.[mealKey]) ? prev[mealKey] : [];
      return {
        ...prev,
        [mealKey]: [...list, { id: makeId(), name: "", grams: "" }],
      };
    });
  };

  const removeMealRow = (mealKey, rowId) => {
    setMeals((prev) => {
      const list = Array.isArray(prev?.[mealKey]) ? prev[mealKey] : [];
      return {
        ...prev,
        [mealKey]: list.filter((r) => r.id !== rowId),
      };
    });
  };

  const savePlan = async () => {
    if (!canEdit) return;

    setSaving(true);
    try {
      const payloadMealPlan = {};
      for (const m of MEALS) {
        payloadMealPlan[m.key] = (meals?.[m.key] || [])
          .filter((r) => String(r?.name || "").trim().length > 0)
          .map((r) => ({
            id: r.id,
            name: String(r.name || "").trim(),
            grams: toInt(r.grams),
          }));
      }

      const payload = {
        user_id: selectedUser.id,
        calories: toInt(form.calories) ?? 0,
        protein: toInt(form.protein) ?? 0,
        carbs: toInt(form.carbs) ?? 0,
        fats: toInt(form.fats) ?? 0,
        coach_notes: String(form.coach_notes || ""),
        meal_plan: payloadMealPlan,
        updated_at: new Date().toISOString(),
      };

      if (planId) {
        const { error } = await supabase.from("nutrition_plans").update(payload).eq("id", planId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("nutrition_plans")
          .insert(payload)
          .select("id, updated_at")
          .single();
        if (error) throw error;
        setPlanId(data?.id || null);
        setUpdatedAt(data?.updated_at || null);
      }

      toast({ title: "Plan guardado", description: "La nutrición del cliente se actualizó correctamente." });
      await loadPlan();
    } catch (e) {
      toast({
        title: "Error guardando plan",
        description: e?.message || "No se pudo guardar el plan nutricional.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!selectedUser) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700">
        Selecciona un cliente para editar su nutrición.
      </div>
    );
  }

  if (!isClientSelected) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700">
        Para editar nutrición, selecciona un usuario con rol <span className="font-semibold">client</span>.
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
          <div className="text-sm font-semibold text-gray-900">Plan nutricional</div>
          <div className="text-xs text-gray-500">
            {loading ? "Cargando…" : updatedAt ? `Actualizado: ${formatDate(updatedAt)}` : "Sin plan aún"}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadPlan} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button onClick={savePlan} disabled={!canEdit || saving}>
            <Save size={16} className="mr-2" />
            {saving ? "Guardando…" : "Guardar plan"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className={labelBase}>Kcal</div>
          <input
            className={inputBase}
            value={form.calories ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, calories: e.target.value }))}
            disabled={!canEdit}
            inputMode="numeric"
          />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className={labelBase}>Proteína (g)</div>
          <input
            className={inputBase}
            value={form.protein ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, protein: e.target.value }))}
            disabled={!canEdit}
            inputMode="numeric"
          />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className={labelBase}>Carbs (g)</div>
          <input
            className={inputBase}
            value={form.carbs ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, carbs: e.target.value }))}
            disabled={!canEdit}
            inputMode="numeric"
          />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className={labelBase}>Grasas (g)</div>
          <input
            className={inputBase}
            value={form.fats ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, fats: e.target.value }))}
            disabled={!canEdit}
            inputMode="numeric"
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="text-sm font-semibold text-gray-900 mb-2">Notas del coach</div>
        <textarea
          className={[inputBase, "min-h-[120px]"].join(" ")}
          placeholder="Notas para el cliente…"
          value={form.coach_notes || ""}
          onChange={(e) => setForm((p) => ({ ...p, coach_notes: e.target.value }))}
          disabled={!canEdit}
        />
        <div className="mt-2 text-xs text-gray-500">Esto se mostrará al cliente en /app/nutrición.</div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="text-sm font-semibold text-gray-900">Menú (por comidas)</div>
        <div className="text-xs text-gray-500 mb-4">
          Añade alimentos y gramos. Si no aplica, puedes dejar la comida vacía.
        </div>

        <div className="space-y-6">
          {MEALS.map((meal) => (
            <div key={meal.key} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold text-gray-900">{meal.label}</div>
                <Button variant="outline" onClick={() => addMealRow(meal.key)} disabled={!canEdit}>
                  <Plus size={16} className="mr-2" />
                  Añadir
                </Button>
              </div>

              <div className="mt-3 space-y-2">
                {(meals?.[meal.key] || []).length === 0 ? (
                  <div className="text-sm text-gray-500">Sin items.</div>
                ) : (
                  (meals?.[meal.key] || []).map((row) => (
                    <div key={row.id} className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                      <div className="sm:col-span-8">
                        <input
                          className={inputBase}
                          placeholder="Alimento (ej: arroz, pollo, yogur…)"
                          value={row.name}
                          onChange={(e) => setMealRow(meal.key, row.id, { name: e.target.value })}
                          disabled={!canEdit}
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          className={inputBase}
                          placeholder="Gramos"
                          value={row.grams}
                          onChange={(e) => setMealRow(meal.key, row.id, { grams: e.target.value })}
                          disabled={!canEdit}
                          inputMode="numeric"
                        />
                      </div>
                      <div className="sm:col-span-1 flex">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => removeMealRow(meal.key, row.id)}
                          disabled={!canEdit}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}