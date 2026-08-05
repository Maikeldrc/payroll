import crypto from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import type { AuthenticatedPrincipal } from "../security/auth";
import { auditFirestore } from "./firestore";

export interface AuditEventInput {
  principal: AuthenticatedPrincipal;
  action: string;
  resourceType: string;
  resourceId: string;
  result: "success" | "denied" | "failed";
  source: string;
  correlationId: string;
  reportingPeriod?: string;
  reason?: string;
}

function controlledIdentifier(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 24);
}

export async function appendAuditEvent(input: AuditEventInput): Promise<string> {
  const db = auditFirestore();
  const organization = input.principal.scopes.organizationIds[0];
  if (!organization) throw new Error("Audit event requires an explicit organization");
  const streamRef = db.collection("securityAuditStreams").doc(organization);
  const eventRef = db.collection("securityAuditEvents").doc();

  await db.runTransaction(async (transaction) => {
    const stream = await transaction.get(streamRef);
    const sequence = Number(stream.data()?.sequence || 0) + 1;
    const previousHash = String(stream.data()?.lastHash || "GENESIS");
    const timestamp = new Date().toISOString();
    const event = {
      eventId: eventRef.id,
      sequence,
      timestamp,
      actorId: input.principal.uid,
      role: input.principal.role,
      organization,
      practiceScope: input.principal.scopes.practiceIds,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: controlledIdentifier(input.resourceId),
      reportingPeriod: input.reportingPeriod || null,
      result: input.result,
      source: input.source,
      correlationId: input.correlationId,
      reason: input.reason?.slice(0, 160) || null,
      previousHash,
    };
    const hash = crypto.createHash("sha256").update(JSON.stringify(event)).digest("hex");
    transaction.create(eventRef, { ...event, hash, recordedAt: FieldValue.serverTimestamp() });
    transaction.set(streamRef, { sequence, lastHash: hash, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
  return eventRef.id;
}
