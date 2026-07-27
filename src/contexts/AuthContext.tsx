"use client";

import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { createClient } from "@/lib/supabase/client";

const SESSION_BOOTSTRAP_TIMEOUT_MS = 10000;

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: "mentor" | "learner" | "both";
  username: string;
  avatar_url?: string | null;
  is_frozen?: boolean;
  is_admin?: boolean;
  created_at?: string;
}



function withTimeout<T>(promise: Promise<T>, ms: number, label = "Operation"): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]);
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => void;
  pendingPasswordReset: boolean;
  setPendingPasswordReset: (value: boolean) => void;
  frozenNotice: boolean;
  clearFrozenNotice: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Ported from connectfront/src/contexts/AuthContext.js (session/profile bootstrap, dual-role, frozen-account handling). */
export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingPasswordReset, setPendingPasswordReset] = useState(false);
  const [frozenNotice, setFrozenNotice] = useState(false);
  const cancelledRef = useRef(false);
  const clearFrozenNotice = useCallback(() => setFrozenNotice(false), []);

  const recoverProfile = useCallback(
    async (userId: string) => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (!authUser?.email) return false;
        const prefix = authUser.email
          .split("@")[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .substring(0, 15);
        const username = `${prefix}_${Math.random().toString(36).substring(2, 6)}`;
        const { error } = await supabase.from("profiles").insert({
          id: userId,
          email: authUser.email,
          name: authUser.user_metadata?.full_name || authUser.email.split("@")[0],
          role: "both",
          username,
          created_at: new Date().toISOString(),
        });
        return !error;
      } catch {
        return false;
      }
    },
    [supabase],
  );

  const fetchProfile = useCallback(
    async function fetchProfileImpl(userId: string): Promise<void> {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .abortSignal(controller.signal)
          .single();

        clearTimeout(timeoutId);

        if (error) {
          console.warn("Profile fetch error:", error.message, error.code || "");

          if (error.code === "PGRST116" || error.message.includes("not found")) {
            const recovered = await recoverProfile(userId);
            if (recovered) {
              await fetchProfileImpl(userId);
              return;
            }
            await supabase.auth.signOut({ scope: "local" });
            setSession(null);
            setUser(null);
            setProfile(null);
            setLoading(false);
            return;
          }
          setLoading(false);
          return;
        }

        if (!data) {
          setProfile(null);
        } else if (data.is_frozen === true) {
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
          setFrozenNotice(true);
          setLoading(false);
          return;
        } else {
          setProfile(data as Profile);
        }
        setLoading(false);
      } catch (error) {
        clearTimeout(timeoutId);
        if ((error as Error)?.name === "AbortError") {
          console.warn("Profile fetch timed out after 8s");
          setLoading(false);
          return;
        }
        console.error("Profile fetch exception:", (error as Error)?.message);
        setLoading(false);
      }
    },
    [supabase, recoverProfile],
  );

  useEffect(() => {
    cancelledRef.current = false;

    const clearLoading = () => {
      if (!cancelledRef.current) setLoading(false);
    };
    const safetyTimer = setTimeout(clearLoading, SESSION_BOOTSTRAP_TIMEOUT_MS);

    const bootstrapSession = async () => {
      try {
        const {
          data: { session: initialSession },
          error,
        } = await withTimeout(
          supabase.auth.getSession(),
          SESSION_BOOTSTRAP_TIMEOUT_MS,
          "Session bootstrap",
        );
        if (error) throw error;
        if (cancelledRef.current) return;

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          fetchProfile(initialSession.user.id);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error("Session bootstrap failed:", (error as Error)?.message || error);
        if (!cancelledRef.current) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } finally {
        clearTimeout(safetyTimer);
        clearLoading();
      }
    };

    bootstrapSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (cancelledRef.current) return;
      if (newSession?.user) {
        setSession(newSession);
        setUser(newSession.user);
        fetchProfile(newSession.user.id);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
      clearTimeout(safetyTimer);
      clearLoading();
    });

    return () => {
      cancelledRef.current = true;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    setUser(null);
    setProfile(null);
  }, [supabase]);

  const refreshProfile = useCallback(() => {
    if (user) fetchProfile(user.id);
  }, [user, fetchProfile]);

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      signOut,
      refreshProfile,
      pendingPasswordReset,
      setPendingPasswordReset,
      frozenNotice,
      clearFrozenNotice,
    }),
    [
      session,
      user,
      profile,
      loading,
      signOut,
      refreshProfile,
      pendingPasswordReset,
      frozenNotice,
      clearFrozenNotice,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
