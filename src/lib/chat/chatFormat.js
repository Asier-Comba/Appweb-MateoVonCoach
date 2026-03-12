/**
 * Metafit Messenger | Formatting helpers
 * - Mantener este archivo sin dependencias de React.
 */

export function safeStr(v, fallback = "") {
  if (v === null || v === undefined) return fallback;
  return String(v);
}

export function initialsFromProfile(profile) {
  const name = safeStr(profile?.full_name || profile?.name || profile?.username || "").trim();
  if (name) {
    const parts = name.split(/\s+/).slice(0, 2);
    return parts.map(p => p[0]?.toUpperCase()).join("");
  }
  const email = safeStr(profile?.email || "").trim();
  if (email) return email.slice(0, 2).toUpperCase();
  return "U";
}

export function displayNameFromProfile(profile) {
  const name = safeStr(profile?.full_name || profile?.name || "").trim();
  if (name) return name;
  const username = safeStr(profile?.username || "").trim();
  if (username) return username;
  const email = safeStr(profile?.email || "").trim();
  if (email) return email;
  return "Usuario";
}

function getYmdParts(date, { timeZone, locale } = {}) {
  // Robust: usa formatToParts con TZ/locale, sin librerías.
  const d = date instanceof Date ? date : new Date(date);
  const fmt = new Intl.DateTimeFormat(locale || undefined, {
    timeZone: timeZone || undefined,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(d);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return {
    y: Number(map.year),
    m: Number(map.month),
    d: Number(map.day),
  };
}

export function formatTime(iso, { timeZone, locale } = {}) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(locale || undefined, {
      timeZone: timeZone || undefined,
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "";
  }
}

export function formatDayLabel(iso, { timeZone, locale } = {}) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const now = new Date();

    const a = getYmdParts(d, { timeZone, locale });
    const b = getYmdParts(now, { timeZone, locale });

    const aKey = `${a.y}-${a.m}-${a.d}`;
    const bKey = `${b.y}-${b.m}-${b.d}`;
    if (aKey === bKey) return "Hoy";

    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const yParts = getYmdParts(y, { timeZone, locale });
    const yKey = `${yParts.y}-${yParts.m}-${yParts.d}`;
    if (aKey === yKey) return "Ayer";

    return new Intl.DateTimeFormat(locale || undefined, {
      timeZone: timeZone || undefined,
      weekday: "short",
      day: "2-digit",
      month: "short",
    }).format(d);
  } catch {
    return "";
  }
}

export function isSameDay(aIso, bIso, { timeZone, locale } = {}) {
  if (!aIso || !bIso) return false;
  try {
    const a = getYmdParts(new Date(aIso), { timeZone, locale });
    const b = getYmdParts(new Date(bIso), { timeZone, locale });
    return a.y === b.y && a.m === b.m && a.d === b.d;
  } catch {
    return false;
  }
}

export function sortThreadsByLastActivityDesc(a, b) {
  const at = a?.last_message_at ? new Date(a.last_message_at).getTime() : 0;
  const bt = b?.last_message_at ? new Date(b.last_message_at).getTime() : 0;
  return bt - at;
}

export function normalizeSearch(s) {
  return safeStr(s).toLowerCase().trim();
}

export function threadPreviewText(thread) {
  const txt = safeStr(thread?.last_message || "").trim();
  return txt || "Sin mensajes aún";
}

export function clamp(n, min, max) {
  const x = Number(n);
  if (Number.isNaN(x)) return min;
  return Math.max(min, Math.min(max, x));
}

export function fileIconHint(mime) {
  const t = safeStr(mime).toLowerCase();
  if (t.startsWith("image/")) return "image";
  if (t.includes("pdf")) return "pdf";
  if (t.includes("audio")) return "audio";
  if (t.includes("video")) return "video";
  return "file";
}

export function formatBytes(bytes) {
  const b = Number(bytes);
  if (!b || b < 1) return "";
  const units = ["B", "KB", "MB", "GB"];
  let u = 0;
  let v = b;
  while (v >= 1024 && u < units.length - 1) { v /= 1024; u += 1; }
  return `${v.toFixed(v >= 10 || u === 0 ? 0 : 1)} ${units[u]}`;
}