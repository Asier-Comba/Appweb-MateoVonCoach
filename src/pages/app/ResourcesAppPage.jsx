import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileText, Library, RefreshCw } from "lucide-react";

import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createSignedDownloadUrl, listVisibleResourcesForUser } from "@/lib/resources/resourcesApi";

function openUrl(url) {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function fmtDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

export default function ResourcesAppPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await listVisibleResourcesForUser(user.id);
      setItems(data || []);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error cargando recursos",
        description: e?.message ?? "No se pudo cargar la biblioteca.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = (q || "").trim().toLowerCase();
    if (!term) return items;

    return (items || []).filter((r) => {
      const hay = [
        r?.title,
        r?.description,
        r?.file_name,
        r?.mime,
        r?._scope,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(term);
    });
  }, [items, q]);

  const onDownload = useCallback(
    async (resource) => {
      try {
        if (!resource?.file_bucket || !resource?.file_path) {
          toast({
            variant: "destructive",
            title: "Recurso inválido",
            description: "Falta la ruta del archivo.",
          });
          return;
        }

        setBusyId(resource.id);
        const url = await createSignedDownloadUrl(resource.file_bucket, resource.file_path, 60);
        openUrl(url);

        toast({
          title: "Descarga iniciada",
          description: resource?.title ? resource.title : "Recurso",
        });
      } catch (e) {
        toast({
          variant: "destructive",
          title: "No se pudo descargar",
          description: e?.message ?? "Fallo creando enlace seguro.",
        });
      } finally {
        setBusyId(null);
      }
    },
    [toast],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recursos</h1>
          <p className="text-slate-700">Documentos y guías útiles que te asigna tu coach.</p>
        </div>

        <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refrescar
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-50 text-slate-700 rounded-full flex items-center justify-center">
            <Library size={22} />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-slate-900">Biblioteca de Recursos</div>
            <div className="text-sm text-slate-700">
              Verás recursos globales y recursos personalizados para ti.
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex-1">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por título, descripción o tipo…"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div className="text-sm text-slate-700">
            {loading ? "Cargando…" : `${filtered.length} recurso(s)`}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-slate-700">
            Cargando recursos…
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-700">
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-700">
              <FileText size={22} />
            </div>
            <div className="font-semibold text-slate-900">Aún no hay recursos</div>
            <div className="text-sm text-slate-700 mt-1">
              Cuando tu coach suba documentos o guías, aparecerán aquí.
            </div>
          </div>
        ) : (
          filtered.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row gap-4 sm:items-center"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center text-slate-700 shrink-0">
                <FileText size={20} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-semibold text-slate-900 truncate">
                    {r.title || r.file_name || "Recurso"}
                  </div>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full border",
                      r._scope === "assigned"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-700",
                    )}
                    title={r._scope === "assigned" ? "Asignado solo a ti" : "Visible para todos"}
                  >
                    {r._scope === "assigned" ? "Personal" : "Global"}
                  </span>
                </div>

                {r.description ? (
                  <div className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">
                    {r.description}
                  </div>
                ) : null}

                <div className="text-xs text-slate-600 mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {r.file_name ? <span className="truncate">Archivo: {r.file_name}</span> : null}
                  {r.mime ? <span>Tipo: {r.mime}</span> : null}
                  {r.created_at ? <span>Subido: {fmtDate(r.created_at)}</span> : null}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => onDownload(r)}
                  disabled={busyId === r.id}
                  className="gap-2"
                >
                  {busyId === r.id ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                  Descargar
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}