"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/lib/supabase/types";

/* ─── Context types ─────────────────────────────────────────── */

interface AuthContextType {
  user: Profile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; pending?: boolean }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string; pending?: boolean }>;
  logout: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  org_code?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ─── Public routes (no auth required) ──────────────────────── */

const PUBLIC_ROUTES = ["/", "/login", "/register", "/pending-approval", "/docs"];

/* ─── Provider ──────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // Restore session on mount
  useEffect(() => {
    const restore = async () => {
      try {
        const stored = localStorage.getItem("dms_user");
        if (stored) {
          const parsed = JSON.parse(stored) as Profile;
          // Verify profile still exists in DB
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", parsed.id)
            .eq("is_active", true)
            .single();
          if (data) {
            // Block pending/rejected users
            if (data.approval_status === "pending" || data.approval_status === "rejected") {
              localStorage.removeItem("dms_user");
            } else {
              setUser(data as Profile);
              localStorage.setItem("dms_user", JSON.stringify(data));
            }
          } else {
            localStorage.removeItem("dms_user");
          }
        }
      } catch {
        localStorage.removeItem("dms_user");
      } finally {
        setIsLoading(false);
      }
    };
    restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Route protection
  useEffect(() => {
    if (isLoading) return;
    const isPublic = PUBLIC_ROUTES.includes(pathname);
    if (user && (pathname === "/login" || pathname === "/register")) {
      router.push("/dashboard");
    }
    if (!user && !isPublic) {
      router.push("/login");
    }
  }, [user, isLoading, pathname, router]);

  /* ─── Login ─────────────────────────────────────────────── */

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string; pending?: boolean }> => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        // Handle pending approval
        if (res.status === 403 && data.approval_status === "pending") {
          setIsLoading(false);
          router.push("/pending-approval");
          return { success: false, pending: true, error: data.error };
        }

        // Handle rejected
        if (res.status === 403 && data.approval_status === "rejected") {
          setIsLoading(false);
          return { success: false, error: data.error };
        }

        if (!res.ok || !data.user) {
          setIsLoading(false);
          return { success: false, error: data.error || "Invalid email or password" };
        }

        setUser(data.user);
        localStorage.setItem("dms_user", JSON.stringify(data.user));
        setIsLoading(false);
        router.push("/dashboard");
        return { success: true };
      } catch {
        setIsLoading(false);
        return { success: false, error: "Network error" };
      }
    },
    [router]
  );

  /* ─── Register ──────────────────────────────────────────── */

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

        // If user is pending approval, don't log them in
        if (result.pending) {
          return {
            success: false,
            pending: true,
            error: result.message || "Your request to join the organization is pending approval from the Super Admin.",
          };
        }

        setUser(result.user);
        localStorage.setItem("dms_user", JSON.stringify(result.user));
        router.push("/dashboard");
        return { success: true };
      } catch {
        return { success: false, error: "Network error" };
      }
    },
    [router]
  );

  /* ─── Logout ────────────────────────────────────────────── */

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("dms_user");
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
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
