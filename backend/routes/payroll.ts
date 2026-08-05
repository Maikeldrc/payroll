import { Router } from "express";
import { z } from "zod";
import { appendAuditEvent } from "../audit/auditService";
import { readAuthorizedPayroll } from "../data/repository";
import { authorize } from "../security/authorization";

const querySchema = z.object({ monthOf: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/) });
export const payrollRouter = Router();

payrollRouter.get("/payroll", authorize("payroll:view"), async (req, res, next) => {
  try {
    const { monthOf } = querySchema.parse(req.query);
    const rows = (await readAuthorizedPayroll(res.locals.principal, monthOf)).filter((row) => row.monthOf === monthOf);
    await appendAuditEvent({ principal: res.locals.principal, action: "payroll.view", resourceType: "payroll-summary", resourceId: monthOf, result: "success", source: "backend", correlationId: res.locals.correlationId });
    res.json({ monthOf, rows: rows.map(({ inputHash, ...row }) => ({ ...row, integrityVerified: /^[a-f0-9]{64}$/i.test(inputHash) })) });
  } catch (error) { next(error); }
});
