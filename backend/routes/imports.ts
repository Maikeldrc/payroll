import { Router } from "express";
import multer from "multer";
import { appendAuditEvent } from "../audit/auditService";
import { appendAuthorizedMonthlyRecords, filterRecordsForPrincipal } from "../data/repository";
import { assertMalwareScanClean, finishImport, parseUpload, reserveImport, sha256 } from "../files/uploadService";
import { authorize } from "../security/authorization";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 0 },
  fileFilter(_req, file, callback) {
    const extension = file.originalname.toLowerCase().split(".").pop();
    const allowedMime = new Set(["text/csv", "application/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);
    callback(null, (extension === "csv" || extension === "xlsx") && allowedMime.has(file.mimetype));
  },
});

export const importsRouter = Router();

importsRouter.post("/imports", authorize("import:create"), upload.single("file"), async (req, res, next) => {
  let hash: string | undefined;
  try {
    if (!req.file) return res.status(400).json({ error: "valid_file_required" });
    const idempotencyKey = req.header("Idempotency-Key");
    if (!idempotencyKey || !/^[A-Za-z0-9._-]{16,128}$/.test(idempotencyKey)) return res.status(400).json({ error: "valid_idempotency_key_required" });
    hash = sha256(req.file.buffer);
    await assertMalwareScanClean(req.file, hash);
    const records = await parseUpload(req.file);
    const authorized = filterRecordsForPrincipal(records, res.locals.principal);
    if (authorized.length !== records.length) {
      await appendAuditEvent({ principal: res.locals.principal, action: "import.denied", resourceType: "monthly-record-import", resourceId: hash, result: "denied", source: "backend", correlationId: res.locals.correlationId, reason: "out_of_scope" });
      return res.status(403).json({ error: "upload_contains_out_of_scope_records" });
    }
    await reserveImport(hash, res.locals.principal.uid, idempotencyKey);
    await appendAuthorizedMonthlyRecords(records, res.locals.principal);
    await finishImport(hash, "completed", records.length);
    await appendAuditEvent({ principal: res.locals.principal, action: "import.completed", resourceType: "monthly-record-import", resourceId: hash, result: "success", source: "backend", correlationId: res.locals.correlationId });
    res.status(201).json({ importId: hash.slice(0, 24), rowsImported: records.length });
  } catch (error) {
    if (hash) await finishImport(hash, "failed").catch(() => undefined);
    await appendAuditEvent({ principal: res.locals.principal, action: "import.failed", resourceType: "monthly-record-import", resourceId: hash || "unidentified", result: "failed", source: "backend", correlationId: res.locals.correlationId, reason: error instanceof Error ? error.name : "UnknownError" }).catch(() => undefined);
    next(error);
  } finally {
    if (req.file) req.file.buffer.fill(0);
  }
});
