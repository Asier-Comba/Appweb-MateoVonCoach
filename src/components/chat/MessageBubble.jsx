import React, { useMemo, useState } from "react";
import { Check, CheckCheck, Download, Reply, TriangleAlert, Pencil, Trash2, X, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fileIconHint,
  formatBytes,
  formatTime,
  safeStr,
} from "@/lib/chat/chatFormat";
import { createSignedAttachmentUrl } from "@/lib/chat/chatApi";

function FileBadge({ attachment }) {
  const name = safeStr(attachment?.name || "Archivo");
  const size = attachment?.size ? formatBytes(attachment.size) : "";
  const mime = safeStr(attachment?.mime || "");
  const hint = fileIconHint(mime);

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900">
        <span className="text-xs font-semibold">
          {hint === "pdf"
            ? "PDF"
            : hint === "image"
            ? "IMG"
            : hint === "audio"
            ? "AUD"
            : hint === "video"
            ? "VID"
            : "FILE"}
        </span>
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-900">{name}</div>
        <div className="text-xs text-slate-500">
          {size ? size : mime ? mime : "Adjunto"}
        </div>
      </div>
    </div>
  );
}

export default function MessageBubble({
  timeZone,
  locale,
  message,
  isMine,
  senderLabel = "",
  toast,
  onReply,
  onRetry,
  onDiscard,
  // ✅ NUEVO
  canModerate = false,
  onEditMessage,
  onDeleteMessage,
}) {
  const [downloading, setDownloading] = useState(false);
  const [signedUrl, setSignedUrl] = useState("");

  // ✅ NUEVO: edición inline
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const createdAt = safeStr(message?.created_at || "");
  const readAt = safeStr(message?.read_at || "");
  const body = safeStr(message?.body || "");
  const type = safeStr(message?.type || "text");

  const replyPreview = useMemo(() => {
    const r = message?.meta?.reply_preview;
    if (!r) return null;
    const text = safeStr(r?.text || "");
    const author = safeStr(r?.author || "");
    if (!text && !author) return null;
    return { text, author };
  }, [message]);

  const attachment = useMemo(() => {
    const a = message?.meta?.attachment;
    if (!a?.path) return null;
    return {
      path: safeStr(a.path),
      name: safeStr(a.name),
      size: a.size ?? null,
      mime: safeStr(a.mime),
    };
  }, [message]);

  // Estado local (optimistic UI)
  const local = message?.__local || null;
  const localStatus = safeStr(local?.status || "");
  const tempId = safeStr(local?.tempId || "");
  const isOptimistic = localStatus === "sending" || localStatus === "uploading";
  const isFailed = localStatus === "error";

  const timeStr = formatTime(createdAt, { timeZone, locale });

  const statusIcon = useMemo(() => {
    if (!isMine) return null;
    if (isFailed) return <TriangleAlert className="h-4 w-4 text-rose-600" />;
    if (isOptimistic) return <Check className="h-4 w-4 text-slate-400" />;
    if (readAt) return <CheckCheck className="h-4 w-4 text-emerald-600" />;
    return <Check className="h-4 w-4 text-slate-400" />;
  }, [isMine, isFailed, isOptimistic, readAt]);

  const canEdit = isMine && !isOptimistic && type === "text";
  const canDelete = (!isOptimistic) && (isMine || canModerate);

  async function handleDownload() {
    if (!attachment?.path) return;

    try {
      setDownloading(true);

      const openUrl = (url) => {
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        a.remove();
      };

      if (signedUrl) {
        openUrl(signedUrl);
        return;
      }

      const { data, error } = await createSignedAttachmentUrl(attachment.path, 60 * 30);
      if (error || !data) {
        toast?.({
          variant: "destructive",
          title: "No se pudo descargar",
          description:
            error?.message ||
            "Revisa las policies del bucket chat_attachments (SELECT para participantes).",
        });
        return;
      }

      setSignedUrl(data);
      openUrl(data);
    } finally {
      setDownloading(false);
    }
  }

  const startEdit = () => {
    if (!canEdit) return;
    setDraft(body);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setDraft("");
  };

  const saveEdit = async () => {
    const next = safeStr(draft).trim();
    if (!next) {
      toast?.({ variant: "destructive", title: "Mensaje vacío", description: "No puedes dejar el mensaje vacío." });
      return;
    }
    setIsEditing(false);
    await onEditMessage?.(message, next);
  };

  const confirmDelete = async () => {
    if (!canDelete) return;
    const ok = window.confirm("¿Seguro que quieres eliminar este mensaje?");
    if (!ok) return;
    await onDeleteMessage?.(message);
  };

  return (
    <div className={cn("mb-4 flex w-full", isMine ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[86%] sm:max-w-[70%]", isMine ? "text-right" : "text-left")}>
        {!isMine ? (
          <div className="mb-1 text-xs font-semibold text-slate-600">{senderLabel}</div>
        ) : null}

        <div
          className={cn(
            "group relative rounded-2xl border px-4 py-3 shadow-sm",
            isMine
              ? "border-slate-200 bg-white"
              : "border-slate-200 bg-white"
          )}
        >
          {replyPreview ? (
            <div className="mb-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[11px] font-semibold text-slate-700">
                {replyPreview.author || "Respuesta"}
              </div>
              <div className="truncate text-xs text-slate-600">
                {replyPreview.text || "Mensaje"}
              </div>
            </div>
          ) : null}

          {type === "attachment" && attachment ? (
            <div className="space-y-2">
              <FileBadge attachment={attachment} />
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white",
                    "hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  )}
                >
                  <Download className="h-4 w-4" />
                  {downloading ? "Preparando…" : "Descargar"}
                </button>
                <div className="text-[11px] text-slate-500">
                  {attachment?.mime ? attachment.mime : ""}
                </div>
              </div>
            </div>
          ) : (
            <div className="whitespace-pre-wrap break-words text-sm text-slate-900">
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="Editar mensaje…"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      title="Cancelar"
                    >
                      <X className="h-4 w-4" /> Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={saveEdit}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                      title="Guardar"
                    >
                      <Save className="h-4 w-4" /> Guardar
                    </button>
                  </div>
                </div>
              ) : (
                body
              )}
            </div>
          )}

          <div className="mt-2 flex items-center justify-end gap-2 text-[11px] text-slate-500">
            {timeStr ? <span>{timeStr}</span> : null}
            {statusIcon}
          </div>

          {/* Hover actions */}
          <div className="absolute -right-2 -top-2 hidden gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm group-hover:flex">
            <button
              type="button"
              onClick={() => onReply?.(message)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-700 hover:bg-slate-50"
              aria-label="Responder"
              title="Responder"
            >
              <Reply className="h-4 w-4" />
            </button>

            {canEdit ? (
              <button
                type="button"
                onClick={startEdit}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-700 hover:bg-slate-50"
                aria-label="Editar"
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </button>
            ) : null}

            {canDelete ? (
              <button
                type="button"
                onClick={confirmDelete}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-rose-700 hover:bg-rose-50"
                aria-label="Eliminar"
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {isFailed && tempId ? (
            <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              <div>No se pudo enviar.</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onRetry?.(tempId)}
                  className="rounded-lg bg-white px-2 py-1 font-semibold text-rose-700 hover:bg-rose-100"
                >
                  Reintentar
                </button>
                <button
                  type="button"
                  onClick={() => onDiscard?.(tempId)}
                  className="rounded-lg bg-white px-2 py-1 font-semibold text-rose-700 hover:bg-rose-100"
                >
                  Quitar
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}