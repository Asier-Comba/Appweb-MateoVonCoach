import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Trash2, Upload, Users, User as UserIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import {
  createResource,
  createSignedDownloadUrl,
  deleteResource,
  listGlobalResources,
  listResourcesAssignedToUser,
  searchClients,
} from "@/lib/resources/resourcesApi";

function formatBytes(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let u = 0;
  let v = n;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u += 1;
  }
  return `${v.toFixed(v >= 10 || u === 0 ? 0 : 1)} ${units[u]}`;
}

function formatDate(iso) {
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
}

function openUrl(url) {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function AdminResourcesTab({ selectedUserId, selectedProfile }) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [scope, setScope] = useState("all"); // all | user
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);

  // target search (email/username)
  const [targetQuery, setTargetQuery] = useState("");
  const [targetLoading, setTargetLoading] = useState(false);
  const [targetResults, setTargetResults] = useState([]);
  const [targetUser, setTargetUser] = useState(null);

  // lists
  const [globalLoading, setGlobalLoading] = useState(true);
  const [globalResources, setGlobalResources] = useState([]);

  const [assignedLoading, setAssignedLoading] = useState(false);
  const [assignedResources, setAssignedResources] = useState([]);

  const [uploading, setUploading] = useState(false);

  const debounceRef = useRef(null);

  const resolvedSelectedUser = useMemo(() => {
    if (!selectedUserId || !selectedProfile) return null;
    return {
      id: selectedUserId,
      email: selectedProfile?.email,
      username: selectedProfile?.username,
      name:
        selectedProfile?.full_name ||
        selectedProfile?.name ||
        selectedProfile?.username ||
        selectedProfile?.email ||
        "Cliente",
    };
  }, [selectedUserId, selectedProfile]);

  const refreshGlobal = useCallback(async () => {
    setGlobalLoading(true);
    try {
      const data = await listGlobalResources();
      setGlobalResources(data);
    } catch (e) {
      toast({
        title: "Error cargando recursos globales",
        description: e?.message || "Supabase error",
        variant: "destructive",
      });
    } finally {
      setGlobalLoading(false);
    }
  }, [toast]);

  const refreshAssigned = useCallback(
    async (uid) => {
      if (!uid) {
        setAssignedResources([]);
        return;
      }
      setAssignedLoading(true);
      try {
        const data = await listResourcesAssignedToUser(uid);
        setAssignedResources(data);
      } catch (e) {
        toast({
          title: "Error cargando recursos del cliente",
          description: e?.message || "Supabase error",
          variant: "destructive",
        });
      } finally {
        setAssignedLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    refreshGlobal();
  }, [refreshGlobal]);

  useEffect(() => {
    if (resolvedSelectedUser?.id) refreshAssigned(resolvedSelectedUser.id);
    else setAssignedResources([]);
  }, [resolvedSelectedUser, refreshAssigned]);

  useEffect(() => {
    // reset target if switching scope
    if (scope === "all") {
      setTargetUser(null);
      setTargetQuery("");
      setTargetResults([]);
    } else {
      // If a client is selected, prefill it
      if (resolvedSelectedUser?.id) {
        setTargetUser(resolvedSelectedUser);
        setTargetQuery(resolvedSelectedUser.email || resolvedSelectedUser.username || "");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  useEffect(() => {
    if (scope !== "user") return;

    const q = (targetQuery || "").trim();
    if (!q) {
      setTargetResults([]);
      return;
    }

    setTargetLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchClients(q, 10);

        // show only clients (avoid self)
        const filtered = (data ?? [])
          .filter((p) => p?.id && p?.id !== user?.id)
          .filter((p) => (p?.role || "").toLowerCase() !== "admin")
          .map((p) => ({
            id: p.id,
            email: p.email,
            username: p.username,
            name: p.full_name || p.name || p.username || p.email || "Cliente",
          }));

        setTargetResults(filtered);
      } catch (e) {
        toast({
          title: "Error buscando clientes",
          description: e?.message || "Supabase error",
          variant: "destructive",
        });
        setTargetResults([]);
      } finally {
        setTargetLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [scope, targetQuery, toast, user?.id]);

  const canUpload = useMemo(() => {
    if (!file) return false;
    if (scope === "all") return true;
    return !!targetUser?.id;
  }, [file, scope, targetUser?.id]);

  const onUpload = useCallback(async () => {
    if (!user?.id) {
      toast({ title: "No autenticado", variant: "destructive" });
      return;
    }
    if (!file) {
      toast({ title: "Selecciona un archivo", variant: "destructive" });
      return;
    }
    if (scope === "user" && !targetUser?.id && !resolvedSelectedUser?.id) {
      toast({
        title: "Selecciona un cliente",
        description: "Busca por email o username y selecciona un cliente.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      await createResource({
        uploaderId: user.id,
        title,
        description,
        isGlobal: scope === "all",
        targetUserId: scope === "user" ? (targetUser?.id || resolvedSelectedUser?.id) : null,
        file,
      });

      toast({
        title: "Recurso subido",
        description: scope === "all" ? "Visible para todos los clientes." : "Asignado al cliente.",
      });

      setTitle("");
      setDescription("");
      setFile(null);

      await refreshGlobal();
      if (resolvedSelectedUser?.id) await refreshAssigned(resolvedSelectedUser.id);
      if (scope === "user" && targetUser?.id) await refreshAssigned(targetUser.id);
    } catch (e) {
      const msg = e?.message || "Supabase error";
      const hint =
        String(msg).toLowerCase().includes("storage") || String(msg).toLowerCase().includes("policy")
          ? "Revisa Storage policies del bucket resources (posible 403)."
          : null;
      toast({
        title: "Error subiendo recurso",
        description: hint ? `${msg} — ${hint}` : msg,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [
    user?.id,
    file,
    scope,
    targetUser?.id,
    title,
    description,
    toast,
    refreshGlobal,
    refreshAssigned,
    resolvedSelectedUser?.id,
  ]);

  const onDownload = useCallback(
    async (row) => {
      try {
        const url = await createSignedDownloadUrl(row.file_bucket || "resources", row.file_path, 90);
        if (!url) throw new Error("No se pudo generar URL.");
        openUrl(url);
      } catch (e) {
        toast({
          title: "Error descargando",
          description: e?.message || "Supabase error",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const onDelete = useCallback(
    async (row) => {
      const ok = window.confirm(`¿Eliminar "${row.title || row.file_name || "recurso"}"?`);
      if (!ok) return;

      try {
        await deleteResource(row.id);
        toast({ title: "Recurso eliminado" });

        await refreshGlobal();
        if (resolvedSelectedUser?.id) await refreshAssigned(resolvedSelectedUser.id);
      } catch (e) {
        toast({
          title: "Error eliminando recurso",
          description: e?.message || "Supabase error",
          variant: "destructive",
        });
      }
    },
    [toast, refreshGlobal, refreshAssigned, resolvedSelectedUser?.id]
  );

  const ResourceRow = ({ row }) => (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-[#0D1B2A] truncate">{row.title || row.file_name}</div>
          {row.is_global ? (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              Global
            </span>
          ) : null}
        </div>
        {row.description ? (
          <div className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{row.description}</div>
        ) : null}
        <div className="text-xs text-gray-500 mt-2">
          {row.file_name ? <span className="mr-2">{row.file_name}</span> : null}
          {row.size ? <span className="mr-2">{formatBytes(row.size)}</span> : null}
          {row.created_at ? <span>{formatDate(row.created_at)}</span> : null}
        </div>
      </div>

      <div className="flex gap-2 shrink-0">
        <Button variant="outline" className="gap-2" onClick={() => onDownload(row)}>
          <Download size={16} /> Descargar
        </Button>
        <Button variant="destructive" className="gap-2" onClick={() => onDelete(row)}>
          <Trash2 size={16} /> Eliminar
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#0D1B2A]">Subir recurso</h3>
            <p className="text-sm text-gray-500">
              Sube archivos para todos los clientes o para un cliente específico (email/username).
            </p>
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <Users size={14} /> Admin: {user?.email || "—"}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-600">Título (opcional)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
              placeholder="Ej: Guía de compra básica"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600">Alcance</label>
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={() => setScope("all")}
                className={`px-3 py-2 rounded-lg border text-sm ${scope === "all"
                    ? "bg-blue-50 border-blue-200 text-blue-800"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
              >
                Para todos
              </button>
              <button
                type="button"
                onClick={() => setScope("user")}
                className={`px-3 py-2 rounded-lg border text-sm ${scope === "user"
                    ? "bg-blue-50 border-blue-200 text-blue-800"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
              >
                Para un cliente
              </button>
            </div>
          </div>

          {scope === "user" ? (
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-600">
                Cliente (email o username)
              </label>

              <div className="relative mt-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search size={16} />
                </div>
                <input
                  value={targetQuery}
                  onChange={(e) => {
                    setTargetQuery(e.target.value);
                    setTargetUser(null);
                  }}
                  className="w-full border rounded-lg pl-10 pr-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                  placeholder="Ej: iAzti o iAzti.contact@gmail.com"
                />
              </div>

              {resolvedSelectedUser?.id ? (
                <div className="mt-2 text-xs text-gray-500">
                  Cliente seleccionado:{" "}
                  <button
                    type="button"
                    className="underline text-blue-700"
                    onClick={() => {
                      setTargetUser(resolvedSelectedUser);
                      setTargetQuery(resolvedSelectedUser.email || resolvedSelectedUser.username || "");
                      setTargetResults([]);
                    }}
                  >
                    {resolvedSelectedUser.name} ({resolvedSelectedUser.email || resolvedSelectedUser.username})
                  </button>
                </div>
              ) : null}

              {targetLoading ? (
                <div className="mt-2 text-sm text-gray-500">Buscando…</div>
              ) : null}

              {!targetLoading && targetResults.length > 0 ? (
                <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden bg-white">
                  {targetResults.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setTargetUser(u);
                        setTargetQuery(u.email || u.username || "");
                        setTargetResults([]);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-[#0D1B2A]">{u.name}</div>
                        <div className="text-gray-400">
                          <UserIcon size={16} />
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {u.email} {u.username ? `· ${u.username}` : ""}
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}

              {targetUser?.id ? (
                <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-green-50 border border-green-100 px-3 py-2 text-sm text-green-800">
                  Cliente elegido: <strong>{targetUser.name}</strong>
                  <span className="text-green-700">
                    ({targetUser.email || targetUser.username})
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="md:col-span-2">
            <label className="text-xs font-bold text-gray-600">Descripción (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
              placeholder="Ej: Lee esto antes de empezar la semana 1."
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-bold text-gray-600">Archivo</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button className="gap-2" onClick={onUpload} disabled={!canUpload || uploading}>
            <Upload size={16} />
            {uploading ? "Subiendo…" : "Subir recurso"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#0D1B2A]">Recursos globales</h3>
            <Button variant="outline" onClick={refreshGlobal} disabled={globalLoading}>
              {globalLoading ? "Cargando…" : "Refrescar"}
            </Button>
          </div>

          {globalLoading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-500">
              Cargando recursos…
            </div>
          ) : globalResources.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-500">
              No hay recursos globales aún.
            </div>
          ) : (
            <div className="space-y-3">
              {globalResources.map((r) => (
                <ResourceRow key={r.id} row={r} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#0D1B2A]">
              Recursos del cliente
            </h3>
            <Button
              variant="outline"
              onClick={() => refreshAssigned(resolvedSelectedUser?.id)}
              disabled={!resolvedSelectedUser?.id || assignedLoading}
            >
              {assignedLoading ? "Cargando…" : "Refrescar"}
            </Button>
          </div>

          {!resolvedSelectedUser?.id ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-500">
              Selecciona un cliente (columna izquierda) para ver sus recursos asignados.
            </div>
          ) : assignedLoading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-500">
              Cargando recursos del cliente…
            </div>
          ) : assignedResources.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-500">
              Este cliente no tiene recursos asignados.
            </div>
          ) : (
            <div className="space-y-3">
              {assignedResources.map((r) => (
                <ResourceRow key={r.id} row={r} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Recomendación: mantén los recursos privados. El sistema usa URLs firmadas para descargas seguras.
      </div>
    </div>
  );
}