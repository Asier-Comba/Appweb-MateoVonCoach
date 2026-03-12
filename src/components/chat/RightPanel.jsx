import React, { useMemo } from "react";
import { Download, Copy, Shield, Info, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { displayNameFromProfile, formatTime, formatDayLabel } from "@/lib/chat/chatFormat";
import { Button } from "@/components/ui/button";

export default function RightPanel({
  open,
  onClose,
  mode = "client",
  thread,
  participant,
  messages = [],
  isOnline = false,
  toast,
}) {
  const title = useMemo(() => displayNameFromProfile(participant), [participant]);

  const lastMsg = useMemo(() => {
    const m = messages?.length ? messages[messages.length - 1] : null;
    return m;
  }, [messages]);

  const lastAtLabel = useMemo(() => {
    if (!lastMsg?.created_at) return "—";
    return `${formatDayLabel(lastMsg.created_at)} · ${formatTime(lastMsg.created_at)}`;
  }, [lastMsg?.created_at]);

  const roleLabel = useMemo(() => {
    if (mode === "coach") return "Cliente";
    return "Coach";
  }, [mode]);

  const canRender = open;

  function copyText(s) {
    if (!s) return;
    navigator.clipboard?.writeText?.(s);
    toast?.({ title: "Copiado", description: s });
  }

  function exportJson() {
    const payload = {
      thread,
      participant,
      exported_at: new Date().toISOString(),
      messages,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metafit-chat-${thread?.id || "thread"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className={cn(
        "hidden lg:flex lg:w-[320px] flex-col border-l bg-white",
        canRender ? "lg:flex" : "lg:hidden"
      )}
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-slate-500" />
          <div className="text-sm font-semibold text-slate-800">Detalles</div>
        </div>
        <button
          type="button"
          className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="rounded-2xl border bg-slate-50 p-4">
          <div className="text-xs font-semibold text-slate-500">{roleLabel}</div>
          <div className="mt-1 text-base font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-600">{participant?.email || ""}</div>

          <div className="mt-3 inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-slate-700">
            <span className={cn("h-2 w-2 rounded-full", isOnline ? "bg-emerald-500" : "bg-slate-300")} />
            {isOnline ? "Online" : "Offline"}
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          <div className="rounded-2xl border p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Clock className="h-4 w-4" /> Última actividad
            </div>
            <div className="mt-2 text-sm text-slate-700">{lastAtLabel}</div>
          </div>

          <div className="rounded-2xl border p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Shield className="h-4 w-4" /> Privacidad
            </div>
            <div className="mt-2 text-sm text-slate-700">
              Conversación privada. Los datos se rigen por RLS en Supabase.
            </div>
          </div>

          <div className="rounded-2xl border p-4">
            <div className="text-xs font-semibold text-slate-500">Acciones rápidas</div>
            <div className="mt-3 flex flex-col gap-2">
              <Button variant="secondary" className="justify-start" onClick={() => copyText(participant?.email || "")}>
                <Copy className="mr-2 h-4 w-4" /> Copiar email
              </Button>
              <Button variant="secondary" className="justify-start" onClick={exportJson} disabled={!thread?.id}>
                <Download className="mr-2 h-4 w-4" /> Exportar conversación (JSON)
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border bg-slate-50 p-4">
            <div className="text-xs font-semibold text-slate-500">Atajos</div>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              <li><span className="font-medium">Enter</span>: enviar</li>
              <li><span className="font-medium">Shift + Enter</span>: salto de línea</li>
              <li><span className="font-medium">Ctrl/Cmd + K</span>: acciones</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}