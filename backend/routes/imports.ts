import { createHash } from "node:crypto";
import { Router } from "express";
import multer from "multer";
import { appendAuditEvent } from "../audit/auditService";
import { reportingPeriod } from "../google/config";
import { assertMalwareScanClean, finishImport, reserveImport, sha256 } from "../files/uploadService";
import { issueAnalysisToken, verifyAnalysisToken } from "../imports/analysisToken";
import { ImportBatchEngine } from "../imports/importBatchEngine";
import { acquirePeriodLock, releasePeriodLock } from "../imports/periodLockService";
import { MonthlyProcessingService } from "../monthly/monthlyProcessingService";
import { authorize } from "../security/authorization";
import type { NextFunction, Request, Response } from "express";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 6, fieldSize: 4_096 },
  fileFilter(_req, file, callback) {
    const extension = file.originalname.toLowerCase().split(".").pop();
    const allowedMime = new Set(["text/csv", "application/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);
    callback(null, (extension === "csv" || extension === "xlsx") && allowedMime.has(file.mimetype));
  },
});

export const importsRouter = Router();

function requireImportsEnabled(_req: Request, res: Response, next: NextFunction) {
  if (process.env.IMPORTS_ENABLED !== "true") return res.status(503).json({ error: "imports_temporarily_disabled" });
  return next();
}

function selectedPeriod(req: Request): string {
  return reportingPeriod(Number(req.body.year), Number(req.body.month));
}

function reservationId(period: string, fileHash: string): string {
  return createHash("sha256").update(`${period}:${fileHash}`).digest("hex");
}

importsRouter.post("/imports/analyze", authorize("import:create"), requireImportsEnabled, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "valid_file_required" });
    const period = selectedPeriod(req);
    const fileHash = sha256(req.file.buffer);
    const scanStatus = await assertMalwareScanClean(req.file, fileHash);
    const { analysis } = await new ImportBatchEngine().analyze(req.file, period, res.locals.principal, fileHash);
    await appendAuditEvent({ principal: res.locals.principal, action: "import.analyzed", resourceType: "monthly-record-import", resourceId: fileHash, reportingPeriod: period, result: "success", source: "backend", correlationId: res.locals.correlationId, reason: `malware-scan:${scanStatus}` });
    res.json({ analysis, analysisToken: issueAnalysisToken(fileHash, period, res.locals.principal.uid), expiresInSeconds: 900, uploadSecurity: { malwareScan: scanStatus } });
  } catch (error) {
    await appendAuditEvent({ principal: res.locals.principal, action: "import.analysis_failed", resourceType: "monthly-record-import", resourceId: "unidentified", result: "failed", source: "backend", correlationId: res.locals.correlationId, reason: error instanceof Error ? error.name : "UnknownError" }).catch(() => undefined);
    next(error);
  } finally {
    if (req.file) req.file.buffer.fill(0);
  }
});

importsRouter.post("/imports/confirm", authorize("import:create"), requireImportsEnabled, upload.single("file"), async (req, res, next) => {
  let lock: Awaited<ReturnType<typeof acquirePeriodLock>> | undefined;
  let reservation: string | undefined;
  try {
    if (!req.file) return res.status(400).json({ error: "valid_file_required" });
    const idempotencyKey = req.header("Idempotency-Key");
    if (!idempotencyKey || !/^[A-Za-z0-9._-]{16,128}$/.test(idempotencyKey)) return res.status(400).json({ error: "valid_idempotency_key_required" });
    const period = selectedPeriod(req);
    const fileHash = sha256(req.file.buffer);
    if (typeof req.body.analysisToken !== "string") return res.status(400).json({ error: "analysis_token_required" });
    verifyAnalysisToken(req.body.analysisToken, { fileHash, reportingPeriod: period, actorId: res.locals.principal.uid });
    const scanStatus = await assertMalwareScanClean(req.file, fileHash);
    reservation = reservationId(period, fileHash);
    await reserveImport(reservation, res.locals.principal.uid, idempotencyKey);
    lock = await acquirePeriodLock(res.locals.principal, period, "Importing");
    const result = await new ImportBatchEngine().confirm(req.file, period, res.locals.principal, fileHash);
    await new MonthlyProcessingService().calculate(period, res.locals.principal);
    await finishImport(reservation, "completed", result.rowsImported);
    await releasePeriodLock(lock, "Available");
    await appendAuditEvent({ principal: res.locals.principal, action: "import.completed", resourceType: "monthly-record-import", resourceId: result.importBatchId, reportingPeriod: period, result: "success", source: "backend", correlationId: res.locals.correlationId, reason: `malware-scan:${scanStatus}` });
    res.status(201).json({ reportingPeriod: period, ...result, uploadSecurity: { malwareScan: scanStatus } });
  } catch (error) {
    if (reservation) await finishImport(reservation, "failed").catch(() => undefined);
    if (lock) await releasePeriodLock(lock, "Failed").catch(() => undefined);
    await appendAuditEvent({ principal: res.locals.principal, action: "import.failed", resourceType: "monthly-record-import", resourceId: reservation || "unidentified", result: "failed", source: "backend", correlationId: res.locals.correlationId, reason: error instanceof Error ? error.name : "UnknownError" }).catch(() => undefined);
    next(error);
  } finally {
    if (req.file) req.file.buffer.fill(0);
  }
});

// Compatibility endpoint intentionally requires the new two-step workflow.
importsRouter.post("/imports", authorize("import:create"), (_req, res) => res.status(409).json({ error: "analysis_required", analyzeEndpoint: "/api/imports/analyze" }));
