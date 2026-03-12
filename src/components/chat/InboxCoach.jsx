import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, Plus, Filter, Loader2, MessageSquare, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createThreadAsCoach,
  searchClients,
  fetchThreadsForAdmin,
  subscribeToAdminThreads,
  deleteThreadForAdmin, // ✅ NUEVO: borra thread + mensajes (WhatsApp real)
} from "@/lib/chat/chatApi";
import {
  displayNameFromProfile,
  formatTime,
  initialsFromProfile,
  normalizeSearch,
  sortThreadsByLastActivityDesc,
  threadPreviewText,
} from "@/lib/chat/chatFormat";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

/**
 * InboxCoach
 * - Inbox estilo “profesional”
 * - Buscar, filtro no leídos, crear nuevo chat con cliente
 * ✅ NUEVO:
 * - Eliminar conversación (borra mensajes + thread) estilo WhatsApp
 */
export default function InboxCoach({
  adminId,
  selectedThreadId,
  onSelectThread,
  toast,
  viewerTimeZone,
  viewerLocale,
  autoSelectFirst = true,
}) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const autoSelectedRef = useRef(false);

  const [search, setSearch] = useState("");
  const [onlyUnread, setOnlyUnread] = useState(false);

  const [newOpen, setNewOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);

  // ✅ NUEVO: confirm modal para eliminar conversación
  const [clearOpen, setClearOpen] = useState(false);
  const [clearTarget, setClearTarget] = useState(null);

  const query = useMemo(() => normalizeSearch(search), [search]);

  const filteredThreads = useMemo(() => {
    const arr = [...(threads || [])].sort(sortThreadsByLastActivityDesc);

    let out = arr;
    if (onlyUnread) out = out.filter((t) => (t.unread_by_admin || 0) > 0);

    if (query) {
      out = out.filter((t) => {
        const c = t.client || {};
        const name = displayNameFromProfile(c).toLowerCase();
        const email = String(c?.email || "").toLowerCase();
        const prev = String(t?.last_message || "").toLowerCase();
        return name.includes(query) || email.includes(query) || prev.includes(query);
      });
    }

    return out;
  }, [threads, query, onlyUnread]);

  const unreadTotal = useMemo(() => {
    return (threads || []).reduce((acc, t) => acc + (t.unread_by_admin || 0), 0);
  }, [threads]);

  const loadThreads = useCallback(async () => {
    if (!adminId) return;
    setLoading(true);
    const { data, error } = await fetchThreadsForAdmin({ adminId, limit: 200 });
    setLoading(false);

    if (error) {
      toast?.({
        variant: "destructive",
        title: "No se pudo cargar la bandeja",
        description: error.message || "Intenta de nuevo",
      });
      return;
    }

    setThreads(data || []);

    // WhatsApp-like: si hay conversaciones y aún no hay ninguna seleccionada, abre la primera.
    if (autoSelectFirst && !selectedThreadId && !autoSelectedRef.current && (data || []).length > 0) {
      autoSelectedRef.current = true;
      onSelectThread?.((data || [])[0]);
    }
  }, [adminId, toast, autoSelectFirst, selectedThreadId, onSelectThread]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (!adminId) return;
    const unsub = subscribeToAdminThreads(adminId, () => {
      // Re-fetch simple (robusto y barato para pocos threads)
      loadThreads();
    });
    return () => unsub?.();
  }, [adminId, loadThreads]);

  const openNew = useCallback(async () => {
    setNewOpen(true);
    setClientSearch("");
    setClients([]);
    setClientsLoading(true);
    const { data, error } = await searchClients({ query: "", limit: 50 });
    setClientsLoading(false);
    if (error) {
      toast?.({ variant: "destructive", title: "No se pudieron cargar clientes", description: error.message || "" });
      return;
    }
    const list = (data || []).filter((c) => c?.id !== adminId);
    setClients(list);
  }, [toast, adminId]);

  // Renamed local function to avoid shadowing/confusion with API imports
  const performClientSearch = useCallback(async () => {
    setClientsLoading(true);
    const { data, error } = await searchClients({ query: clientSearch, limit: 50 });
    setClientsLoading(false);
    if (error) {
      toast?.({ variant: "destructive", title: "Búsqueda fallida", description: error.message || "" });
      return;
    }
    const list = (data || []).filter((c) => c?.id !== adminId);
    setClients(list);
  }, [clientSearch, toast, adminId]);

  const startChatWith = useCallback(async (client) => {
    if (!client?.id) return;
    const { data, error } = await createThreadAsCoach({ adminId, clientId: client.id });
    if (error) {
      toast?.({ variant: "destructive", title: "No se pudo crear el chat", description: error.message || "" });
      return;
    }
    setNewOpen(false);
    await loadThreads();
    onSelectThread?.(data);
  }, [adminId, toast, loadThreads, onSelectThread]);

  // ✅ NUEVO: abrir confirm eliminar conversación
  const requestClearThread = useCallback((t) => {
    setClearTarget(t || null);
    setClearOpen(true);
  }, []);

  // ✅ NUEVO: confirmar eliminar (thread + mensajes)
  const confirmClearThread = useCallback(async () => {
    const t = clearTarget;
    setClearOpen(false);

    if (!t?.id) return;

    const { error } = await deleteThreadForAdmin(t.id);

    if (error) {
      toast?.({
        variant: "destructive",
        title: "No se pudo eliminar la conversación",
        description: error.message || "Revisa RLS/policies.",
      });
      return;
    }

    toast?.({
      title: "Conversación eliminada",
      description: "Se borró el chat completo (con sus mensajes).",
    });

    // refrescar bandeja y quitarlo de la lista
    const { data, error: e2 } = await fetchThreadsForAdmin({ adminId, limit: 200 });
    if (e2) {
      await loadThreads();
      if (selectedThreadId === t.id) onSelectThread?.(null);
      return;
    }

    const list = data || [];
    setThreads(list);

    // si era el seleccionado, seleccionar otro o cerrar
    if (selectedThreadId === t.id) {
      const next = list[0] || null;
      onSelectThread?.(next);
    }
  }, [clearTarget, toast, adminId, selectedThreadId, onSelectThread, loadThreads]);

  return (
    <div className="flex h-full w-full flex-col rounded-2xl border bg-white overflow-hidden">
      <div className="border-b bg-slate-900 px-4 py-3 text-white">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-200" />
              <div className="truncate text-sm font-semibold">Bandeja</div>
              {unreadTotal > 0 ? (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-100 ring-1 ring-emerald-400/30">
                  {unreadTotal} sin leer
                </span>
              ) : null}
            </div>
            <div className="mt-0.5 text-[12px] text-white/70">Metafit Messenger · Coach</div>
          </div>

          <Button
            onClick={openNew}
            className="h-9 rounded-xl bg-white/10 text-white hover:bg-white/15"
            title="Nuevo chat"
          >
            <Plus className="mr-2 h-4 w-4" /> Nuevo
          </Button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente o mensaje…"
              className="h-10 w-full rounded-xl bg-white/10 pl-10 pr-3 text-sm text-white placeholder:text-white/50 outline-none ring-1 ring-white/10 focus:ring-white/20"
            />
          </div>

          <button
            type="button"
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-medium ring-1 ring-white/10",
              onlyUnread ? "bg-emerald-500/20 text-emerald-100" : "bg-white/10 text-white/80"
            )}
            onClick={() => setOnlyUnread((v) => !v)}
            title="Filtrar no leídos"
          >
            <Filter className="h-4 w-4" />
            No leídos
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando…
          </div>
        ) : filteredThreads.length ? (
          <div className="divide-y">
            {filteredThreads.map((t) => {
              const c = t.client || {};
              const name = displayNameFromProfile(c);
              const email = c?.email ? String(c.email) : "";
              const avatar = initialsFromProfile(c);
              const preview = threadPreviewText(t);
              const time = t.last_message_at ? formatTime(t.last_message_at, { timeZone: viewerTimeZone, locale: viewerLocale }) : "";
              const selected = t.id === selectedThreadId;
              const unread = t.unread_by_admin || 0;

              return (
                <button
                  key={t.id}
                  type="button"
                  className={cn(
                    "w-full px-4 py-3 text-left hover:bg-slate-50",
                    selected ? "bg-slate-50" : ""
                  )}
                  onClick={() => onSelectThread?.(t)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-2xl",
                      selected ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"
                    )}>
                      <span className="text-sm font-semibold">{avatar}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-sm font-semibold text-slate-900">{name}</div>
                        <div className="flex items-center gap-2">
                          {time ? <div className="text-xs text-slate-500">{time}</div> : null}
                          {unread > 0 ? (
                            <div className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-600 px-2 text-xs font-semibold text-white">
                              {unread}
                            </div>
                          ) : null}
                        </div>
                      </div>
                      {email ? <div className="mt-0.5 truncate text-xs text-slate-500">{email}</div> : null}
                      <div className="mt-0.5 truncate text-xs text-slate-600">{preview}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* ✅ Eliminar conversación (thread + mensajes) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          requestClearThread(t);
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-rose-700 hover:bg-rose-50"
                        title="Eliminar conversación"
                        aria-label="Eliminar conversación"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <div className="text-slate-300">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-6">
            <div className="rounded-2xl border bg-slate-50 p-5">
              <div className="text-sm font-semibold text-slate-900">Todavía no hay conversaciones</div>
              <div className="mt-2 text-sm text-slate-600">
                Puedes iniciar un chat con un cliente desde <span className="font-medium">Nuevo</span>,
                o esperar a que el cliente te escriba desde su área privada.
              </div>
              <div className="mt-4">
                <Button onClick={openNew} className="rounded-xl">
                  <Plus className="mr-2 h-4 w-4" /> Crear conversación
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ✅ Confirm eliminar conversación */}
      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent className="max-w-md bg-white text-slate-900 border-slate-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Eliminar conversación</DialogTitle>
            <DialogDescription>
              Esto borrará <b>la conversación</b> y <b>todos sus mensajes</b> (estilo WhatsApp).
              <br />
              Cliente: <b>{displayNameFromProfile(clearTarget?.client || {})}</b>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button variant="secondary" className="rounded-xl" onClick={() => setClearOpen(false)}>
              Cancelar
            </Button>
            <Button className="rounded-xl bg-rose-600 text-white hover:bg-rose-700" onClick={confirmClearThread}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-xl bg-white text-slate-900 border-slate-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Nuevo chat</DialogTitle>
            <DialogDescription>
              Selecciona un cliente para abrir una conversación. Solo aparecerán usuarios con rol <b>client</b>.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 flex items-center gap-2">
            <input
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              placeholder="Buscar por nombre o email…"
              className="h-10 w-full rounded-xl border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
            <Button variant="secondary" className="h-10 rounded-xl" onClick={performClientSearch}>
              <Search className="mr-2 h-4 w-4" /> Buscar
            </Button>
          </div>

          <div className="mt-4 max-h-[360px] overflow-auto rounded-xl border">
            {clientsLoading ? (
              <div className="flex items-center justify-center py-8 text-slate-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando…
              </div>
            ) : clients.length ? (
              <div className="divide-y">
                {clients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full px-4 py-3 text-left hover:bg-slate-50"
                    onClick={() => startChatWith(c)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                        <span className="text-sm font-semibold">{initialsFromProfile(c)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-900">{displayNameFromProfile(c)}</div>
                        <div className="truncate text-xs text-slate-600">{c.email || ""}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-sm text-slate-600">No se encontraron clientes.</div>
            )}
          </div>

          <DialogFooter>
            <Button variant="secondary" className="rounded-xl" onClick={() => setNewOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}