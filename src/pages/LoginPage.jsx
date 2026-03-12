import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff } from "lucide-react";

import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/lib/customSupabaseClient";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

const ACCESS_CODE = "mateolacabra";

function normalizeEmail(v) {
  return (v || "").trim();
}

function normalizeUsername(v) {
  return (v || "").trim();
}

function isValidUsername(v) {
  // 3–24 chars, letters/numbers/._-
  if (!v) return false;
  if (v.length < 3 || v.length > 24) return false;
  return /^[a-zA-Z0-9._-]+$/.test(v);
}

function pendingUsernameKey(email) {
  return `metafit_pending_username:${(email || "").toLowerCase().trim()}`;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Signup-only
  const [username, setUsername] = useState("");
  const [accessCode, setAccessCode] = useState("");

  const headline = useMemo(() => {
    return mode === "signup" ? "Crear cuenta (clientes)" : "Acceso Clientes";
  }, [mode]);

  const subheadline = useMemo(() => {
    return mode === "signup"
      ? "Crea tu cuenta con el código que te proporcionó tu coach."
      : "Inicia sesión para acceder a tu área de cliente.";
  }, [mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const cleanEmail = normalizeEmail(email);
    const cleanPassword = password;
    const cleanUsername = normalizeUsername(username);

    if (!cleanEmail || !cleanPassword) {
      toast({
        variant: "destructive",
        title: "Faltan datos",
        description: "Completa email y contraseña.",
      });
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await signIn(cleanEmail, cleanPassword);
        if (error) {
          // useAuth ya muestra toast, pero garantizamos feedback consistente
          toast({
            variant: "destructive",
            title: "No se pudo iniciar sesión",
            description: error.message,
          });
          return;
        }

        // Si el usuario se registró con confirmación por email, el username puede estar pendiente
        const key = pendingUsernameKey(cleanEmail);
        const pending = localStorage.getItem(key);
        if (pending) {
          try {
            await supabase.rpc("set_my_username", { p_username: pending });
            localStorage.removeItem(key);
          } catch (_) {
            // No bloqueamos el login por esto
          }
        }

        toast({
          title: "Sesión iniciada",
          description: "Acceso correcto. Entrando...",
        });
        navigate("/app");
        return;
      }

      // SIGNUP
      if (accessCode.trim() !== ACCESS_CODE) {
        toast({
          variant: "destructive",
          title: "Código incorrecto",
          description: "Necesitas un código válido proporcionado por tu coach.",
        });
        return;
      }

      if (!isValidUsername(cleanUsername)) {
        toast({
          variant: "destructive",
          title: "Username no válido",
          description: "Usa 3–24 caracteres: letras, números, '.', '_' o '-'.",
        });
        return;
      }

      const emailRedirectTo = `${window.location.origin}/login`;

      const { data, error } = await signUp(cleanEmail, cleanPassword, {
        emailRedirectTo,
        data: {
          username: cleanUsername,
          role: "client",
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "No se pudo crear la cuenta",
          description: error.message,
        });
        return;
      }

      // Si hay sesión (email confirm desactivado), guardamos username inmediatamente
      if (data?.session) {
        try {
          await supabase.rpc("set_my_username", { p_username: cleanUsername });
        } catch (err) {
          const msg = (err && (err.message || err.toString())) || "Error desconocido";
          toast({
            variant: "destructive",
            title: "Cuenta creada, pero hubo un problema con el username",
            description: msg,
          });
          // No bloqueamos; el usuario ya existe.
        }
      } else {
        // Si requiere confirmación por email, no hay session: guardamos localmente y se setea tras el primer login.
        localStorage.setItem(pendingUsernameKey(cleanEmail), cleanUsername);
      }

      toast({
        title: "Cuenta creada",
        description:
          "Si tu cuenta requiere confirmación, revisa tu correo. Después inicia sesión para entrar.",
      });

      setMode("login");
      // Mantiene el email para que sea fácil iniciar sesión luego
      setPassword("");
      setAccessCode("");
      // username lo mantenemos para reutilización si el usuario vuelve a signup; no molesta.
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{headline} - Metafit Coaching</title>
      </Helmet>

      {/* El Header es fixed. Este padding evita que el contenido quede oculto/cortado */}
      <div className="pt-24 pb-16 px-4 bg-white">
        <div className="mx-auto w-full max-w-md">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mx-auto">
              <User className="w-6 h-6 text-[#0D1B2A]" />
            </div>

            <h1 className="mt-5 text-2xl font-bold text-black text-center">{headline}</h1>
            <p className="mt-2 text-sm text-black/70 text-center">{subheadline}</p>

            {/* Tabs */}
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={[
                  "w-full rounded-lg border px-3 py-2 text-sm font-semibold transition",
                  mode === "login"
                    ? "bg-[#0D1B2A] text-white border-[#0D1B2A]"
                    : "bg-white text-black border-gray-200 hover:bg-gray-50",
                ].join(" ")}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={[
                  "w-full rounded-lg border px-3 py-2 text-sm font-semibold transition",
                  mode === "signup"
                    ? "bg-[#0D1B2A] text-white border-[#0D1B2A]"
                    : "bg-white text-black border-gray-200 hover:bg-gray-50",
                ].join(" ")}
              >
                Crear cuenta
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-black placeholder:text-gray-400 focus:ring-2 focus:ring-[#0D1B2A] focus:border-transparent outline-none transition"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 bg-white text-black placeholder:text-gray-400 focus:ring-2 focus:ring-[#0D1B2A] focus:border-transparent outline-none transition"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {mode === "signup" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-black placeholder:text-gray-400 focus:ring-2 focus:ring-[#0D1B2A] focus:border-transparent outline-none transition"
                      placeholder="ej: comba_23"
                    />
                    <p className="mt-2 text-xs text-black/70">
                      Solo letras, números, ".", "_" o "-" (3–24 caracteres).
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">
                      Código de acceso
                    </label>
                    <input
                      type="password"
                      required
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-black placeholder:text-gray-400 focus:ring-2 focus:ring-[#0D1B2A] focus:border-transparent outline-none transition"
                      placeholder="Código proporcionado por tu coach"
                    />
                    <p className="mt-2 text-xs text-black/70">
                      Necesitas un código válido proporcionado por tu coach.
                    </p>
                  </div>
                </>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-bold bg-[#0D1B2A] hover:bg-[#0B1724] text-white rounded-lg"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Procesando...
                  </span>
                ) : mode === "login" ? (
                  "Entrar"
                ) : (
                  "Crear cuenta"
                )}
              </Button>

              <div className="text-center text-sm text-black/70">
                {mode === "login" ? (
                  <p>
                    ¿No tienes cuenta?{" "}
                    <button
                      type="button"
                      className="text-black font-bold hover:underline"
                      onClick={() => setMode("signup")}
                    >
                      Crear cuenta
                    </button>
                  </p>
                ) : (
                  <p>
                    ¿Ya tienes cuenta?{" "}
                    <button
                      type="button"
                      className="text-black font-bold hover:underline"
                      onClick={() => setMode("login")}
                    >
                      Inicia sesión
                    </button>
                  </p>
                )}
              </div>
            </form>

            <div className="mt-6 text-center text-xs text-black/60">
              Al crear una cuenta aceptas el uso del área de clientes de Metafit.
            </div>

            <div className="mt-6 text-center text-sm text-black/70">
              <p>¿No eres cliente aún?</p>
              <Link to="/agendar" className="text-black font-bold hover:underline">
                Agenda tu llamada gratuita
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}