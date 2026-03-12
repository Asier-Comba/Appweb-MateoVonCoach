import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Helmet } from "react-helmet";
import { ArrowDown, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ChatTopBar from "@/components/chat/ChatTopBar";
import MessageBubble from "@/components/chat/MessageBubble";
import MessageComposer from "@/components/chat/MessageComposer";
import {
  createPresenceChannel,
  fetchMessages,
  markThreadRead,
  sendMessage,
  subscribeToThreadMessages,
  uploadAttachment,
  // ✅ NUEVO
  updateMessageBody,
  deleteMessage,
  deleteThreadForAdmin, // ✅ WhatsApp real: borra thread + mensajes
} from "@/lib/chat/chatApi";
import { formatDayLabel, isSameDay, safeStr } from "@/lib/chat/chatFormat";

const PAGE_SIZE = 50;

function makeTempId() {
  try {
    // eslint-disable-next-line no-undef
    return (crypto?.randomUUID?.() || null) ?? `t_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  } catch {
    return `t_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}

function nowIso() {
  return new Date().toISOString();
}

/**
 * ThreadView (v5)
 * - Flujo 1:1 estable (coach <-> cliente)
 * - Paginación al subir + scroll estable
 * - Realtime (insert/update/delete)
 * - Read receipts + marcador "Nuevos mensajes"
 * - Typing + presence (online)
 * - Envío optimista (pendiente/error/reintentar)
 * ✅ NUEVO:
 * - Editar mensajes (autor)
 * - Eliminar mensajes (autor + coach)
 * - Eliminar conversación (coach) estilo WhatsApp: borra mensajes + thread
 */
export default function ThreadView({
  timeZone,
  locale,
  thread,
  mode = "client", // "coach" | "client"
  meId,
  participant,
  title = "Chat",
  subtitle = "",
  avatarText = "",
  showBack = false,
  onBack,
  toast,
}) {
  const threadId = thread?.id || null;

  const listRef = useRef(null);
  const bottomRef = useRef(null);
  const nearBottomRef = useRef(true);
  const preserveScrollRef = useRef({ active: false, top: 0, height: 0 });

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [messages, setMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);

  const [newCount, setNewCount] = useState(0);
  const [showJump, setShowJump] = useState(false);

  // Presence + typing
  const presenceHelperRef = useRef(null);
  const [presence, setPresence] = useState({});
  const [typingState, setTypingState] = useState({ userId: null, at: 0, isTyping: false });

  const otherId = useMemo(() => {
    if (!thread) return null;
    return mode === "coach" ? thread.client_id : thread.admin_id;
  }, [thread, mode]);

  const isOtherOnline = useMemo(() => {
    if (!otherId) return false;
    return Object.prototype.hasOwnProperty.call(presence || {}, otherId);
  }, [presence, otherId]);

  const showTyping = useMemo(() => {
    if (!typingState?.isTyping) return false;
    if (!otherId || typingState.userId !== otherId) return false;
    return Date.now() - (typingState.at || 0) < 6000;
  }, [typingState, otherId]);

  const baseSubtitle = useMemo(() => safeStr(subtitle || "").trim(), [subtitle]);

  const computedSubtitle = useMemo(() => baseSubtitle, [baseSubtitle]);

  const computedStatus = useMemo(() => {
    if (showTyping) return "Escribiendo…";
    if (isOtherOnline) return "En línea";
    return "";
  }, [isOtherOnline, showTyping]);

  const rightBadge = useMemo(() => {
    return mode === "coach" ? "Panel de control Metafit" : "Client Area";
  }, [mode]);

  const readCutoffInitial = useMemo(() => {
    if (!thread) return null;
    return mode === "coach" ? thread.admin_last_read_at : thread.client_last_read_at;
  }, [thread, mode]);

  const [readCutoff, setReadCutoff] = useState(readCutoffInitial);

  useEffect(() => {
    setReadCutoff(readCutoffInitial || null);
  }, [readCutoffInitial]);

  const markReadNow = useCallback(async () => {
    if (!threadId) return;
    try {
      await markThreadRead(threadId);
      setReadCutoff(nowIso());
      setNewCount(0);
    } catch {
      // silencioso
    }
  }, [threadId]);

  // ✅ NUEVO: editar mensaje
  const handleEditMessage = useCallback(
    async (msg, nextBody) => {
      if (!threadId || !meId || !msg?.id) return;
      const body = safeStr(nextBody).trim();
      if (!body) {
        toast?.({ variant: "destructive", title: "Mensaje vacío", description: "Escribe algo antes de guardar." });
        return;
      }

      // Solo autor (seguridad extra)
      if (msg.sender_id !== meId) {
        toast?.({ variant: "destructive", title: "No permitido", description: "Solo puedes editar tus mensajes." });
        return;
      }

      const meta = (msg?.meta && typeof msg.meta === "object") ? { ...msg.meta } : {};
      meta.edited_at = new Date().toISOString();

      // Optimista suave (UI)
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, body, meta } : m)));

      const { error } = await updateMessageBody({ messageId: msg.id, threadId, body, meta });
      if (error) {
        // Si falla, re-fetch es lo más seguro
        toast?.({ variant: "destructive", title: "No se pudo editar", description: error.message || "Revisa RLS/policies." });
        const { data } = await fetchMessages({ threadId, limit: PAGE_SIZE });
        if (Array.isArray(data)) setMessages(data);
      }
    },
    [threadId, meId, toast]
  );

  // ✅ NUEVO: eliminar mensaje (autor + coach)
  const handleDeleteMessage = useCallback(
    async (msg) => {
      if (!threadId || !meId || !msg?.id) return;

      const isCoach = mode === "coach";
      const isMine = msg.sender_id === meId;

      if (!isMine && !isCoach) {
        toast?.({ variant: "destructive", title: "No permitido", description: "No puedes borrar mensajes de otros." });
        return;
      }

      // Optimistic remove
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));

      const { error } = await deleteMessage({ messageId: msg.id, threadId });
      if (error) {
        toast?.({ variant: "destructive", title: "No se pudo borrar", description: error.message || "Revisa RLS/policies." });
        const { data } = await fetchMessages({ threadId, limit: PAGE_SIZE });
        if (Array.isArray(data)) setMessages(data);
      }
    },
    [threadId, meId, mode, toast]
  );

  // ✅ Eliminar conversación (solo coach) - WhatsApp real
  const handleClearChat = useCallback(async () => {
    if (!threadId) return;
    if (mode !== "coach") return;

    const ok = window.confirm("¿Seguro que quieres eliminar la conversación completa? (Se borra el chat y los mensajes)");
    if (!ok) return;

    // Optimista: limpia UI ya
    setMessages([]);
    setHasMore(false);
    setNewCount(0);
    setShowJump(false);

    const { error } = await deleteThreadForAdmin(threadId);
    if (error) {
      toast?.({ variant: "destructive", title: "No se pudo eliminar", description: error.message || "Revisa RLS/policies." });
      // si falla, re-cargar mensajes (best effort)
      const { data } = await fetchMessages({ threadId, limit: PAGE_SIZE });
      if (Array.isArray(data)) {
        setMessages(data);
        setHasMore(data.length >= PAGE_SIZE);
      }
      return;
    }

    toast?.({ title: "Conversación eliminada", description: "Se borró el chat completo (con sus mensajes)." });

    // ✅ cerrar el chat en el shell
    onBack?.();
  }, [threadId, mode, toast, onBack]);

  // Load initial
  useEffect(() => {
    let mounted = true;

    async function run() {
      if (!threadId) return;

      setLoading(true);
      const { data, error } = await fetchMessages({ threadId, limit: PAGE_SIZE });
      if (!mounted) return;
      setLoading(false);

      if (error) {
        toast?.({
          variant: "destructive",
          title: "No se pudieron cargar los mensajes",
          description: error.message || "Inténtalo de nuevo.",
        });
        return;
      }

      const list = Array.isArray(data) ? data : [];
      setMessages(list);
      setHasMore(list.length >= PAGE_SIZE);

      // Marca como leído (best-effort)
      markReadNow();

      // Scroll al final
      setTimeout(() => {
        bottomRef.current?.scrollIntoView?.({ behavior: "auto" });
      }, 40);
    }

    // reset state when thread changes
    setMessages([]);
    setReplyTo(null);
    setNewCount(0);
    setShowJump(false);
    setHasMore(true);

    run();
    return () => {
      mounted = false;
    };
  }, [threadId, toast, markReadNow]);

  // Realtime subscription
  useEffect(() => {
    if (!threadId) return;

    const unsub = subscribeToThreadMessages(threadId, (payload) => {
      const { eventType, new: n, old } = payload || {};

      if (eventType === "INSERT" && n?.id) {
        setMessages((prev) => {
          const tempId = n?.meta?.client_temp_id || null;

          // Replace optimistic message if we find matching temp
          if (tempId) {
            const idx = prev.findIndex((m) => m?.__local?.tempId === tempId);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = n;
              return copy;
            }
          }

          if (prev.some((x) => x.id === n.id)) return prev;
          return [...prev, n];
        });

        // Read + autoscroll behavior
        if (n.sender_id !== meId) {
          if (nearBottomRef.current) {
            markReadNow();
          } else {
            setNewCount((c) => c + 1);
            setShowJump(true);
          }
        }

        setTimeout(() => {
          if (nearBottomRef.current) {
            bottomRef.current?.scrollIntoView?.({ behavior: "smooth" });
          }
        }, 30);
      }

      if (eventType === "UPDATE" && n?.id) {
        setMessages((prev) => prev.map((x) => (x.id === n.id ? { ...x, ...n } : x)));
      }

      if (eventType === "DELETE" && old?.id) {
        setMessages((prev) => prev.filter((x) => x.id !== old.id));
      }
    });

    return () => unsub?.();
  }, [threadId, meId, markReadNow]);

  // Presence + typing
  useEffect(() => {
    if (!threadId || !meId) return;

    const helper = createPresenceChannel({
      threadId,
      userId: meId,
      onPresence: (state) => setPresence(state || {}),
      onTyping: (evt) => {
        if (!evt) return;
        if (evt.userId === meId) return;
        setTypingState({ userId: evt.userId, at: evt.at || Date.now(), isTyping: !!evt.isTyping });
      },
    });

    presenceHelperRef.current = helper;

    return () => {
      presenceHelperRef.current = null;
      helper.cleanup();
    };
  }, [threadId, meId]);

  const onTyping = useCallback((isTyping) => {
    presenceHelperRef.current?.sendTyping?.(isTyping);
  }, []);

  const loadMore = useCallback(async () => {
    if (!threadId || !hasMore || loadingMore) return;

    const el = listRef.current;
    if (el) {
      preserveScrollRef.current = {
        active: true,
        top: el.scrollTop,
        height: el.scrollHeight,
      };
    }

    setLoadingMore(true);
    const oldest = messages?.[0]?.created_at || null;
    const { data, error } = await fetchMessages({ threadId, beforeIso: oldest, limit: PAGE_SIZE });
    setLoadingMore(false);

    if (error) {
      toast?.({
        variant: "destructive",
        title: "No se pudieron cargar más mensajes",
        description: error.message || "Inténtalo de nuevo.",
      });
      return;
    }

    const chunk = Array.isArray(data) ? data : [];
    if (!chunk.length) {
      setHasMore(false);
      return;
    }

    setMessages((prev) => {
      const ids = new Set(prev.map((x) => x.id));
      const unique = chunk.filter((x) => x?.id && !ids.has(x.id));
      return [...unique, ...prev];
    });

    setHasMore(chunk.length >= PAGE_SIZE);
  }, [threadId, hasMore, loadingMore, messages, toast]);

  useLayoutEffect(() => {
    const el = listRef.current;
    const snap = preserveScrollRef.current;
    if (!el || !snap?.active) return;

    const newHeight = el.scrollHeight;
    const delta = newHeight - (snap.height || 0);
    el.scrollTop = (snap.top || 0) + delta;

    preserveScrollRef.current = { active: false, top: 0, height: 0 };
  }, [messages]);

  const onScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;

    const nearTop = el.scrollTop < 120;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 180;

    nearBottomRef.current = nearBottom;
    setShowJump(!nearBottom);

    if (nearBottom && newCount) setNewCount(0);
    if (nearTop) loadMore();
  }, [loadMore, newCount]);

  const grouped = useMemo(() => {
    const src = messages || [];
    const out = [];

    const cutoffMs = readCutoff ? new Date(readCutoff).getTime() : null;
    let insertedNewMarker = false;

    for (let i = 0; i < src.length; i += 1) {
      const m = src[i];
      const prev = i > 0 ? src[i - 1] : null;

      const needsDay = !prev || !isSameDay(prev.created_at, m.created_at, { timeZone, locale });
      if (needsDay) {
        out.push({ kind: "day", id: `day-${m.created_at}`, label: formatDayLabel(m.created_at, { timeZone, locale }) });
      }

      const isIncoming = m?.sender_id && m.sender_id !== meId;
      const isAfterCutoff = cutoffMs ? new Date(m.created_at).getTime() > cutoffMs : false;
      if (!insertedNewMarker && cutoffMs && isIncoming && isAfterCutoff) {
        insertedNewMarker = true;
        out.push({ kind: "new", id: `new-${m.created_at}` });
      }

      out.push({ kind: "msg", id: m.id, message: m });
    }

    return out;
  }, [messages, meId, readCutoff, timeZone, locale]);

  const jumpToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: "smooth" });
    setNewCount(0);
    markReadNow();
  }, [markReadNow]);

  const handleReply = useCallback(
    (msg) => {
      if (!msg) return;
      setReplyTo(msg);
      setTimeout(() => { }, 0);
    },
    []
  );

  const cancelReply = useCallback(() => setReplyTo(null), []);

  const replaceLocal = useCallback((tempId, updater) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m?.__local?.tempId === tempId);
      if (idx < 0) return prev;
      const copy = [...prev];
      copy[idx] = typeof updater === "function" ? updater(copy[idx]) : updater;
      return copy;
    });
  }, []);

  const discardLocal = useCallback((tempId) => {
    setMessages((prev) => prev.filter((m) => m?.__local?.tempId !== tempId));
  }, []);

  const optimisticSendText = useCallback(
    async ({ text, replyToId } = {}) => {
      if (!threadId || !meId) return;

      const body = safeStr(text).trim();
      if (!body) return;

      const tempId = makeTempId();
      const createdAt = nowIso();

      const effectiveReply = replyToId || replyTo?.id || null;
      const meta = {
        client_temp_id: tempId,
      };

      if (replyTo?.id) {
        meta.reply_preview = {
          sender: replyTo.sender_id === meId ? "Tú" : safeStr(title || ""),
          text: safeStr(replyTo.body || "").slice(0, 160),
        };
      }

      const localMsg = {
        id: `local-${tempId}`,
        thread_id: threadId,
        sender_id: meId,
        body,
        created_at: createdAt,
        read_at: null,
        reply_to_id: effectiveReply,
        type: "text",
        meta,
        __local: {
          tempId,
          status: "sending",
          kind: "text",
          payload: { body, replyToId: effectiveReply, meta },
        },
      };

      setMessages((prev) => [...prev, localMsg]);
      setReplyTo(null);

      setTimeout(() => {
        bottomRef.current?.scrollIntoView?.({ behavior: "smooth" });
      }, 10);

      const { data, error } = await sendMessage({
        threadId,
        senderId: meId,
        body,
        replyToId: effectiveReply,
        type: "text",
        meta,
      });

      if (error) {
        replaceLocal(tempId, (m) => ({
          ...m,
          __local: { ...m.__local, status: "error", error: error.message || String(error) },
        }));

        toast?.({
          variant: "destructive",
          title: "No se pudo enviar",
          description: error.message || "Inténtalo de nuevo.",
        });

        return;
      }

      if (data?.id) {
        replaceLocal(tempId, data);
        setTimeout(() => {
          if (nearBottomRef.current) markReadNow();
        }, 50);
      }
    },
    [threadId, meId, replyTo, replaceLocal, toast, title, markReadNow]
  );

  const optimisticSendAttachment = useCallback(
    async (fileOrObj, opts = {}) => {
      const file = fileOrObj?.file ? fileOrObj.file : fileOrObj;
      if (!threadId || !meId || !file) return;

      const tempId = makeTempId();
      const createdAt = nowIso();

      const meta = {
        client_temp_id: tempId,
        attachment: {
          name: file.name,
          size: file.size,
          mime: file.type || "application/octet-stream",
          path: null,
        },
      };

      const localMsg = {
        id: `local-${tempId}`,
        thread_id: threadId,
        sender_id: meId,
        body: file.name || "Adjunto",
        created_at: createdAt,
        read_at: null,
        reply_to_id: null,
        type: "attachment",
        meta,
        __local: {
          tempId,
          status: "uploading",
          kind: "attachment",
          payload: { file },
        },
      };

      setMessages((prev) => [...prev, localMsg]);

      setTimeout(() => {
        bottomRef.current?.scrollIntoView?.({ behavior: "smooth" });
      }, 10);

      const { data: up, error: upErr } = await uploadAttachment({ file, userId: meId, threadId });
      if (upErr) {
        replaceLocal(tempId, (m) => ({
          ...m,
          __local: { ...m.__local, status: "error", error: upErr.message || String(upErr) },
        }));
        toast?.({
          variant: "destructive",
          title: "No se pudo subir el archivo",
          description: upErr.message || "Revisa el bucket chat_attachments y sus policies.",
        });
        return;
      }

      replaceLocal(tempId, (m) => ({
        ...m,
        meta: { ...m.meta, attachment: { ...m.meta.attachment, ...up } },
        __local: { ...m.__local, status: "sending" },
      }));

      const { data, error } = await sendMessage({
        threadId,
        senderId: meId,
        body: file.name || "Adjunto",
        type: "attachment",
        meta: { ...meta, attachment: up },
      });

      if (error) {
        replaceLocal(tempId, (m) => ({
          ...m,
          __local: { ...m.__local, status: "error", error: error.message || String(error) },
        }));
        toast?.({
          variant: "destructive",
          title: "No se pudo enviar el adjunto",
          description: error.message || "Inténtalo de nuevo.",
        });
        return;
      }

      if (data?.id) {
        replaceLocal(tempId, data);
        setTimeout(() => {
          if (nearBottomRef.current) markReadNow();
        }, 50);
      }
    },
    [threadId, meId, replaceLocal, toast, markReadNow]
  );

  const retryLocal = useCallback(
    async (tempId) => {
      const msg = messages.find((m) => m?.__local?.tempId === tempId);
      if (!msg?.__local?.payload) return;

      replaceLocal(tempId, (m) => ({ ...m, __local: { ...m.__local, status: m.__local.kind === "attachment" ? "uploading" : "sending", error: null } }));

      if (msg.__local.kind === "attachment") {
        await optimisticSendAttachment({ file: msg.__local.payload.file });
        discardLocal(tempId);
        return;
      }

      const body = safeStr(msg.__local.payload.body).trim();
      const replyToId = msg.__local.payload.replyToId || null;
      const meta = msg.__local.payload.meta || {};

      const { data, error } = await sendMessage({
        threadId,
        senderId: meId,
        body,
        replyToId,
        type: "text",
        meta,
      });

      if (error) {
        replaceLocal(tempId, (m) => ({
          ...m,
          __local: { ...m.__local, status: "error", error: error.message || String(error) },
        }));
        return;
      }

      if (data?.id) {
        replaceLocal(tempId, data);
      }
    },
    [messages, replaceLocal, discardLocal, optimisticSendAttachment, threadId, meId]
  );

  if (!threadId) {
    return (
      <div className="flex h-full flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <ChatTopBar
          title={title || "Chat"}
          subtitle={computedSubtitle}
          status={computedStatus}
          rightBadge={rightBadge}
          avatarText={avatarText || "•"}
          showBack={showBack}
          onBack={onBack}
        />

        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-slate-600">
          {mode === "coach"
            ? "Busca un cliente arriba para abrir una conversación."
            : "No se pudo inicializar el chat con el coach."}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <Helmet>
        <title>Chat | Metafit</title>
      </Helmet>

      <ChatTopBar
        title={title || "Chat"}
        subtitle={computedSubtitle}
        status={computedStatus}
        rightBadge={rightBadge}
        avatarText={avatarText || "•"}
        showBack={showBack}
        onBack={onBack}
        rightActions={mode === "coach" ? (
          <button
            type="button"
            onClick={handleClearChat}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
            title="Eliminar conversación"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar chat
          </button>
        ) : null}
      />

      <div className="relative flex-1 overflow-hidden">
        <div
          ref={listRef}
          onScroll={onScroll}
          className={cn(
            "h-full overflow-auto px-4 py-4",
            "bg-[radial-gradient(circle_at_top,rgba(2,6,23,0.06),transparent_55%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.10),transparent_55%)]"
          )}
        >
          {loading ? (
            <div className="flex h-full items-center justify-center text-slate-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando…
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
              {loadingMore ? (
                <div className="flex items-center justify-center py-2 text-xs text-slate-500">
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Cargando más…
                </div>
              ) : null}

              {grouped.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white/60 px-6 py-8 text-center">
                  <div className="text-sm font-semibold text-slate-900">Aún no hay mensajes</div>
                  <div className="mt-1 text-sm text-slate-600">
                    Escribe abajo para iniciar la conversación.
                  </div>
                </div>
              ) : null}

              {grouped.map((row) => {
                if (row.kind === "day") {
                  return (
                    <div key={row.id} className="flex items-center justify-center py-2">
                      <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600">
                        {row.label}
                      </span>
                    </div>
                  );
                }

                if (row.kind === "new") {
                  return (
                    <div key={row.id} className="flex items-center justify-center py-2">
                      <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                        Nuevos mensajes
                      </span>
                    </div>
                  );
                }

                const m = row.message;
                const mine = m.sender_id === meId;

                return (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    isMine={mine}
                    senderLabel={mine ? "Tú" : title}
                    onReply={() => { }}
                    onRetry={(tempId) => retryLocal(tempId)}
                    onDiscard={(tempId) => discardLocal(tempId)}
                    toast={toast}
                    timeZone={timeZone}
                    locale={locale}
                    canModerate={mode === "coach"}
                    onEditMessage={handleEditMessage}
                    onDeleteMessage={handleDeleteMessage}
                  />
                );
              })}

              {showTyping ? (
                <div className="mx-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-xs font-medium text-slate-600">
                  {mode === "coach" ? "El cliente está escribiendo…" : "El coach está escribiendo…"}
                </div>
              ) : null}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {showJump ? (
          <button
            type="button"
            onClick={jumpToBottom}
            className={cn(
              "absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full",
              "bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-lg",
              "hover:bg-slate-800"
            )}
            title="Ir al final"
          >
            <ArrowDown className="h-4 w-4" />
            {newCount > 0 ? `${newCount} nuevo${newCount === 1 ? "" : "s"}` : "Ir al final"}
          </button>
        ) : null}
      </div>

      <MessageComposer
        threadId={threadId}
        senderId={meId}
        disabled={!meId || loading}
        placeholder={mode === "coach" ? "Escribe al cliente…" : "Escribe a tu coach…"}
        mode={mode}
        replyTo={replyTo}
        onCancelReply={cancelReply}
        onTyping={onTyping}
        onSendText={optimisticSendText}
        onSendAttachment={optimisticSendAttachment}
        toast={toast}
      />
    </div>
  );
}