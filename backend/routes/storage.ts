import { Router } from "express";
import { z } from "zod";
import { appendAuditEvent } from "../audit/auditService";
import { googleStorageConfig } from "../google/config";
import { GoogleDriveService } from "../google/driveService";
import { GoogleSheetsService } from "../google/sheetsService";
import { MasterSheetManager } from "../google/masterSheetManager";
import { MonthlySpreadsheetManager } from "../google/monthlySpreadsheetManager";
import { MonthlyProcessingService } from "../monthly/monthlyProcessingService";
import { acquirePeriodLock, closePeriodLock, releasePeriodLock, reopenPeriod } from "../imports/periodLockService";
import { authorize } from "../security/authorization";
import { BackupService } from "../maintenance/backupService";
import { TestDataService } from "../maintenance/testDataService";
import { roleHasPermission } from "../../shared/authorization";

const periodSchema = z.object({ reportingPeriod: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/) });
const closeSchema = periodSchema.extend({ notes: z.string().max(1000).default("") });
const reopenSchema = periodSchema.extend({ reason: z.string().min(10).max(1000) });
const backupPolicySchema = z.object({ mode: z.enum(["manual", "automatic"]), frequency: z.enum(["daily", "weekly"]) });
const purgeTestDataSchema = z.object({ confirmation: z.literal("BORRAR DATOS DE PRUEBA") });
export const storageRouter = Router();

function masked(value: string): string {
  return `configured:…${value.slice(-4)}`;
}

storageRouter.get("/storage/google/configuration", authorize("configuration:view"), (_req, res) => {
  const config = googleStorageConfig();
  res.json({
    sharedDrive: masked(config.sharedDriveId), rootFolder: masked(config.rootFolderId), monthlyFolder: masked(config.monthlyFolderId),
    masterFolder: masked(config.masterFolderId), masterSpreadsheet: masked(config.masterSpreadsheetId),
    serviceAccountStatus: "managed-identity", timeZone: config.timeZone, currency: config.currency,
    monthlySheetNamingConvention: "Monthly Data - YYYY-MM", capacityWarningThreshold: config.capacityWarningThreshold,
    maximumUploadSizeBytes: 10 * 1024 * 1024, allowedFileTypes: ["csv", "xlsx"],
  });
});

storageRouter.get("/storage/backups", authorize("configuration:view"), async (_req, res, next) => {
  try {
    const service = new BackupService();
    if (roleHasPermission(res.locals.principal.role, "configuration:manage") && await service.isAutomaticBackupDue(res.locals.principal)) {
      await service.create(res.locals.principal, "automatic");
    }
    res.json({ policy: await service.getPolicy(res.locals.principal), backups: await service.list(res.locals.principal) });
  } catch (error) { next(error); }
});

storageRouter.post("/storage/backups", authorize("configuration:manage"), async (_req, res, next) => {
  try {
    const backup = await new BackupService().create(res.locals.principal, "manual");
    await appendAuditEvent({ principal: res.locals.principal, action: "data.backup.created", resourceType: "google-drive-backup", resourceId: backup.backupId, result: "success", source: "backend", correlationId: res.locals.correlationId, reason: "manual" });
    res.status(201).json(backup);
  } catch (error) { next(error); }
});

storageRouter.post("/storage/backups/policy", authorize("configuration:manage"), async (req, res, next) => {
  try {
    const { mode, frequency } = backupPolicySchema.parse(req.body);
    const policy = await new BackupService().setPolicy(res.locals.principal, mode, frequency);
    await appendAuditEvent({ principal: res.locals.principal, action: "data.backup.policy.updated", resourceType: "backup-policy", resourceId: res.locals.principal.scopes.organizationIds[0], result: "success", source: "backend", correlationId: res.locals.correlationId, reason: `${mode}:${frequency}` });
    res.json({ policy });
  } catch (error) { next(error); }
});

storageRouter.post("/storage/test-data/purge", authorize("configuration:manage"), async (req, res, next) => {
  try {
    purgeTestDataSchema.parse(req.body);
    const backup = await new BackupService().create(res.locals.principal, "pre-cleanup");
    const result = await new TestDataService().purge(res.locals.principal);
    await appendAuditEvent({ principal: res.locals.principal, action: "test-data.purged", resourceType: "monthly-google-sheets", resourceId: res.locals.principal.scopes.organizationIds[0], result: "success", source: "backend", correlationId: res.locals.correlationId, reason: `records:${result.removedRecords};periods:${result.purgedPeriods.length};mixed:${result.mixedPeriods.length}` });
    res.json({ ...result, backup });
  } catch (error) { next(error); }
});

storageRouter.post("/storage/google/validate", authorize("configuration:manage"), async (_req, res, next) => {
  try {
    const validation = await new GoogleDriveService().validateConfiguration();
    await appendAuditEvent({ principal: res.locals.principal, action: "google.storage.validated", resourceType: "storage-configuration", resourceId: "google-storage", result: validation.permissionViolations.length ? "failed" : "success", source: "backend", correlationId: res.locals.correlationId, reason: validation.permissionViolations.length ? "permission_violation" : undefined });
    res.json({ connected: true, sharedDriveName: validation.sharedDriveName, resourceCount: validation.resources.length, restrictedPermissionsValid: validation.permissionViolations.length === 0, violations: validation.permissionViolations });
  } catch (error) { next(error); }
});

storageRouter.post("/reporting-periods/initialize", authorize("import:create"), async (req, res, next) => {
  let lock: Awaited<ReturnType<typeof acquirePeriodLock>> | undefined;
  try {
    const { reportingPeriod } = periodSchema.parse(req.body);
    lock = await acquirePeriodLock(res.locals.principal, reportingPeriod, "Validating");
    const result = await new MonthlySpreadsheetManager().initializePeriod(reportingPeriod, res.locals.principal.uid);
    await appendAuditEvent({ principal: res.locals.principal, action: "reporting-period.initialized", resourceType: "monthly-spreadsheet", resourceId: result.reference.spreadsheetId, reportingPeriod, result: "success", source: "backend", correlationId: res.locals.correlationId });
    await releasePeriodLock(lock, "Available");
    res.status(result.created ? 201 : 200).json({ reportingPeriod, status: result.reference.status, created: result.created });
  } catch (error) {
    if (lock) await releasePeriodLock(lock, "Failed").catch(() => undefined);
    next(error);
  }
});

storageRouter.post("/reporting-periods/recalculate", authorize("performance:view"), async (req, res, next) => {
  let lock: Awaited<ReturnType<typeof acquirePeriodLock>> | undefined;
  try {
    const { reportingPeriod } = periodSchema.parse(req.body);
    lock = await acquirePeriodLock(res.locals.principal, reportingPeriod, "Recalculating");
    const summary = await new MonthlyProcessingService().calculate(reportingPeriod, res.locals.principal);
    await releasePeriodLock(lock, "Available");
    await appendAuditEvent({ principal: res.locals.principal, action: "reporting-period.recalculated", resourceType: "monthly-kpis", resourceId: reportingPeriod, reportingPeriod, result: "success", source: "backend", correlationId: res.locals.correlationId });
    res.json(summary);
  } catch (error) { if (lock) await releasePeriodLock(lock, "Failed").catch(() => undefined); next(error); }
});

storageRouter.post("/reporting-periods/close", authorize("payroll:manage"), async (req, res, next) => {
  let lock: Awaited<ReturnType<typeof acquirePeriodLock>> | undefined;
  try {
    const { reportingPeriod, notes } = closeSchema.parse(req.body);
    lock = await acquirePeriodLock(res.locals.principal, reportingPeriod, "Closing");
    const summary = await new MonthlyProcessingService().close(reportingPeriod, res.locals.principal, notes);
    await closePeriodLock(lock);
    await appendAuditEvent({ principal: res.locals.principal, action: "reporting-period.closed", resourceType: "monthly-close", resourceId: reportingPeriod, reportingPeriod, result: "success", source: "backend", correlationId: res.locals.correlationId });
    res.json({ ...summary, status: "Closed" });
  } catch (error) { if (lock) await releasePeriodLock(lock, "Failed").catch(() => undefined); next(error); }
});

storageRouter.post("/reporting-periods/reopen", authorize("configuration:manage"), async (req, res, next) => {
  try {
    const { reportingPeriod, reason } = reopenSchema.parse(req.body);
    await reopenPeriod(res.locals.principal, reportingPeriod, reason);
    await new MonthlyProcessingService().recordReopen(reportingPeriod, res.locals.principal, reason);
    await appendAuditEvent({ principal: res.locals.principal, action: "reporting-period.reopened", resourceType: "monthly-close", resourceId: reportingPeriod, reportingPeriod, result: "success", source: "backend", correlationId: res.locals.correlationId, reason });
    res.json({ reportingPeriod, status: "Open" });
  } catch (error) { next(error); }
});

storageRouter.get("/storage/google/capacity", authorize("configuration:view"), async (_req, res, next) => {
  try {
    const master = new MasterSheetManager();
    const sheets = new GoogleSheetsService();
    const config = googleStorageConfig();
    const periods = await master.monthlyFileIndex();
    const resources = [{ kind: "master", reportingPeriod: "master", spreadsheetId: config.masterSpreadsheetId }, ...periods.map((period) => ({ kind: "monthly", reportingPeriod: period.reportingPeriod, spreadsheetId: period.spreadsheetId }))];
    const usage = await Promise.all(resources.map(async (resource) => {
      const tabs = await sheets.capacity(resource.spreadsheetId);
      const cells = tabs.reduce((sum, tab) => sum + tab.cells, 0);
      return { kind: resource.kind, reportingPeriod: resource.reportingPeriod, cells, warning: cells >= 10_000_000 * config.capacityWarningThreshold };
    }));
    res.json({ threshold: config.capacityWarningThreshold, spreadsheetCellLimit: 10_000_000, usage });
  } catch (error) { next(error); }
});
