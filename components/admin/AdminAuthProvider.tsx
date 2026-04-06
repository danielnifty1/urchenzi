"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { refreshSession } from "@/services/authApi";
import { loginAsAdmin, logoutAdmin, NotAdminError } from "@/services/adminAuthApi";
import type { UserSession } from "@/types";

type AdminAuthState = {
  user: UserSession | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AdminAuthState | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const normalizedPath = pathname.replace(/\/$/, "") || "/";
  const isLoginRoute = normalizedPath === "/admin/login";
  const [user, setUser] = useState<UserSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const session = await refreshSession();
        if (cancelled) return;
        if (session.role === "admin") {
          setUser(session);
          if (isLoginRoute) {
            router.replace("/admin");
          }
        } else {
          setUser(null);
          if (!isLoginRoute) {
            router.replace("/admin/login");
          }
        }
      } catch {
        setUser(null);
        if (!isLoginRoute) {
          router.replace("/admin/login");
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoginRoute, router]);

  const login = useCallback(
    async (email: string, password: string) => {
      const session = await loginAsAdmin(email, password);
      setUser(session);
      router.replace("/admin");
    },
    [router],
  );

  const logout = useCallback(async () => {
    await logoutAdmin();
    setUser(null);
    router.replace("/admin/login");
  }, [router]);

  const refresh = useCallback(async () => {
    const session = await refreshSession();
    if (session.role !== "admin") {
      setUser(null);
      router.replace("/admin/login");
      return;
    }
    setUser(session);
  }, [router]);

  const value = useMemo(
    () => ({ user, ready, login, logout, refresh }),
    [user, ready, login, logout, refresh],
  );

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Loading admin session…
      </div>
    );
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminAuth(): AdminAuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAdminAuth must be used under AdminAuthProvider");
  return v;
}

export { NotAdminError };
