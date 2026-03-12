import { supabase } from "@/lib/customSupabaseClient";

/**
 * Metafit Messenger | Supabase data-access layer
 * - Todas las funciones devuelven { data, error } (estilo Supabase).
 * - Mantener este archivo sin dependencias de React.
 */

const THREADS_TABLE = "chat_threads";
const MESSAGES_TABLE = "chat_messages";

// Nota importante (Supabase/PostgREST):
// En algunos proyectos el FK entre chat_threads.client_id -> profiles.id puede no existir
// (o tener otro nombre). Cuando eso pasa, los selects embebidos tipo:
//   client:profiles!chat_threads_client_id_fkey(...)
// fallan con:
//   "Could not find a relationship between 'chat_threads' and 'profiles' in the schema cache"
// Para que el chat sea robusto, evitamos depender de ese FK para los joins y hacemos
// un "hydrate" manual: primero traemos threads y luego cargamos perfiles por ids.

// ----------------------
// Profiles
// ----------------------

const PROFILE_SELECT =
  "id, email, full_name, name, username, role, timezone, locale, created_at";

export async function fetchMyProfile(userId) {
  if (!userId) return { data: null, error: new Error("Missing userId") };
  return await supabase.from("profiles").select(PROFILE_SELECT).eq("id", userId).single();
}

export async function fetchProfileById(userId) {
  if (!userId) return { data: null, error: new Error("Missing userId") };
  return await supabase.from("profiles").select(PROFILE_SELECT).eq("id", userId).maybeSingle();
}

/**
 * Guarda (best-effort) timezone/locale en profiles.
 * Requiere RLS que permita a cada usuario actualizar su propia fila.
 */
export async function updateMyLocaleTimezone({ userId, timezone = null, locale = null } = {}) {
  if (!userId) return { data: null, error: new Error("Missing userId") };

  const patch = {};
  if (timezone) patch.timezone = timezone;
  if (locale) patch.locale = locale;

  if (!Object.keys(patch).length) return { data: null, error: null };

  return await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("id, timezone, locale")
    .single();
}

// ----------------------
// Admin discovery
// ----------------------

export async function getPrimaryAdminId() {
  // RPC recomendado (evita hardcodear emails en frontend)
  const { data, error } = await supabase.rpc("get_primary_admin_id");
  if (error) return { data: null, error };
  return { data: data ?? null, error: null };
}

// ----------------------
// Client search (coach)
// ----------------------

/**
 * Búsqueda de clientes.
 * - Preferido: RPC search_clients(p_query, p_limit)
 * - Fallback: query directa sobre profiles
 */
export async function searchClients({ query = "", term = "", limit = 20 } = {}) {
  const q = String(query || term || "").trim();

  // 1) RPC (si está desplegado)
  try {
    const { data, error } = await supabase.rpc("search_clients", {
      p_query: q,
      p_limit: limit,
    });
    if (!error) return { data: Array.isArray(data) ? data : [], error: null };
  } catch {
    // ignore -> fallback
  }

  // 2) Fallback: profiles
  return await fetchClientsForCoach({ search: q, limit });
}

export async function fetchClientsForCoach({ search = "", limit = 50 } = {}) {
  // Para “Nuevo chat”: listamos clients
  let q = supabase
    .from("profiles")
    .select("id, email, full_name, name, username, role, created_at")
    // role puede venir null o vacío en proyectos antiguos
    .or("role.eq.client,role.is.null,role.eq.")
    .order("created_at", { ascending: false })
    .limit(limit);

  const s = String(search || "").trim();
  if (s) {
    q = q.or(
      [
        `email.ilike.%${s}%`,
        `full_name.ilike.%${s}%`,
        `name.ilike.%${s}%`,
        `username.ilike.%${s}%`,
      ].join(",")
    );
  }
  return await q;
}

// ----------------------
// Thread hydration helpers
// ----------------------

async function fetchProfilesByIds(ids = []) {
  const unique = Array.from(new Set((ids || []).filter(Boolean)));
  if (!unique.length) return { data: [], error: null };

  // Nota: si tu RLS en profiles no permite al admin leer otros perfiles,
  // esta llamada podría fallar. En ese caso la UI seguirá funcionando,
  // pero mostrará email/id como fallback.
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, name, username, role, timezone, locale, created_at")
    .in("id", unique);

  return { data: Array.isArray(data) ? data : [], error: error ?? null };
}

async function hydrateThreadsWithClients(threads = []) {
  const arr = Array.isArray(threads) ? threads : [];
  const clientIds = arr.map((t) => t?.client_id).filter(Boolean);
  const { data: profiles } = await fetchProfilesByIds(clientIds);
  const map = new Map((profiles || []).map((p) => [p.id, p]));
  return arr.map((t) => ({
    ...t,
    client: map.get(t.client_id) || t.client || null,
  }));
}

// ----------------------
// Threads
// ----------------------

export async function ensureClientThread({ clientId, adminId }) {
  if (!clientId || !adminId) return { data: null, error: new Error("Missing ids") };
  if (clientId === adminId) return { data: null, error: new Error("Self-chat not allowed") };

  const { data: existing, error: e1 } = await supabase
    .from(THREADS_TABLE)
    .select("*")
    .eq("client_id", clientId)
    .eq("admin_id", adminId)
    .maybeSingle();

  if (e1 && e1.code !== "PGRST116") return { data: null, error: e1 };
  if (existing) return { data: existing, error: null };

  const { data: created, error: e2 } = await supabase
    .from(THREADS_TABLE)
    .insert([{ client_id: clientId, admin_id: adminId }])
    .select("*")
    .single();

  return { data: created ?? null, error: e2 ?? null };
}

export async function createThreadAsCoach({ adminId, clientId }) {
  if (!adminId || !clientId) return { data: null, error: new Error("Missing ids") };
  if (adminId === clientId) return { data: null, error: new Error("Self-chat not allowed") };

  // Intenta encontrar thread existente.
  // IMPORTANTE: evitamos join embebido con profiles para no depender del nombre (o existencia)
  // del FK en PostgREST.
  const { data: existingRaw, error: e1 } = await supabase
    .from(THREADS_TABLE)
    .select("id, client_id, admin_id, last_message, last_message_at, unread_by_admin, unread_by_client, updated_at, created_at")
    .eq("client_id", clientId)
    .eq("admin_id", adminId)
    .maybeSingle();

  if (e1 && e1.code !== "PGRST116") return { data: null, error: e1 };
  if (existingRaw) {
    const [hydrated] = await hydrateThreadsWithClients([existingRaw]);
    return { data: hydrated, error: null };
  }

  // Crea y devuelve el thread + perfil del cliente (hidratado)
  const { data: createdRaw, error: e2 } = await supabase
    .from(THREADS_TABLE)
    .insert([{ client_id: clientId, admin_id: adminId }])
    .select("id, client_id, admin_id, last_message, last_message_at, unread_by_admin, unread_by_client, updated_at, created_at")
    .single();

  if (e2) return { data: null, error: e2 };
  const [hydrated] = await hydrateThreadsWithClients([createdRaw]);
  return { data: hydrated, error: null };
}

export async function fetchThreadsForAdmin({ adminId, search = "", onlyUnread = false, limit = 100 } = {}) {
  if (!adminId) return { data: null, error: new Error("Missing adminId") };

  let q = supabase
    .from(THREADS_TABLE)
    .select("id, client_id, admin_id, last_message, last_message_at, unread_by_admin, unread_by_client, updated_at, created_at")
    .eq("admin_id", adminId)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  const s = String(search || "").trim();
  if (s) q = q.ilike("last_message", `%${s}%`);
  if (onlyUnread) q = q.gt("unread_by_admin", 0);

  const { data, error } = await q;
  if (error) return { data: null, error };
  const hydrated = await hydrateThreadsWithClients(data || []);
  return { data: hydrated, error: null };
}

// ✅ Vaciar conversación (no borra el thread, solo mensajes)
export async function clearThreadMessages(threadId) {
  if (!threadId) return { data: null, error: new Error("Missing threadId") };

  // 1) borrar mensajes del thread
  const del = await supabase.from(MESSAGES_TABLE).delete().eq("thread_id", threadId);
  if (del.error) return { data: null, error: del.error };

  // 2) resetear preview/contadores (best-effort)
  const patch = {
    last_message: null,
    last_message_at: null,
    unread_by_admin: 0,
    unread_by_client: 0,
    updated_at: new Date().toISOString(),
  };

  const upd = await supabase
    .from(THREADS_TABLE)
    .update(patch)
    .eq("id", threadId)
    .select("id, last_message, last_message_at, unread_by_admin, unread_by_client, updated_at")
    .maybeSingle();

  // si no puede actualizar por RLS, igualmente ya borró mensajes
  return { data: upd.data ?? null, error: upd.error ?? null };
}

/**
 * ✅ NUEVO (lo que te faltaba para “eliminar conversación” de verdad):
 * Hard delete: borra mensajes + borra el thread.
 * - Si tu UI quiere “considerarlo eliminado”, esta es la opción pro.
 * - Requiere policies de DELETE en chat_messages + chat_threads para el admin/coach.
 */
export async function deleteThreadForAdmin(threadId) {
  if (!threadId) return { data: null, error: new Error("Missing threadId") };

  // 1) borra mensajes
  const delMsgs = await supabase.from(MESSAGES_TABLE).delete().eq("thread_id", threadId);
  if (delMsgs.error) return { data: null, error: delMsgs.error };

  // 2) borra thread
  const delThread = await supabase.from(THREADS_TABLE).delete().eq("id", threadId);
  if (delThread.error) return { data: null, error: delThread.error };

  return { data: true, error: null };
}

// ----------------------
// Messages
// ----------------------

export async function fetchMessages({ threadId, beforeIso = null, limit = 50 } = {}) {
  if (!threadId) return { data: null, error: new Error("Missing threadId") };

  let q = supabase
    .from(MESSAGES_TABLE)
    .select("id, thread_id, sender_id, body, read_at, created_at, reply_to_id, type, meta")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (beforeIso) q = q.lt("created_at", beforeIso);

  const res = await q;
  if (res.data) res.data = [...res.data].reverse();
  return res;
}

export async function sendMessage({ threadId, senderId, body, replyToId = null, type = "text", meta = {} } = {}) {
  if (!threadId || !senderId) return { data: null, error: new Error("Missing ids") };

  const payload = {
    thread_id: threadId,
    sender_id: senderId,
    body: String(body || "").trim(),
    reply_to_id: replyToId || null,
    type: type || "text",
    meta: meta || {},
  };

  return await supabase
    .from(MESSAGES_TABLE)
    .insert([payload])
    .select("id, thread_id, sender_id, body, read_at, created_at, reply_to_id, type, meta")
    .single();
}

// ✅ Editar mensaje (texto)
export async function updateMessageBody({ messageId, threadId = null, body, meta = null } = {}) {
  if (!messageId) return { data: null, error: new Error("Missing messageId") };

  const patch = {
    body: String(body || "").trim(),
  };

  // Si queremos marcar editado sin tocar esquema: lo guardamos en meta
  if (meta && typeof meta === "object") patch.meta = meta;

  let q = supabase.from(MESSAGES_TABLE).update(patch).eq("id", messageId);

  // Safety extra: si viene threadId, limitamos también por thread_id
  if (threadId) q = q.eq("thread_id", threadId);

  return await q
    .select("id, thread_id, sender_id, body, read_at, created_at, reply_to_id, type, meta")
    .single();
}

// ✅ Borrar mensaje (hard delete)
export async function deleteMessage({ messageId, threadId = null } = {}) {
  if (!messageId) return { data: null, error: new Error("Missing messageId") };

  let q = supabase.from(MESSAGES_TABLE).delete().eq("id", messageId);
  if (threadId) q = q.eq("thread_id", threadId);
  return await q;
}

export async function markThreadRead(threadId) {
  if (!threadId) return { data: null, error: new Error("Missing threadId") };
  return await supabase.rpc("mark_thread_read", { p_thread_id: threadId });
}

export function subscribeToThreadMessages(threadId, onChange) {
  const channel = supabase
    .channel(`realtime:${MESSAGES_TABLE}:${threadId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: MESSAGES_TABLE, filter: `thread_id=eq.${threadId}` },
      (payload) => onChange?.(payload)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToAdminThreads(adminId, onChange) {
  const channel = supabase
    .channel(`realtime:${THREADS_TABLE}:admin:${adminId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: THREADS_TABLE, filter: `admin_id=eq.${adminId}` },
      (payload) => onChange?.(payload)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ----------------------
// Presence + typing
// ----------------------

export function createPresenceChannel({ threadId, userId, onPresence, onTyping }) {
  const channel = supabase.channel(`presence:thread:${threadId}`, {
    config: { presence: { key: userId } },
  });

  channel.on("presence", { event: "sync" }, () => {
    const state = channel.presenceState();
    onPresence?.(state);
  });

  channel.on("broadcast", { event: "typing" }, (payload) => {
    onTyping?.(payload?.payload);
  });

  channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      try {
        await channel.track({ online_at: new Date().toISOString() });
      } catch {
        // ignore
      }
    }
  });

  return {
    channel,
    async sendTyping(isTyping) {
      try {
        await channel.send({
          type: "broadcast",
          event: "typing",
          payload: { threadId, userId, isTyping: !!isTyping, at: Date.now() },
        });
      } catch {
        // ignore
      }
    },
    cleanup() {
      supabase.removeChannel(channel);
    },
  };
}

// ----------------------
// Storage (attachments)
// ----------------------

/**
 * Adjuntos en bucket privado: chat_attachments
 * Ruta (IMPORTANTÍSIMO para policies): chat/<uploader_uid>/<thread_id>/<uuid>-<filename>
 */
export async function uploadAttachment({ file, userId, threadId }) {
  if (!file || !userId || !threadId) return { data: null, error: new Error("Missing upload params") };

  const safeName = String(file.name || "file").replace(/[^\w.\-]+/g, "_");
  const uuid = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
  const key = `chat/${userId}/${threadId}/${uuid}-${safeName}`;

  const bucket = supabase.storage.from("chat_attachments");
  const { data, error } = await bucket.upload(key, file, {
    upsert: false,
    contentType: file.type || "application/octet-stream",
  });
  if (error) return { data: null, error };

  return {
    data: {
      path: data.path,
      mime: file.type || "application/octet-stream",
      name: file.name || safeName,
      size: file.size || null,
    },
    error: null,
  };
}

export async function createSignedAttachmentUrl(path, expiresInSec = 3600) {
  if (!path) return { data: null, error: new Error("Missing path") };
  const bucket = supabase.storage.from("chat_attachments");
  const { data, error } = await bucket.createSignedUrl(path, expiresInSec);
  if (error) return { data: null, error };
  return { data: data?.signedUrl ?? null, error: null };
}