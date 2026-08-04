import crypto from "node:crypto";
import cors, { type CorsOptions } from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { requireAuthenticatedUser } from "./security/auth";
import { clinicalRouter } from "./routes/clinical";
import { reportsRouter } from "./routes/reports";
import { importsRouter } from "./routes/imports";
import { appendAuditEvent } from "./audit/auditService";
import { auditRouter } from "./routes/audit";
import { z } from "zod";
import multer from "multer";
import { validateProductionConfiguration } from "./config/production";
import { payrollRouter } from "./routes/payroll";
import { getAuth } from "firebase-admin/auth";

function allowedOrigins(): Set<string> {
  const fallback = process.env.NODE_ENV === "production" ? "" : "http://localhost:5173";
  return new Set(
    (process.env.ALLOWED_ORIGINS ?? fallback)
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}

export function createBackendApp() {
  validateProductionConfiguration();
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  const origins = allowedOrigins();
  if (process.env.NODE_ENV === "production" && origins.size === 0) {
    throw new Error("ALLOWED_ORIGINS is required in production");
  }

  const corsOptions: CorsOptions = {
    credentials: false,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "X-Correlation-Id", "Idempotency-Key"],
    exposedHeaders: ["X-Correlation-Id"],
    maxAge: 600,
    origin(origin, callback) {
      if (!origin || origins.has(origin)) return callback(null, true);
      return callback(new Error("Origin not allowed"));
    },
  };

  app.use(helmet({
    crossOriginResourcePolicy: { policy: "same-site" },
    referrerPolicy: { policy: "no-referrer" },
    strictTransportSecurity: process.env.NODE_ENV === "production" ? { maxAge: 31_536_000, includeSubDomains: true } : false,
  }));
  app.use((req, res, next) => {
    const supplied = req.header("X-Correlation-Id");
    const correlationId = supplied && /^[A-Za-z0-9._-]{8,128}$/.test(supplied) ? supplied : crypto.randomUUID();
    res.setHeader("X-Correlation-Id", correlationId);
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.locals.correlationId = correlationId;
    next();
  });
  app.use(cors(corsOptions));
  app.use(rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "rate_limit_exceeded" },
  }));
  app.use(express.json({ limit: "1mb", strict: true }));
  app.use(express.urlencoded({ limit: "256kb", extended: false }));

  app.get("/healthz", (_req, res) => res.json({ status: "ok" }));

  app.get("/api/me", requireAuthenticatedUser, async (_req: Request, res: Response, next: NextFunction) => {
    const principal = res.locals.principal;
    try {
      await appendAuditEvent({ principal, action: "session.login", resourceType: "session", resourceId: principal.uid, result: "success", source: "backend", correlationId: res.locals.correlationId });
      res.json({ uid: principal.uid, role: principal.role, scopes: principal.scopes });
    } catch (error) { next(error); }
  });

  app.use("/api", requireAuthenticatedUser);
  app.post("/api/session/logout", async (req, res, next) => {
    try {
      const reason = typeof req.body?.reason === "string" ? req.body.reason.slice(0, 40) : "user";
      await getAuth().revokeRefreshTokens(res.locals.principal.uid);
      await appendAuditEvent({ principal: res.locals.principal, action: "session.logout", resourceType: "session", resourceId: res.locals.principal.uid, result: "success", source: "backend", correlationId: res.locals.correlationId, reason });
      res.status(204).end();
    } catch (error) { next(error); }
  });
  app.use("/api", clinicalRouter);
  app.use("/api", reportsRouter);
  app.use("/api", importsRouter);
  app.use("/api", auditRouter);
  app.use("/api", payrollRouter);
  app.use("/api", (_req, res) => res.status(404).json({ error: "not_found" }));

  app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
    const originDenied = error instanceof Error && error.message === "Origin not allowed";
    const clientError = error instanceof z.ZodError || error instanceof multer.MulterError;
    const status = originDenied ? 403 : clientError ? 400 : 500;
    console.error(JSON.stringify({
      event: "request.failed",
      status,
      method: req.method,
      route: req.route?.path || "unmatched",
      correlationId: res.locals.correlationId,
      errorType: error instanceof Error ? error.name : "UnknownError",
    }));
    res.status(status).json({ error: originDenied ? "origin_not_allowed" : clientError ? "invalid_request" : "internal_error" });
  });

  return app;
}
