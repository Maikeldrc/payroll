import { Router } from "express";
import { z } from "zod";
import { authorize } from "../security/authorization";
import { readAuthorizedMonthlyRecords } from "../data/repository";
import { appendAuditEvent } from "../audit/auditService";
import { roleHasPermission } from "../../shared/authorization";

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

function noPatientList(role: string): boolean {
  return role === "Executive Viewer";
}

export const clinicalRouter = Router();

clinicalRouter.get("/dashboard/summary", authorize("dashboard:view"), async (req, res, next) => {
  try {
    const monthOf = monthSchema.parse(req.query.monthOf);
    const records = (await readAuthorizedMonthlyRecords(res.locals.principal, monthOf))
      .filter((record) => record.monthOf === monthOf);
    const billable = records.filter((record) => record.monthlyBilling > 0);
    const uniquePatients = new Set(records.map((record) => record.patientId)).size;
    await appendAuditEvent({ principal: res.locals.principal, action: "dashboard.summary.view", resourceType: "aggregate", resourceId: monthOf, result: "success", source: "backend", correlationId: res.locals.correlationId });
    res.json({
      monthOf,
      patients: uniquePatients,
      billablePatients: new Set(billable.map((record) => record.patientId)).size,
      totalBilling: billable.reduce((sum, record) => sum + record.monthlyBilling, 0),
      services: Object.entries(records.reduce<Record<string, number>>((acc, record) => {
        acc[record.serviceCode] = (acc[record.serviceCode] || 0) + 1;
        return acc;
      }, {})).map(([serviceCode, count]) => ({ serviceCode, count })),
    });
  } catch (error) {
    next(error);
  }
});

clinicalRouter.post("/patients/detail", authorize("patient:view"), async (req, res, next) => {
  try {
    const { recordId, monthOf } = z.object({ recordId: z.string().min(1).max(128).regex(/^[A-Za-z0-9._-]+$/), monthOf: monthSchema }).parse(req.body);
    const record = (await readAuthorizedMonthlyRecords(res.locals.principal, monthOf)).find((candidate) => candidate.id === recordId);
    if (!record) return res.status(404).json({ error: "not_found" });
    const role = res.locals.principal.role;
    const canSeeBilling = ["System Administrator", "Billing Administrator", "Operations Administrator"].includes(role);
    const canSeeClinical = ["System Administrator", "Clinical Administrator", "Supervisor", "Care Manager"].includes(role);
    await appendAuditEvent({ principal: res.locals.principal, action: "patient.record.view", resourceType: "monthly-management-record", resourceId: record.id, result: "success", source: "backend", correlationId: res.locals.correlationId });
    res.json({
      record: {
        id: record.id, patientId: record.patientId, mrn: record.mrn, patientName: record.patientName,
        practiceId: record.practiceId, providerName: record.providerName, careManagerName: record.careManagerName,
        serviceCode: record.serviceCode, monthOf: record.monthOf, eligibility: record.eligibility,
        ...(canSeeBilling ? { monthlyBilling: record.monthlyBilling, insuranceName: record.insuranceName } : {}),
        ...(canSeeClinical ? { diagnosisSummary: record.diagnosisSummary } : {}),
      },
    });
  } catch (error) { next(error); }
});

clinicalRouter.get("/patients", authorize("patient:view"), async (req, res, next) => {
  try {
    if (noPatientList(res.locals.principal.role)) return res.status(403).json({ error: "patient_detail_not_permitted" });
    const monthOf = monthSchema.parse(req.query.monthOf);
    const records = (await readAuthorizedMonthlyRecords(res.locals.principal, monthOf))
      .filter((record) => record.monthOf === monthOf)
      .slice(0, 200);
    await appendAuditEvent({ principal: res.locals.principal, action: "patient.search", resourceType: "patient-collection", resourceId: monthOf, result: "success", source: "backend", correlationId: res.locals.correlationId });
    const canSeeBilling = ["System Administrator", "Billing Administrator", "Operations Administrator"].includes(res.locals.principal.role);
    const canSeeClinical = ["System Administrator", "Clinical Administrator", "Supervisor", "Care Manager"].includes(res.locals.principal.role);
    const canSeePerformance = roleHasPermission(res.locals.principal.role, "performance:view");
    const canSeeQuality = roleHasPermission(res.locals.principal.role, "quality:view");
    const canSeePayroll = roleHasPermission(res.locals.principal.role, "payroll:view");
    res.json({
      monthOf,
      records: records.map((record) => ({
        id: record.id,
        patientId: record.patientId,
        mrn: record.mrn,
        patientName: record.patientName,
        practiceId: record.practiceId,
        providerId: record.providerId,
        providerName: record.providerName,
        careManagerId: record.careManagerId,
        careManagerName: record.careManagerName,
        serviceCode: record.serviceCode,
        eligibility: record.eligibility,
        ...(canSeePerformance ? { logEntries: record.logEntries, latestInteractiveCommunication: record.latestInteractiveCommunication, hmo: record.hmo, codes: record.codes } : {}),
        ...(canSeeQuality ? { validationStatus: record.validationStatus, dataQualityStatus: record.dataQualityStatus, duplicateStatus: record.duplicateStatus } : {}),
        ...(canSeePayroll ? { payrollStatus: record.payrollStatus } : {}),
        ...(canSeeBilling ? { monthlyBilling: record.monthlyBilling, insuranceName: record.insuranceName } : {}),
        ...(canSeeClinical ? { diagnosisSummary: record.diagnosisSummary } : {}),
      })),
    });
  } catch (error) {
    next(error);
  }
});
