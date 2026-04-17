"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/lib/supabase/types";

/* ─── Context types ─────────────────────────────────────────── */

interface AuthContextType {
  user: Profile | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; pending?: boolean }>;
  register: (
    data: RegisterData
  ) => Promise<{ success: boolean; error?: string; pending?: boolean }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  org_code?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ─── Public routes (client-side UX; server enforces via proxy) ─ */

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/pending-approval",
  "/docs",
];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (pathname.startsWith("/docs/")) return true;
  return false;
}

/* ─── Provider ──────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);

  /* ─── Load profile for the current session ─── */
  const loadProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error || !data) return null;
      return data as Profile;
    },
    [supabase]
  );

  const refresh = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      setUser(null);
      return;
    }
    const profile = await loadProfile(authUser.id);
    if (!profile || !profile.is_active) {
      await supabase.auth.signOut();
      setUser(null);
      return;
    }
    if (profile.approval_status === "rejected") {
      await supabase.auth.signOut();
      setUser(null);
      return;
    }
    setUser(profile);
  }, [supabase, loadProfile]);

  /* ─── Initial load + subscribe to auth state changes ─── */
  useEffect(() => {
    let mounted = true;

    (async () => {
      await refresh();
      if (mounted) setIsLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setUser(null);
        return;
      }
      const profile = await loadProfile(session.user.id);
      if (!profile || !profile.is_active) {
        setUser(null);
        return;
      }
      setUser(profile);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, refresh, loadProfile]);

  /* ─── Client-side route guidance (server enforces via proxy) ─── */
  useEffect(() => {
    if (isLoading) return;
    if (
      user &&
      (pathname === "/login" ||
        pathname === "/register" ||
        pathname === "/forgot-password")
    ) {
      router.push("/dashboard");
    }
    if (!user && !isPublicRoute(pathname)) {
      router.push("/login");
    }
  }, [user, isLoading, pathname, router]);

  /* ─── Login ───────────────────────────────────────────────── */
  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ success: boolean; error?: string; pending?: boolean }> => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase().trim(),
          password,
        });
        if (error || !data.user) {
          setIsLoading(false);
          return { success: false, error: "Invalid email or password" };
        }

        const profile = await loadProfile(data.user.id);
        if (!profile || !profile.is_active) {
          await supabase.auth.signOut();
          setIsLoading(false);
          return { success: false, error: "Account disabled" };
        }
        if (profile.approval_status === "rejected") {
          await supabase.auth.signOut();
          setIsLoading(false);
          return { success: false, error: "Your membership request was rejected." };
        }
        if (profile.approval_status === "pending") {
          // Keep them signed in (Supabase session exists) but route
          // to the pending-approval page. The proxy + requireUser
          // will still block their access to protected APIs.
          setUser(profile);
          setIsLoading(false);
          router.push("/pending-approval");
          return { success: false, pending: true };
        }

        setUser(profile);
        setIsLoading(false);
        router.push("/dashboard");
        return { success: true };
      } catch {
        setIsLoading(false);
        return { success: false, error: "Network error" };
      }
    },
    [supabase, loadProfile, router]
  );

  /* ─── Register ────────────────────────────────────────────── */
  const register = useCallback(
    async (
      regData: RegisterData
    ): Promise<{ success: boolean; error?: string; pending?: boolean }> => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(regData),
        });
        const result = await res.json();
        if (!res.ok) {
          return { success: false, error: result.error || "Registration failed" };
        }

        // After server-side signup + profile creation, sign the user in
        // client-side so the cookie session is set.
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: regData.email.toLowerCase().trim(),
          password: regData.password,
        });
        if (signInErr) {
          return { success: false, error: "Account created but login failed. Try logging in." };
        }

        if (result.pending) {
          await refresh();
          router.push("/pending-approval");
          return { success: false, pending: true, error: result.message };
        }

        await refresh();
        router.push("/dashboard");
        return { success: true };
      } catch {
        return { success: false, error: "Network error" };
      }
    },
    [supabase, refresh, router]
  );

  /* ─── Logout ──────────────────────────────────────────────── */
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
  }, [supabase, router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export type { Profile, UserRole };
