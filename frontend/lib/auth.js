/**
 * Auth context — provides authentication state across the app.
 * Handles login persistence, auto-refresh, and protected routing.
 */

"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "@/lib/api";

const AuthContext = createContext(null);

const PUBLIC_PATHS = ["/login", "/signup", "/"];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check auth state on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (!api.accessToken) {
        setLoading(false);
        if (!PUBLIC_PATHS.includes(pathname)) {
          router.push("/login");
        }
        return;
      }

      try {
        const userData = await api.getMe();
        setUser(userData);
      } catch {
        api.clearTokens();
        if (!PUBLIC_PATHS.includes(pathname)) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Redirect to login on auth errors
  useEffect(() => {
    api.onAuthError = () => {
      setUser(null);
      router.push("/login");
    };
  }, [router]);

  const login = useCallback(async (email, password) => {
    const data = await api.login(email, password);
    setUser(data.user);
    router.push("/chat");
    return data;
  }, [router]);

  const signup = useCallback(async (email, fullName, password, city) => {
    const data = await api.signup(email, fullName, password, city);
    setUser(data.user);
    router.push("/chat");
    return data;
  }, [router]);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
