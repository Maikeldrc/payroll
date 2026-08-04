import "dotenv/config";
import crypto from "node:crypto";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { appendAuditEvent } from "../backend/audit/auditService";

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function list(name: string): string[] {
  return (argument(name) || "").split(",").map((value) => value.trim()).filter(Boolean);
}

const uid = argument("uid");
const status = argument("status");
const actorUid = process.env.PROVISIONING_ACTOR_UID;
const organizationIds = list("organizations");
const practiceIds = list("practices");
if (!uid || !actorUid || !["enabled", "disabled"].includes(status || "") || !organizationIds.length || !practiceIds.length) {
  throw new Error("--uid, --status enabled|disabled, explicit organizations/practices and PROVISIONING_ACTOR_UID are required");
}
if ([...organizationIds, ...practiceIds].includes("*")) throw new Error("Wildcard scopes are prohibited");

if (!getApps().length) initializeApp({ credential: applicationDefault(), projectId: process.env.FIREBASE_PROJECT_ID });
const auth = getAuth();
await auth.updateUser(uid, { disabled: status === "disabled" });
await auth.revokeRefreshTokens(uid);
await appendAuditEvent({
  principal: {
    uid: actorUid,
    role: "System Administrator",
    scopes: { organizationIds, practiceIds, providerIds: [], careManagerIds: [], patientIds: [], serviceCodes: [] },
  },
  action: status === "disabled" ? "user.deactivated" : "user.activated",
  resourceType: "user",
  resourceId: uid,
  result: "success",
  source: "provisioning-cli",
  correlationId: crypto.randomUUID(),
});
console.log(JSON.stringify({ status, uid, sessionsRevoked: true }));
