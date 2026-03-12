import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/components/ui/use-toast";

import InboxCoach from "@/components/chat/InboxCoach";
import ThreadView from "@/components/chat/ThreadView";

import {
  ensureClientThread,
  fetchMyProfile,
  fetchProfileById,
  getPrimaryAdminId,
  updateMyLocaleTimezone,
} from "@/lib/chat/chatApi";

import { displayNameFromProfile, initialsFromProfile } from "@/lib/chat/chatFormat";

/**
 * Metafit Messenger (ChatShell) - v7
 * - Coach/Admin: bandeja estilo WhatsApp (ordenada por actividad) + chat en 2 columnas.
 * - Cliente: una sola pantalla con el chat directo con su coach.
 * - Nombre visible + email debajo (tal y como pediste).
 * - Zona horaria/locale: se guarda best-effort en profiles para render consistente.
 */

function prettyNameFromEmail(email) {
  const e = String(email || "").trim();
  if (!e.includes("@")) return "";
  const local = e.split("@")[0] || "";
  // "iazti.contact" => "Iazti"
  const base = local.split(/[._-]/)[0] || local;
  if (!base) return "";
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function coachTitleFromProfile(profile) {
  const name = displayNameFromProfile(profile);
  const fallback = prettyNameFromEmail(profile?.email) || "Mateo";
  const base = name && name !== profile?.email ? name : fallback;
  return `${base} / Coach`;
}

export default function ChatShell() {
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const meId = user?.id || null;

  const [booting, setBooting] = useState(true);
  const [myProfile, setMyProfile] = useState(null);

  const [primaryAdminId, setPrimaryAdminId] = useState(null);
  const [isCoach, setIsCoach] = useState(false);

  // Cliente: perfil del coach para cabecera
  const [coachProfile, setCoachProfile] = useState(null);

  // Conversación activa (thread) + participante (la otra persona)
  const [thread, setThread] = useState(null);
  const [participant, setParticipant] = useState(null);

  const viewerTimeZone = useMemo(() => {
    let tz;
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      tz = undefined;
    }
    return myProfile?.timezone || tz || undefined;
  }, [myProfile?.timezone]);

  const viewerLocale = useMemo(() => {
    return myProfile?.locale || (typeof navigator !== "undefined" ? navigator.language : undefined);
  }, [myProfile?.locale]);

  // Boot: perfil + admin principal + rol
  useEffect(() => {
    let mounted = true;

    async function boot() {
      if (!meId) return;
      setBooting(true);

      const [pRes, aRes] = await Promise.all([fetchMyProfile(meId), getPrimaryAdminId()]);
      if (!mounted) return;

      const p = pRes?.data || null;
      setMyProfile(p);

      const adminId = aRes?.data || null;
      setPrimaryAdminId(adminId);

      const role = String(p?.role || "").toLowerCase();
      const coachByRole = role === "admin" || role === "coach";
      const coachById = adminId && adminId === meId;
      const isCoachNow = Boolean(coachById || coachByRole);
      setIsCoach(isCoachNow);

      // Best-effort: guarda TZ/locale del usuario
      try {
        let tz = null;
        try {
          tz = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
        } catch {
          tz = null;
        }
        const loc = typeof navigator !== "undefined" ? navigator.language : null;
        if (tz || loc) updateMyLocaleTimezone({ userId: meId, timezone: tz, locale: loc });
      } catch {
        // ignore
      }

      // Si es cliente, carga el perfil del coach para header correcto
      if (!isCoachNow && adminId) {
        const cRes = await fetchProfileById(adminId);
        if (mounted) setCoachProfile(cRes?.data || null);
      }

      if (mounted) setBooting(false);
    }

    if (!loading) boot();

    return () => {
      mounted = false;
    };
  }, [loading, meId]);

  // Cliente: garantiza thread 1:1 con el coach
  useEffect(() => {
    let mounted = true;

    async function initClientThread() {
      if (!meId || isCoach || !primaryAdminId) return;

      const { data, error } = await ensureClientThread({ clientId: meId, adminId: primaryAdminId });
      if (!mounted) return;

      if (error) {
        toast({
          variant: "destructive",
          title: "No se pudo inicializar el chat",
          description: error.message || String(error),
        });
        return;
      }

      setThread(data || null);

      if (coachProfile) {
        setParticipant(coachProfile);
      } else {
        setParticipant({ id: primaryAdminId, email: "vonwuthenaumateo@gmail.com", role: "admin" });
      }
    }

    if (!loading && !booting) initClientThread();

    return () => {
      mounted = false;
    };
  }, [loading, booting, meId, isCoach, primaryAdminId, coachProfile, toast]);

  // Coach/Admin: al seleccionar thread desde la bandeja
  const handleSelectThread = useCallback(async (t) => {
    // ✅ NUEVO: permitir cerrar/deseleccionar chat (cuando lo borras)
    if (!t) {
      setThread(null);
      setParticipant(null);
      return;
    }

    if (!t?.id) return;
    setThread(t);

    // Ideal: viene embebido como t.client desde fetchThreadsForAdmin / createThreadAsCoach
    if (t.client?.id) {
      setParticipant(t.client);
      return;
    }

    // Fallback: si no viene join, lo cargamos por id
    const cid = t.client_id;
    if (!cid) return;

    const { data } = await fetchProfileById(cid);
    setParticipant(data || { id: cid, email: "", role: "client" });
  }, []);

  const selectedAvatar = useMemo(() => {
    return participant ? initialsFromProfile(participant) : "•";
  }, [participant]);

  const computedTitle = useMemo(() => {
    if (!user) return "Chat";
    if (isCoach) return participant ? displayNameFromProfile(participant) : "Chat";
    return "Mateo / Coach";
  }, [user, isCoach, participant, coachProfile]);

  const computedSubtitle = useMemo(() => {
    if (!user) return "";
    if (isCoach) return participant?.email ? String(participant.email) : "Selecciona un cliente";
    return coachProfile?.email ? String(coachProfile.email) : "vonwuthenaumateo@gmail.com";
  }, [user, isCoach, participant?.email, coachProfile?.email]);

  const headerTitle = "Chat / Contacto";

  return (
    <div className="h-full">
      <Helmet>
        <title>{headerTitle} | Metafit</title>
      </Helmet>

      {loading || booting ? (
        <div className="flex h-[70vh] items-center justify-center text-slate-600">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparando chat…
        </div>
      ) : !user ? (
        <div className="flex h-[70vh] items-center justify-center text-slate-600">
          Inicia sesión para usar el chat.
        </div>
      ) : (
        <div className="h-[calc(100vh-140px)]">
          <div className="flex h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {isCoach ? (
              <div className="flex h-full w-full flex-col md:flex-row">
                {/* Bandeja (WhatsApp-like) */}
                <div className="h-[300px] shrink-0 border-b border-slate-200 md:h-full md:w-[360px] md:min-w-[320px] md:max-w-[420px] md:border-b-0 md:border-r">
                  <InboxCoach
                    adminId={meId}
                    selectedThreadId={thread?.id || null}
                    onSelectThread={handleSelectThread}
                    toast={toast}
                    viewerTimeZone={viewerTimeZone}
                    viewerLocale={viewerLocale}
                    autoSelectFirst={true}
                  />
                </div>

                {/* Chat */}
                <div className="min-w-0 flex-1">
                  <ThreadView
                    thread={thread}
                    mode="coach"
                    meId={meId}
                    participant={participant}
                    showBack={false}
                    onBack={() => handleSelectThread(null)} // ✅ para cerrar al borrar
                    timeZone={viewerTimeZone}
                    locale={viewerLocale}
                    title={computedTitle}
                    subtitle={computedSubtitle}
                    avatarText={selectedAvatar}
                    toast={toast}
                  />
                </div>
              </div>
            ) : (
              <div className="min-w-0 flex-1">
                <ThreadView
                  thread={thread}
                  mode="client"
                  meId={meId}
                  participant={participant}
                  showBack={false}
                  onBack={() => {}}
                  timeZone={viewerTimeZone}
                  locale={viewerLocale}
                  title={computedTitle}
                  subtitle={computedSubtitle}
                  avatarText={selectedAvatar}
                  toast={toast}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}