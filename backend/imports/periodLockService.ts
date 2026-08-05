import crypto from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { auditFirestore } from "../audit/firestore";
import type { AuthenticatedPrincipal } from "../security/auth";
import { isReportingPeriod } from "../google/config";

export type PeriodProcessingState = "Available" | "Importing" | "Validating" | "Recalculating" | "Closing" | "Closed" | "Failed";

function lockId(organizationId: string, reportingPeriod: string): string {
  return crypto.createHash("sha256").update(`${organizationId}:${reportingPeriod}`).digest("hex");
}

export interface PeriodLock {
  id: string;
  organizationId: string;
  reportingPeriod: string;
  state: PeriodProcessingState;
  ownerId: string;
  expiresAt: Date;
}

export async function acquirePeriodLock(
  principal: AuthenticatedPrincipal,
  reportingPeriod: string,
  state: Exclude<PeriodProcessingState, "Available" | "Closed" | "Failed">,
  leaseSeconds = Number(process.env.IMPORT_LOCK_TIMEOUT_SECONDS || 600),
): Promise<PeriodLock> {
  if (!isReportingPeriod(reportingPeriod)) throw new Error("Invalid reporting period");
  const organizationId = principal.scopes.organizationIds[0];
  if (!organizationId) throw new Error("Explicit organization scope is required");
  if (!Number.isFinite(leaseSeconds) || leaseSeconds < 60 || leaseSeconds > 3600) throw new Error("Invalid import lock timeout");
  const db = auditFirestore();
  const id = lockId(organizationId, reportingPeriod);
  const ref = db.collection("periodLocks").doc(id);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + leaseSeconds * 1000);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const current = snapshot.data();
    if (current?.state === "Closed") throw new Error("Reporting period is closed");
    const currentExpiry = current?.lockExpiresAt?.toDate?.() as Date | undefined;
    if (currentExpiry && currentExpiry > now && current?.lockOwnerId !== principal.uid) {
      throw new Error("Reporting period is busy");
    }
    transaction.set(ref, {
      organizationId,
      reportingPeriod,
      state,
      lockOwnerId: principal.uid,
      lockExpiresAt: Timestamp.fromDate(expiresAt),
      updatedAt: Timestamp.fromDate(now),
    }, { merge: true });
  });
  return { id, organizationId, reportingPeriod, state, ownerId: principal.uid, expiresAt };
}

export async function releasePeriodLock(lock: PeriodLock, finalState: "Available" | "Failed"): Promise<void> {
  const db = auditFirestore();
  const ref = db.collection("periodLocks").doc(lock.id);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists || snapshot.data()?.lockOwnerId !== lock.ownerId) throw new Error("Period lock ownership was lost");
    transaction.set(ref, {
      state: finalState,
      lockOwnerId: null,
      lockExpiresAt: null,
      updatedAt: Timestamp.now(),
    }, { merge: true });
  });
}

export async function closePeriodLock(lock: PeriodLock): Promise<void> {
  const ref = auditFirestore().collection("periodLocks").doc(lock.id);
  await auditFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists || snapshot.data()?.lockOwnerId !== lock.ownerId) throw new Error("Period lock ownership was lost");
    transaction.set(ref, { state: "Closed", lockOwnerId: null, lockExpiresAt: null, updatedAt: Timestamp.now() }, { merge: true });
  });
}

export async function reopenPeriod(principal: AuthenticatedPrincipal, reportingPeriod: string, reason: string): Promise<void> {
  if (!reason.trim() || reason.trim().length < 10) throw new Error("A reopening reason of at least 10 characters is required");
  const organizationId = principal.scopes.organizationIds[0];
  if (!organizationId || !isReportingPeriod(reportingPeriod)) throw new Error("Invalid reporting period scope");
  const ref = auditFirestore().collection("periodLocks").doc(lockId(organizationId, reportingPeriod));
  await auditFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (snapshot.data()?.state !== "Closed") throw new Error("Reporting period is not closed");
    transaction.set(ref, { state: "Available", reopenedBy: principal.uid, reopeningReason: reason.trim(), reopenedAt: Timestamp.now(), updatedAt: Timestamp.now() }, { merge: true });
  });
}
