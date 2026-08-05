import { Router } from "express";
import { auditFirestore } from "../audit/firestore";
import { authorize } from "../security/authorization";

export const auditRouter = Router();

auditRouter.get("/audit-events", authorize("audit:view"), async (_req, res, next) => {
  try {
    const organizationIds = res.locals.principal.scopes.organizationIds;
    if (organizationIds.length !== 1) return res.status(400).json({ error: "single_organization_scope_required" });
    const snapshot = await auditFirestore().collection("securityAuditEvents")
      .where("organization", "==", organizationIds[0]).limit(500).get();
    const events = snapshot.docs.map((doc) => {
      const event = doc.data();
      return {
        eventId: event.eventId, sequence: event.sequence, timestamp: event.timestamp, actorId: event.actorId,
        role: event.role, organization: event.organization, action: event.action, resourceType: event.resourceType,
        resourceId: event.resourceId, reportingPeriod: event.reportingPeriod, result: event.result, source: event.source,
        correlationId: event.correlationId, previousHash: event.previousHash, hash: event.hash,
      };
    }).sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp))).slice(0, 100);
    res.json({ events });
  } catch (error) { next(error); }
});
