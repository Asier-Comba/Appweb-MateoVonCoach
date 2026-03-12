import React, { useEffect, useMemo, useRef, useState } from "react";
import { Paperclip, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { safeStr } from "@/lib/chat/chatFormat";

/**
 * MessageComposer (v6)
 * - Simple, estable y con buen UX.
 * - Sin "Plantillas" (lo pediste explícitamente).
 * - Texto siempre visible (negro).
 */
export default function MessageComposer({
  threadId,
  senderId,
  disabled = false,
  placeholder = "Escribe un mensaje…",
  replyTo = null,
  onCancelReply,
  onTyping,
  onSendText,
  onSendAttachment,
  toast,
}) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimerRef = useRef(null);

  const canSend = useMemo(() => {
    return !disabled && !!senderId && !!threadId && safeStr(text).trim().length > 0 && !isSending;
  }, [disabled, senderId, threadId, text, isSending]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    };
  }, []);

  function setTypingSafe(isTyping) {
    try {
      onTyping?.(!!isTyping);
    } catch {
      // ignore
    }
  }

  function scheduleTypingOff() {
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => setTypingSafe(false), 900);
  }

  function handleChange(e) {
    const v = e.target.value;
    setText(v);
    setTypingSafe(true);
    scheduleTypingOff();
  }

  async function handleSend() {
    if (!canSend) return;
    const payload = safeStr(text).trim();
    if (!payload) return;

    setIsSending(true);
    setTypingSafe(false);

    try {
      await onSendText?.({ text: payload, replyToId: replyTo?.id || null });
      setText("");
      requestAnimationFrame(() => textareaRef.current?.focus());
    } catch (err) {
      toast?.({
        variant: "destructive",
        title: "No se pudo enviar",
        description: err?.message || String(err),
      });
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(e) {
    // Enter envía, Shift+Enter nueva línea. Ctrl/Cmd+Enter también envía.
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function openFilePicker() {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  }

  async function onPickFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset
    if (!file) return;

    if (!onSendAttachment) {
      toast?.({
        variant: "destructive",
        title: "Adjuntos no disponibles",
        description: "Falta onSendAttachment en el componente.",
      });
      return;
    }

    setIsUploading(true);
    try {
      await onSendAttachment(file, { replyToId: replyTo?.id || null });
      requestAnimationFrame(() => textareaRef.current?.focus());
    } catch (err) {
      toast?.({
        variant: "destructive",
        title: "No se pudo subir el archivo",
        description: err?.message || String(err),
      });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="border-t border-slate-200 bg-white px-3 py-3">
      {replyTo ? (
        <div className="mb-2 flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-700">Respondiendo…</div>
            <div className="truncate text-xs text-slate-600">
              {safeStr(replyTo?.body || "").trim() || "Mensaje"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onCancelReply?.()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Cancelar respuesta"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={openFilePicker}
          disabled={disabled || isUploading}
          className={cn(
            "inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700",
            "hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          )}
          aria-label="Adjuntar archivo"
          title="Adjuntar archivo"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={onPickFile}
        />

        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className={cn(
              "w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3",
              "text-sm text-slate-900 placeholder:text-slate-400 outline-none",
              "focus:border-slate-300 focus:ring-2 focus:ring-slate-200/60"
            )}
          />
          <div className="mt-1 text-[11px] text-slate-400">
            Enter envía · Shift+Enter añade una línea · Ctrl/Cmd+Enter también envía.
          </div>
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white",
            "hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          )}
        >
          <Send className="h-4 w-4" />
          {isSending ? "Enviando" : "Enviar"}
        </button>
      </div>
    </div>
  );
}