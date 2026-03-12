import React from "react";
import { ArrowLeft } from "lucide-react";

export default function ChatTopBar({
  title = "Chat",
  subtitle = "",
  status = "",
  rightBadge = "",
  avatarText = "",
  showBack = false,
  onBack,
  // ✅ NUEVO
  rightActions = null,
}) {
  return (
    <div className="flex items-center justify-between rounded-t-2xl bg-[#0D1B2A] px-4 py-3 text-white">
      <div className="flex items-center gap-3">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white/90 hover:bg-white/10"
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : null}

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
          {avatarText || "•"}
        </div>

        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{title || "Chat"}</div>
          {subtitle ? (
            <div className="truncate text-xs text-white/75">{subtitle}</div>
          ) : null}
        </div>

        {status ? (
          <div className="ml-2 hidden items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/90 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            <span className="whitespace-nowrap">{status}</span>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        {/* ✅ NUEVO: acciones (ej: eliminar chat en modo coach) */}
        {rightActions}

        {rightBadge ? (
          <div className="hidden rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/85 sm:block">
            {rightBadge}
          </div>
        ) : null}
      </div>
    </div>
  );
}