import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import {
  Users,
  FileEdit,
  Dumbbell,
  Utensils,
  RefreshCw,
  Search,
  Save,
  Trash2,
  Plus,
  ChevronRight,
  AlertCircle,
  Calendar,
  ArrowRight,
  Library
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/lib/customSupabaseClient";
import AdminResourcesTab from "@/pages/admin/tabs/AdminResourcesTab";

const msInDay = 24 * 60 * 60 * 1000;

const WEEK_DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const WEEKLY_MENU_SLOTS = [
  { key: "desayuno", label: "Desayuno" },
  { key: "comida", label: "Comida" },
  { key: "cena", label: "Cena" },
  { key: "snack", label: "Snack" },
];

const emptyWeeklyMenu = () => {
  const out = {};
  for (const d of WEEK_DAYS) {
    out[d] = { desayuno: "", comida: "", cena: "", snack: "" };
  }
  return out;
};

const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const toDate = (iso) => {
  try {
    return new Date(iso);
  } catch {
    return null;
  }
};

const daysAgo = (iso) => {
  const d = toDate(iso);
  if (!d) return null;
  return Math.floor((Date.now() - d.getTime()) / msInDay);
};

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

const inputBase =
  "w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 outline-none " +
  "focus:ring-2 focus:ring-blue-200 focus:border-blue-300";

const textareaBase =
  "w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 outline-none " +
  "focus:ring-2 focus:ring-blue-200 focus:border-blue-300";

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#0D1B2A]">{title}</h2>
        <p className="text-gray-600 text-sm">{message}</p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
};

const AdminPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const [errorBanner, setErrorBanner] = useState("");

  // list
  const [profiles, setProfiles] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);

  // detail data
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [planRow, setPlanRow] = useState(null);
  const [routines, setRoutines] = useState([]);
  const [lastCheckin, setLastCheckin] = useState(null);

  // editable: nutrition
  const [calories, setCalories] = useState(2600);
  const [protein, setProtein] = useState(180);
  const [carbs, setCarbs] = useState(320);
  const [fats, setFats] = useState(70);
  const [coachNotes, setCoachNotes] = useState("");
  
  // State for saving plan (Fixes ReferenceError)
  const [savingPlan, setSavingPlan] = useState(false);

  // editable: weekly manual menu (stored in nutrition_plans.meal_plan.weekly_menu)
  const [weeklyMenuDay, setWeeklyMenuDay] = useState("Lunes");
  const [weeklyMenu, setWeeklyMenu] = useState(() => emptyWeeklyMenu());
  const [savingWeeklyMenu, setSavingWeeklyMenu] = useState(false);
  const [weeklyMenuDirty, setWeeklyMenuDirty] = useState(false);

  // routines editor
  const [routineDay, setRoutineDay] = useState("Lunes");
  const [editingRoutineId, setEditingRoutineId] = useState(null);
  const [exerciseRows, setExerciseRows] = useState([
    { name: "", sets: "3", reps: "8-12", rir: "2", video: "", notes: "" },
  ]);
  const [savingRoutine, setSavingRoutine] = useState(false);

  // confirm dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const filteredProfiles = useMemo(() => {
    const q = normalize(query);
    const list = profiles ?? [];
    if (!q) return list;

    return list.filter((p) => {
      const name = normalize(p?.full_name ?? p?.name ?? p?.username ?? "");
      const email = normalize(p?.email ?? p?.user_email ?? "");
      const id = normalize(p?.id ?? "");
      return name.includes(q) || email.includes(q) || id.includes(q);
    });
  }, [profiles, query]);

  const selectedDisplay = useMemo(() => {
    if (!selectedProfile) return { name: "—", email: "—", role: "user" };
    const name =
      selectedProfile?.full_name ||
      selectedProfile?.name ||
      selectedProfile?.username ||
      (selectedProfile?.email ? selectedProfile.email.split("@")[0] : "Cliente");
    const email = selectedProfile?.email || selectedProfile?.user_email || "—";
    const role = (selectedProfile?.role ?? selectedProfile?.user_role ?? "user").toString();
    return { name, email, role };
  }, [selectedProfile]);

  const loadProfiles = useCallback(async () => {
    setUsersLoading(true);
    setErrorBanner("");

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      const arr = (data ?? []).slice();
      arr.sort((a, b) => {
        const ra = normalize(a?.role ?? "");
        const rb = normalize(b?.role ?? "");
        if (ra === "admin" && rb !== "admin") return 1;
        if (ra !== "admin" && rb === "admin") return -1;
        return 0;
      });

      setProfiles(arr);

      const firstClient = arr.find((p) => normalize(p?.role ?? "") !== "admin") ?? arr[0] ?? null;
      setSelectedUserId((prev) => prev ?? firstClient?.id ?? null);
    } catch (e) {
      setErrorBanner(e?.message ?? "No se pudo cargar la lista de usuarios.");
      toast({ variant: "destructive", title: "Error", description: e?.message ?? "Fallo cargando usuarios." });
    } finally {
      setUsersLoading(false);
    }
  }, [toast]);

  const loadUserDetail = useCallback(
    async (uid) => {
      if (!uid) return;

      setDetailLoading(true);
      setErrorBanner("");

      try {
        const [profRes, planRes, routinesRes, checkinRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
          supabase
            .from("nutrition_plans")
            .select("*")
            .eq("user_id", uid)
            .order("updated_at", { ascending: false })
            .limit(1),
          supabase
            .from("routines")
            .select("*")
            .eq("user_id", uid)
            .order("created_at", { ascending: false })
            .limit(200),
          supabase
            .from("checkins")
            .select("*")
            .eq("user_id", uid)
            .order("created_at", { ascending: false })
            .limit(1),
        ]);

        if (profRes.error) throw profRes.error;

        setSelectedProfile(profRes.data ?? null);

        if (planRes.error) throw planRes.error;

        let row = planRes.data?.[0] ?? null;

        // Si no existe el plan, intentamos crearlo (si RLS lo permite)
        if (!row) {
          const payload = {
            user_id: uid,
            calories: 2600,
            protein: 180,
            carbs: 320,
            fats: 70,
            meal_plan: null,
            coach_notes: "",
            updated_at: new Date().toISOString(),
          };

          const ins = await supabase.from("nutrition_plans").insert(payload).select("*").single();
          if (ins.error) throw ins.error;
          row = ins.data;
        }

        setPlanRow(row);
        setCalories(row?.calories ?? 2600);
        setProtein(row?.protein ?? 180);
        setCarbs(row?.carbs ?? 320);
        setFats(row?.fats ?? 70);
        setCoachNotes(row?.coach_notes ?? "");
        const existingWeekly = row?.meal_plan?.weekly_menu;
        setWeeklyMenu(existingWeekly && typeof existingWeekly === "object" ? { ...emptyWeeklyMenu(), ...existingWeekly } : emptyWeeklyMenu());
        // Default tab: today
        try {
          const jsDay = new Date().getDay(); // 0 Sunday
          const map = { 1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves", 5: "Viernes", 6: "Sábado", 0: "Domingo" };
          setWeeklyMenuDay(map[jsDay] || "Lunes");
        } catch {
          setWeeklyMenuDay("Lunes");
        }
        setWeeklyMenuDirty(false);


        if (routinesRes.error) throw routinesRes.error;
        const r = routinesRes.data ?? [];

        const map = new Map();
        for (const item of r) {
          const key = normalize(item?.day_name);
          if (!key) continue;
          if (!map.has(key)) map.set(key, item);
        }
        const unique = Array.from(map.values()).sort((a, b) => daySortIndex(a?.day_name) - daySortIndex(b?.day_name));
        setRoutines(unique);

        if (checkinRes.error) throw checkinRes.error;
        setLastCheckin(checkinRes.data?.[0] ?? null);

        setEditingRoutineId(null);
        setRoutineDay("Lunes");
        setExerciseRows([{ name: "", sets: "3", reps: "8-12", rir: "2", video: "", notes: "" }]);
      } catch (e) {
        setErrorBanner(e?.message ?? "Error cargando el detalle del usuario.");
        toast({ variant: "destructive", title: "Error", description: e?.message ?? "Fallo cargando detalle." });
      } finally {
        setDetailLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        await loadProfiles();
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [loadProfiles]);

  useEffect(() => {
    if (!selectedUserId) return;
    loadUserDetail(selectedUserId);
  }, [selectedUserId, loadUserDetail]);

  const onSavePlan = async () => {
    if (!planRow?.id) return;

    setSavingPlan(true);
    setErrorBanner("");

    try {
      const payload = {
        calories: safeNum(calories) ?? 2600,
        protein: safeNum(protein) ?? 180,
        carbs: safeNum(carbs) ?? 320,
        fats: safeNum(fats) ?? 70,
        coach_notes: coachNotes ?? "",
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("nutrition_plans")
        .update(payload)
        .eq("id", planRow.id)
        .select("*")
        .single();

      if (error) throw error;

      setPlanRow(data);
      toast({ title: "Guardado", description: "Plan actualizado correctamente." });
    } catch (e) {
      setErrorBanner(e?.message ?? "No se pudo guardar el plan.");
      toast({ variant: "destructive", title: "Error", description: e?.message ?? "Fallo guardando plan." });
    } finally {
      setSavingPlan(false);
    }
  };

  const onSaveWeeklyMenu = async () => {
    if (!planRow?.id) return;

    setSavingWeeklyMenu(true);
    setErrorBanner("");

    try {
      const currentMealPlan = planRow?.meal_plan && typeof planRow.meal_plan === "object" ? planRow.meal_plan : {};
      const payloadMealPlan = {
        ...currentMealPlan,
        weekly_menu: weeklyMenu,
        weekly_menu_updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("nutrition_plans")
        .update({
          meal_plan: payloadMealPlan,
          updated_at: new Date().toISOString(),
        })
        .eq("id", planRow.id)
        .select()
        .single();

      if (error) throw error;

      setPlanRow(data);
      toast({ title: "Menú semanal guardado", description: "El cliente lo verá en /app/nutricion." });
    } catch (e) {
      setErrorBanner(e?.message ?? "No se pudo guardar el menú semanal.");
      toast({ variant: "destructive", title: "Error", description: e?.message ?? "Fallo guardando menú semanal." });
    } finally {
      setSavingWeeklyMenu(false);
    }
  };


  const onEditRoutine = (r) => {
    setEditingRoutineId(r?.id ?? null);
    setRoutineDay(r?.day_name ?? "Lunes");
    const ex = Array.isArray(r?.exercises) ? r.exercises : [];
    setExerciseRows(
      ex.length
        ? ex.map((x) => ({
          name: x?.name ?? "",
          sets: String(x?.sets ?? "3"),
          reps: String(x?.reps ?? "8-12"),
          rir: String(x?.rir ?? "2"),
          video: x?.video ?? x?.video_url ?? "",
          notes: x?.notes ?? "",
        }))
        : [{ name: "", sets: "3", reps: "8-12", rir: "2", video: "", notes: "" }]
    );
  };

  const onDeleteRoutine = (rid) => {
    if (!rid) return;

    setConfirmDialog({
      isOpen: true,
      title: "Borrar rutina",
      message: "¿Estás seguro de que querés borrar esta rutina? Esta acción no se puede deshacer.",
      onConfirm: async () => {
        try {
          const { error } = await supabase.from("routines").delete().eq("id", rid);
          if (error) throw error;
          toast({ title: "Rutina borrada" });
          await loadUserDetail(selectedUserId);
        } catch (e) {
          toast({ variant: "destructive", title: "Error", description: e?.message ?? "No se pudo borrar." });
        } finally {
          setConfirmDialog({ isOpen: false, title: "", message: "", onConfirm: null });
        }
      },
    });
  };

  const addExerciseRow = () => {
    setExerciseRows((prev) => [...prev, { name: "", sets: "3", reps: "8-12", rir: "2", video: "", notes: "" }]);
  };

  const updateExerciseRow = (idx, patch) => {
    setExerciseRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const removeExerciseRow = (idx) => {
    setExerciseRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const onSaveRoutine = async () => {
    if (!selectedUserId) return;

    const cleaned = (exerciseRows ?? [])
      .map((r) => ({
        name: String(r?.name ?? "").trim(),
        sets: String(r?.sets ?? "").trim(),
        reps: String(r?.reps ?? "").trim(),
        rir: String(r?.rir ?? "").trim(),
        video: String(r?.video ?? "").trim(),
        notes: String(r?.notes ?? "").trim(),
      }))
      .filter((x) => x.name);

    if (!cleaned.length) {
      toast({ variant: "destructive", title: "Falta contenido", description: "Agrega al menos 1 ejercicio." });
      return;
    }

    setSavingRoutine(true);
    setErrorBanner("");

    try {
      if (editingRoutineId) {
        const { error } = await supabase
          .from("routines")
          .update({
            day_name: routineDay,
            exercises: cleaned,
          })
          .eq("id", editingRoutineId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("routines")
          .insert({
            user_id: selectedUserId,
            day_name: routineDay,
            exercises: cleaned,
          });

        if (error) throw error;
      }

      toast({ title: "Rutina guardada", description: editingRoutineId ? "Se actualizó." : "Se creó." });
      await loadUserDetail(selectedUserId);
    } catch (e) {
      setErrorBanner(e?.message ?? "No se pudo guardar la rutina.");
      toast({ variant: "destructive", title: "Error", description: e?.message ?? "Fallo guardando rutina." });
    } finally {
      setSavingRoutine(false);
    }
  };

  const stats = useMemo(() => {
    const total = profiles?.length ?? 0;
    const admins = (profiles ?? []).filter((p) => normalize(p?.role ?? "") === "admin").length;
    const clients = total - admins;
    return { total, clients, admins };
  }, [profiles]);

  const checkinInfo = useMemo(() => {
    if (!lastCheckin?.created_at) return { label: "Sin check-ins", days: null, due: true };
    const d = daysAgo(lastCheckin.created_at);
    const due = typeof d === "number" ? d >= 7 : true;
    return { label: `Último check-in: hace ${d} día${d === 1 ? "" : "s"}`, days: d, due };
  }, [lastCheckin]);

  const nextReview = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const daysUntilSunday = (7 - day) % 7;
    const target = new Date(now);
    target.setHours(12, 0, 0, 0);
    target.setDate(now.getDate() + daysUntilSunday);
    if (daysUntilSunday === 0 && now.getTime() > target.getTime()) target.setDate(target.getDate() + 7);
    return target;
  }, []);

  const daysToReview = useMemo(() => Math.ceil((nextReview.getTime() - Date.now()) / msInDay), [nextReview]);

  return (
    <>
      <Helmet>
        <title>Admin - Metafit</title>
      </Helmet>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={() => {
          if (confirmDialog.onConfirm) confirmDialog.onConfirm();
        }}
        onCancel={() => setConfirmDialog({ isOpen: false, title: "", message: "", onConfirm: null })}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#0D1B2A]">Panel de Coach</h1>
            <p className="text-gray-500 text-sm">Gestioná clientes, notas, menús y rutinas desde un solo lugar.</p>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/app">Ver Vista Cliente</Link>
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={loadProfiles}
              disabled={usersLoading}
              title="Actualizar lista de clientes"
            >
              <RefreshCw size={16} className={usersLoading ? "animate-spin" : ""} />
              {usersLoading ? "Actualizando…" : "Actualizar"}
            </Button>
          </div>
        </div>

        {/* Error banner */}
        {errorBanner ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="mt-0.5" />
              <div className="whitespace-pre-line">{errorBanner}</div>
            </div>
          </div>
        ) : null}

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Clientes</p>
                <p className="text-2xl font-bold text-[#0D1B2A]">{stats.clients}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 text-blue-700">
                <Users size={22} />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Admins</p>
                <p className="text-2xl font-bold text-[#0D1B2A]">{stats.admins}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-100 text-gray-700">
                <FileEdit size={22} />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Estado check-in</p>
                <p className={`text-sm font-bold ${checkinInfo.due ? "text-amber-700" : "text-green-700"}`}>
                  {selectedUserId ? checkinInfo.label : "Selecciona un cliente"}
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${checkinInfo.due ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"
                  }`}
              >
                <Utensils size={22} />
              </div>
            </div>
          </div>
        </div>

        {/* Main Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Users */}
          <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Search size={16} className="text-gray-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por nombre/email…"
                  className={inputBase}
                />
              </div>
              <p className="text-xs text-gray-500">{usersLoading ? "Cargando usuarios…" : `${filteredProfiles.length} usuarios`}</p>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {usersLoading ? (
                <div className="p-4 text-sm text-gray-500">Cargando…</div>
              ) : filteredProfiles.length ? (
                filteredProfiles.map((p) => {
                  const pid = p?.id;
                  const name =
                    p?.full_name || p?.name || p?.username || (p?.email ? p.email.split("@")[0] : "Cliente");
                  const email = p?.email || p?.user_email || "";
                  const role = normalize(p?.role ?? "");
                  const active = pid === selectedUserId;

                  return (
                    <button
                      key={pid}
                      onClick={() => setSelectedUserId(pid)}
                      className={[
                        "w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 flex items-center justify-between gap-3",
                        active ? "bg-blue-50" : "",
                      ].join(" ")}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-[#0D1B2A] truncate">{name}</p>
                          {role === "admin" ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-800 font-bold">
                              ADMIN
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                              CLIENTE
                            </span>
                          )}
                        </div>
                        {email ? <p className="text-xs text-gray-500 truncate">{email}</p> : null}
                      </div>
                      <ChevronRight size={18} className="text-gray-400 shrink-0" />
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-sm text-gray-500">No hay resultados.</div>
              )}
            </div>
          </div>

          {/* Right: Detail */}
          <div className="lg:col-span-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-500">Cliente</p>
                  <h2 className="text-xl font-bold text-[#0D1B2A]">{selectedDisplay.name}</h2>
                  <p className="text-sm text-gray-500">{selectedDisplay.email}</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => loadUserDetail(selectedUserId)}
                    disabled={detailLoading || !selectedUserId}
                  >
                    <RefreshCw size={16} className={detailLoading ? "animate-spin" : ""} />
                    {detailLoading ? "Cargando…" : "Refrescar"}
                  </Button>

                  <Button asChild variant="outline">
                    <a href="/app/nutricion" target="_blank" rel="noreferrer">
                      Ver Nutrición (cliente)
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <Tabs defaultValue="nutrition" className="w-full">
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger value="nutrition" className="gap-2">
                    <FileEdit size={16} /> Nutrición & Notas
                  </TabsTrigger>
                  <TabsTrigger value="menu" className="gap-2">
                    <Utensils size={16} /> Menú
                  </TabsTrigger>
                  <TabsTrigger value="routines" className="gap-2">
                    <Dumbbell size={16} /> Rutinas
                  </TabsTrigger>
                  <TabsTrigger value="resources" className="gap-2">
                    <Library size={16} /> Recursos
                  </TabsTrigger>
                </TabsList>

                {/* NUTRITION */}
                <TabsContent value="nutrition" className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1">
                      <label className="text-xs font-bold text-gray-600">Kcal</label>
                      <input
                        value={calories}
                        onChange={(e) => setCalories(e.target.value)}
                        className={inputBase}
                        placeholder="2600"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="text-xs font-bold text-gray-600">Proteína (g)</label>
                      <input
                        value={protein}
                        onChange={(e) => setProtein(e.target.value)}
                        className={inputBase}
                        placeholder="180"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="text-xs font-bold text-gray-600">Carbs (g)</label>
                      <input
                        value={carbs}
                        onChange={(e) => setCarbs(e.target.value)}
                        className={inputBase}
                        placeholder="320"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="text-xs font-bold text-gray-600">Grasas (g)</label>
                      <input
                        value={fats}
                        onChange={(e) => setFats(e.target.value)}
                        className={inputBase}
                        placeholder="70"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-600">Notas del coach</label>
                    <textarea
                      value={coachNotes}
                      onChange={(e) => setCoachNotes(e.target.value)}
                      rows={7}
                      className={textareaBase}
                      placeholder="Escribí aquí las notas del coach…"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Esto se muestra al cliente en <span className="font-semibold">/app/nutricion</span>.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 justify-end">
                    <Button
                      onClick={onSavePlan}
                      disabled={savingPlan || !planRow?.id}
                      className="gap-2 bg-[#0D1B2A] text-white hover:bg-[#1a2f45]"
                    >
                      {savingPlan ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                      {savingPlan ? "Guardando…" : "Guardar plan"}
                    </Button>
                  </div>
                </TabsContent>

                {/* MENU */}
                <TabsContent value="menu" className="mt-6 space-y-4">
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <p className="font-bold text-gray-900">Menú semanal (manual)</p>
                        <p className="text-xs text-gray-700">
                          Plantilla por día. El cliente verá el <span className="font-semibold">menú de hoy</span> destacado y el resto de la semana en su sección de Nutrición.
                        </p>
                        {weeklyMenuDirty ? (
                          <p className="mt-1 text-xs text-amber-700">
                            Hay cambios sin guardar.
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-gray-600">
                            Todo guardado.
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                        <Button
                          variant="outline"
                          onClick={() => {
                            const day = weeklyMenuDay;
                            setWeeklyMenu((prev) => ({
                              ...prev,
                              [day]: { ...(prev?.[day] ?? {}), desayuno: "", comida: "", cena: "", snack: "" },
                            }));
                            setWeeklyMenuDirty(true);
                            toast({ title: "Día limpiado", description: `Se limpió el contenido de ${day}.` });
                          }}
                          disabled={!selectedUserId || savingWeeklyMenu}
                          className="gap-2"
                        >
                          <Trash2 size={16} />
                          Limpiar día
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => {
                            const day = weeklyMenuDay;
                            const dayObj = weeklyMenu?.[day] ?? {};
                            setWeeklyMenu(() => {
                              const next = emptyWeeklyMenu();
                              for (const d of WEEK_DAYS) {
                                next[d] = { ...next[d], ...dayObj };
                              }
                              return next;
                            });
                            setWeeklyMenuDirty(true);
                            toast({ title: "Día copiado", description: `Se copió ${day} al resto de la semana.` });
                          }}
                          disabled={!selectedUserId || savingWeeklyMenu}
                          className="gap-2"
                        >
                          <Plus size={16} />
                          Copiar a la semana
                        </Button>

                        <Button
                          onClick={async () => {
                            await onSaveWeeklyMenu();
                            setWeeklyMenuDirty(false);
                          }}
                          disabled={!selectedUserId || savingWeeklyMenu}
                          className="gap-2"
                        >
                          <Save size={16} />
                          {savingWeeklyMenu ? "Guardando…" : "Guardar menú"}
                        </Button>
                      </div>
                    </div>

                    <Tabs value={weeklyMenuDay} onValueChange={(v) => setWeeklyMenuDay(v)}>
                      <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 w-full">
                        {WEEK_DAYS.map((d) => (
                          <TabsTrigger key={d} value={d} className="text-xs">
                            {d}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {WEEK_DAYS.map((d) => (
                        <TabsContent key={d} value={d} className="mt-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {WEEKLY_MENU_SLOTS.map((slot) => (
                              <div key={slot.key} className="space-y-1">
                                <label className="text-xs font-bold text-gray-900">{slot.label}</label>
                                <textarea
                                  value={weeklyMenu?.[d]?.[slot.key] ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setWeeklyMenu((prev) => ({
                                      ...prev,
                                      [d]: { ...(prev?.[d] ?? {}), [slot.key]: val },
                                    }));
                                    setWeeklyMenuDirty(true);
                                  }}
                                  rows={4}
                                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                  placeholder={`Escribe ${slot.label.toLowerCase()} (cantidades, opciones, etc.)`}
                                />
                              </div>
                            ))}
                          </div>

                          <p className="text-xs text-gray-700">
                            Puedes escribir cantidades en gramos, porciones u alternativas. Todo es texto: rápido, flexible y fácil de mantener.
                          </p>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>
                </TabsContent>

                {/* ROUTINES */}
                <TabsContent value="routines" className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Existing */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <p className="font-bold text-[#0D1B2A]">Rutinas del cliente</p>
                        <span className="text-xs text-gray-500">{routines.length} día(s)</span>
                      </div>

                      <div className="max-h-[420px] overflow-y-auto">
                        {routines.length ? (
                          routines.map((r) => (
                            <div key={r.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-semibold text-[#0D1B2A]">{r.day_name}</p>
                                  <p className="text-xs text-gray-500">
                                    {Array.isArray(r.exercises) ? `${r.exercises.length} ejercicio(s)` : "Sin ejercicios"}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => onEditRoutine(r)}>
                                    Editar
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => onDeleteRoutine(r.id)}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-sm text-gray-500">No hay rutinas creadas aún.</div>
                        )}
                      </div>
                    </div>

                    {/* Editor */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <p className="font-bold text-[#0D1B2A]">{editingRoutineId ? "Editar rutina" : "Crear rutina"}</p>
                        <span className="text-xs text-gray-500">{editingRoutineId ? `ID: ${editingRoutineId}` : "Nueva"}</span>
                      </div>

                      <div className="p-4 space-y-4">
                        <div>
                          <label className="text-xs font-bold text-gray-600">Día</label>
                          <select
                            value={routineDay}
                            onChange={(e) => setRoutineDay(e.target.value)}
                            className={inputBase}
                          >
                            {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-gray-600">Ejercicios</p>
                            <Button variant="outline" size="sm" className="gap-2" onClick={addExerciseRow}>
                              <Plus size={16} /> Añadir
                            </Button>
                          </div>

                          {exerciseRows.map((row, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-lg p-3 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <input
                                  value={row.name}
                                  onChange={(e) => updateExerciseRow(idx, { name: e.target.value })}
                                  className={inputBase}
                                  placeholder="Nombre del ejercicio (ej: Press banca)"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => removeExerciseRow(idx)}
                                  title="Eliminar ejercicio"
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>

                              <div className="grid grid-cols-3 gap-2">
                                <input
                                  value={row.sets}
                                  onChange={(e) => updateExerciseRow(idx, { sets: e.target.value })}
                                  className={inputBase}
                                  placeholder="Sets"
                                />
                                <input
                                  value={row.reps}
                                  onChange={(e) => updateExerciseRow(idx, { reps: e.target.value })}
                                  className={inputBase}
                                  placeholder="Reps"
                                />
                                <input
                                  value={row.rir}
                                  onChange={(e) => updateExerciseRow(idx, { rir: e.target.value })}
                                  className={inputBase}
                                  placeholder="RIR"
                                />
                              </div>

                              <input
                                value={row.video}
                                onChange={(e) => updateExerciseRow(idx, { video: e.target.value })}
                                className={inputBase}
                                placeholder="Video (URL o ID)"
                              />

                              <textarea
                                value={row.notes}
                                onChange={(e) => updateExerciseRow(idx, { notes: e.target.value })}
                                className={textareaBase}
                                rows={2}
                                placeholder="Notas (técnica, tempo, descanso, etc.)"
                              />
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 justify-end">
                          <Button
                            onClick={onSaveRoutine}
                            disabled={savingRoutine || !selectedUserId}
                            className="gap-2 bg-[#0D1B2A] text-white hover:bg-[#1a2f45]"
                          >
                            {savingRoutine ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                            {savingRoutine ? "Guardando…" : "Guardar rutina"}
                          </Button>
                        </div>

                        <p className="text-xs text-gray-500">
                          El cliente verá estas rutinas en <span className="font-semibold">/app/entrenamiento</span>.
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>


                {/* RESOURCES */}
                <TabsContent value="resources" className="mt-6 space-y-6">
                  <AdminResourcesTab selectedUserId={selectedUserId} selectedProfile={selectedProfile} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Next Review (extra pro) */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-blue-900 mb-1 flex items-center gap-2">
              <Calendar size={18} /> Próxima revisión
            </h3>
            <p className="text-blue-700 text-sm">
              Ideal: completar el check-in semanal antes del domingo 12:00.{" "}
              <span className="font-semibold">
                {daysToReview <= 0 ? "Es hoy." : `Faltan ${daysToReview} día${daysToReview === 1 ? "" : "s"}.`}
              </span>
            </p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 w-full sm:w-auto">
              <Link to="/app/progreso" className="flex items-center justify-center gap-2">
                Ver progreso <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminPage;