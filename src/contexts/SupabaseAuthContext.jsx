import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
        }
      } catch (error) {
        console.error("Auth session error:", error);
        // If the refresh token is invalid, we must clear the local session to prevent loops
        if (mounted) {
          setSession(null);
          setUser(null);
        }
        // Force a sign out to clear invalid tokens from local storage
        // This is crucial for "Refresh Token Not Found" errors to prevent infinite reload loops
        await supabase.auth.signOut();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (mounted) {
        // If we get a signed out event, or if the session is null (which happens on invalid token), clear state
        if (event === 'SIGNED_OUT' || !currentSession) {
            setSession(null);
            setUser(null);
            setLoading(false);
        } else if (currentSession) {
            setSession(currentSession);
            setUser(currentSession.user ?? null);
            setLoading(false);
        }
        
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email, password, options) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });
    if (error) {
      toast({ variant: "destructive", title: "Error al registrarse", description: error.message });
    }
    return { data, error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      toast({ variant: "destructive", title: "Error al iniciar sesión", description: error.message });
    }
    return { data, error };
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn("Error signing out:", error.message);
      }
    } catch (error) {
      console.error("Unexpected error signing out:", error);
    } finally {
      // Always clear local state
      setUser(null);
      setSession(null);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }), [user, session, loading, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};