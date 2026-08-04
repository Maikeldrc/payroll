import type { NextFunction, Request, Response } from "express";
import { roleHasPermission, type Permission } from "../../shared/authorization";
import type { PrincipalScopes } from "./auth";
import { appendAuditEvent } from "../audit/auditService";

export function authorize(permission: Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const principal = res.locals.principal;
    if (!principal || !roleHasPermission(principal.role, permission)) {
      if (!principal) return res.status(401).json({ error: "authentication_required" });
      try {
        await appendAuditEvent({
          principal,
          action: "authorization.denied",
          resourceType: "permission",
          resourceId: `${permission}:${req.route?.path || req.path}`,
          result: "denied",
          source: "backend",
          correlationId: res.locals.correlationId,
          reason: permission,
        });
      } catch (error) {
        return next(error);
      }
      return res.status(403).json({ error: "permission_denied" });
    }
    return next();
  };
}

export type ScopeDimension = keyof PrincipalScopes;

export function isWithinScope(scopes: PrincipalScopes, dimension: ScopeDimension, resourceId: string): boolean {
  const allowed = scopes[dimension];
  return allowed.includes("*") || allowed.includes(resourceId);
}

export function requireResourceScope(dimension: ScopeDimension, readResourceId: (req: Request) => string | undefined) {
  return (req: Request, res: Response, next: NextFunction) => {
    const resourceId = readResourceId(req);
    if (!resourceId || !isWithinScope(res.locals.principal.scopes, dimension, resourceId)) {
      return res.status(403).json({ error: "resource_outside_authorized_scope" });
    }
    return next();
  };
}
