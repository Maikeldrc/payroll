import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { auth, authPersistenceReady, loginWithEmail, logoutFirebase, signInWithGoogle, subscribeToAuthChanges } from "../lib/firebase";
import type { UserRole } from "../types";
import { isRoleName } from "../../shared/authorization";
import { getBackendUrl } from "../config/runtime";

const IDLE_TIMEOUT_MS = Number(import.meta.env.VITE_IDLE_TIMEOUT_MS || 15 * 60 * 1000);
const ABSOLUTE_TIMEOUT_MS = Number(import.meta.env.VITE_ABSOLUTE_TIMEOUT_MS || 8 * 60 * 60 * 1000);

export interface AuthClaims {
  role: UserRole;
  organizationIds: string[];
  practiceIds: string[];
  providerIds: string[];
  careManagerIds: string[];
  patientIds: string[];
  serviceCodes: string[];
}

interface AuthContextValue {
  user: User | null;
  claims: AuthClaims | null;
  loading: boolean;
  accessError: string | null;
  signInEmail: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  logout: (reason?: string) => Promise<void>;
  getIdToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

async function readClaims(user: User): Promise<AuthClaims> {
  const result = await user.getIdTokenResult(true);
  const role = result.claims.role;
  if (!isRoleName(role)) {
    throw new Error("La cuenta no tiene un rol ITERA autorizado. Contacte al administrador de acceso.");
  }
  return {
    role,
    organizationIds: stringArray(result.claims.organizationIds),
    practiceIds: stringArray(result.claims.practiceIds),
    providerIds: stringArray(result.claims.providerIds),
    careManagerIds: stringArray(result.claims.careManagerIds),
    patientIds: stringArray(result.claims.patientIds),
    serviceCodes: stringArray(result.claims.serviceCodes),
  };
}

async function validateBackendSession(user: User, localClaims: AuthClaims): Promise<AuthClaims> {
  const backendUrl = getBackendUrl();
  const response = await fetch(`${backendUrl}/api/me`, {
    headers: { Authorization: `Bearer ${await user.getIdToken()}`, "X-Correlation-Id": crypto.randomUUID() },
    credentials: "omit",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("El backend rechazó la sesión.");
  const serverPrincipal = await response.json() as { role?: unknown; scopes?: Partial<Omit<AuthClaims, "role">> };
  if (!isRoleName(serverPrincipal.role) || serverPrincipal.role !== localClaims.role) throw new Error("Los roles de sesión no coinciden.");
  return {
    role: serverPrincipal.role,
    organizationIds: stringArray(serverPrincipal.scopes?.organizationIds),
    practiceIds: stringArray(serverPrincipal.scopes?.practiceIds),
    providerIds: stringArray(serverPrincipal.scopes?.providerIds),
    careManagerIds: stringArray(serverPrincipal.scopes?.careManagerIds),
    patientIds: stringArray(serverPrincipal.scopes?.patientIds),
    serviceCodes: stringArray(serverPrincipal.scopes?.serviceCodes),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<AuthClaims | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const loginStartedAt = useRef<number | null>(null);
  const lastActivityAt = useRef(Date.now());

  const logout = useCallback(async (_reason = "user") => {
    const activeUser = auth.currentUser;
    let backendUrl: string | null = null;
    try { backendUrl = getBackendUrl(); } catch { backendUrl = null; }
    if (activeUser && backendUrl) {
      try {
        await fetch(`${backendUrl}/api/session/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${await activeUser.getIdToken()}`, "Content-Type": "application/json", "X-Correlation-Id": crypto.randomUUID() },
          body: JSON.stringify({ reason: _reason }), credentials: "omit", cache: "no-store",
        });
      } catch {
        // Local sign-out must still complete if the audit service is unavailable.
      }
    }
    setClaims(null);
    setAccessError(null);
    loginStartedAt.current = null;
    await logoutFirebase();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void authPersistenceReady.finally(() => {
      if (cancelled) return;
      return subscribeToAuthChanges(async (nextUser) => {
        if (cancelled) return;
        setLoading(true);
        setAccessError(null);
        setUser(nextUser);
        setClaims(null);
        if (!nextUser) {
          loginStartedAt.current = null;
          setLoading(false);
          return;
        }
        try {
          const nextClaims = await validateBackendSession(nextUser, await readClaims(nextUser));
          if (cancelled) return;
          loginStartedAt.current = Date.now();
          lastActivityAt.current = Date.now();
          setClaims(nextClaims);
        } catch (error) {
          if (cancelled) return;
          setAccessError(error instanceof Error ? error.message : "Acceso no autorizado.");
        } finally {
          if (!cancelled) setLoading(false);
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user || !claims) return;
    const markActivity = () => {
      lastActivityAt.current = Date.now();
    };
    const events: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "focus"];
    events.forEach((event) => window.addEventListener(event, markActivity, { passive: true }));
    const timer = window.setInterval(() => {
      const now = Date.now();
      const absoluteExpired = loginStartedAt.current !== null && now - loginStartedAt.current >= ABSOLUTE_TIMEOUT_MS;
      const idleExpired = now - lastActivityAt.current >= IDLE_TIMEOUT_MS;
      if (absoluteExpired || idleExpired) void logout(absoluteExpired ? "absolute-timeout" : "idle-timeout");
    }, 15_000);
    return () => {
      window.clearInterval(timer);
      events.forEach((event) => window.removeEventListener(event, markActivity));
    };
  }, [claims, logout, user]);

  const signInEmail = useCallback(async (email: string, password: string) => {
    setAccessError(null);
    await loginWithEmail(email, password);
  }, []);

  const signInGoogle = useCallback(async () => {
    setAccessError(null);
    await signInWithGoogle();
  }, []);

  const getIdToken = useCallback(async () => {
    if (!user || !claims) throw new Error("Authentication required");
    return user.getIdToken();
  }, [claims, user]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, claims, loading, accessError, signInEmail, signInGoogle, logout, getIdToken }),
    [user, claims, loading, accessError, signInEmail, signInGoogle, logout, getIdToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
