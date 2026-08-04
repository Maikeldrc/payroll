import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../../src/types";
import { isRoleName } from "../../shared/authorization";

if (!getApps().length) {
  initializeApp({ credential: applicationDefault(), projectId: process.env.FIREBASE_PROJECT_ID });
}

export interface PrincipalScopes {
  organizationIds: string[];
  practiceIds: string[];
  providerIds: string[];
  careManagerIds: string[];
  patientIds: string[];
  serviceCodes: string[];
}

export interface AuthenticatedPrincipal {
  uid: string;
  email?: string;
  role: UserRole;
  scopes: PrincipalScopes;
}

declare global {
  namespace Express {
    interface Locals {
      correlationId: string;
      principal: AuthenticatedPrincipal;
    }
  }
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export async function requireAuthenticatedUser(req: Request, res: Response, next: NextFunction) {
  const authorization = req.header("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    console.warn(JSON.stringify({ event: "security.authentication_failed", reason: "missing_bearer", correlationId: res.locals.correlationId }));
    return res.status(401).json({ error: "authentication_required" });
  }
  try {
    const decoded = await getAuth().verifyIdToken(authorization.slice(7), true);
    const user = await getAuth().getUser(decoded.uid);
    if (user.disabled) return res.status(401).json({ error: "account_disabled" });
    const absoluteSessionSeconds = Number(process.env.BACKEND_ABSOLUTE_SESSION_SECONDS || 28_800);
    const sessionAgeSeconds = Math.floor(Date.now() / 1000) - decoded.auth_time;
    if (!Number.isFinite(absoluteSessionSeconds) || absoluteSessionSeconds < 300 || sessionAgeSeconds >= absoluteSessionSeconds) {
      return res.status(401).json({ error: "session_expired" });
    }
    const role = decoded.role;
    if (!isRoleName(role)) {
      return res.status(403).json({ error: "role_not_authorized" });
    }
    const privileged = ["System Administrator", "Operations Administrator", "Payroll Administrator", "Billing Administrator", "Clinical Administrator"].includes(role);
    const secondFactor = decoded.firebase?.sign_in_second_factor;
    if (process.env.NODE_ENV === "production" && privileged && !secondFactor) {
      return res.status(403).json({ error: "multifactor_authentication_required" });
    }
    const scopes = {
      organizationIds: stringArray(decoded.organizationIds),
      practiceIds: stringArray(decoded.practiceIds),
      providerIds: stringArray(decoded.providerIds),
      careManagerIds: stringArray(decoded.careManagerIds),
      patientIds: stringArray(decoded.patientIds),
      serviceCodes: stringArray(decoded.serviceCodes),
    };
    if (process.env.NODE_ENV === "production"
      && (!scopes.organizationIds.length || !scopes.practiceIds.length
        || Object.values(scopes).some((values) => values.includes("*")))) {
      return res.status(403).json({ error: "explicit_tenant_scope_required" });
    }
    const accessExpiresAt = typeof decoded.accessExpiresAt === "number" ? decoded.accessExpiresAt : 0;
    if (process.env.NODE_ENV === "production" && (!accessExpiresAt || accessExpiresAt <= Math.floor(Date.now() / 1000))) {
      return res.status(403).json({ error: "access_assignment_expired" });
    }
    res.locals.principal = {
      uid: decoded.uid,
      email: decoded.email,
      role,
      scopes,
    };
    return next();
  } catch {
    console.warn(JSON.stringify({ event: "security.authentication_failed", reason: "invalid_or_expired", correlationId: res.locals.correlationId }));
    return res.status(401).json({ error: "invalid_or_expired_token" });
  }
}
