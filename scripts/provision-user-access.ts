import "dotenv/config";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { appendAuditEvent } from "../backend/audit/auditService";
import { isRoleName } from "../shared/authorization";

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function list(name: string): string[] {
  return (argument(name) || "").split(",").map((value) => value.trim()).filter(Boolean);
}

const uid = argument("uid");
const role = argument("role");
const actorUid = process.env.PROVISIONING_ACTOR_UID;
const expiresAtInput = argument("expires-at");
const accessExpiresAt = expiresAtInput ? Math.floor(Date.parse(expiresAtInput) / 1000) : Number.NaN;
if (!uid || !isRoleName(role) || !actorUid || !Number.isFinite(accessExpiresAt)) {
  throw new Error("--uid, a valid --role, --expires-at and PROVISIONING_ACTOR_UID are required");
}
const nowSeconds = Math.floor(Date.now() / 1000);
if (accessExpiresAt <= nowSeconds || accessExpiresAt > nowSeconds + 90 * 24 * 60 * 60) {
  throw new Error("--expires-at must be in the future and no more than 90 days away");
}
if (role === "System Administrator" && !process.argv.includes("--allow-system-admin")) throw new Error("System Administrator requires --allow-system-admin");

const organizationIds = list("organizations");
const practiceIds = list("practices");
if (organizationIds.length !== 1 || practiceIds.length === 0) throw new Error("Exactly one organization and at least one practice scope are required");
const requestedScopes = [organizationIds, practiceIds, list("providers"), list("care-managers"), list("patients"), list("services")];
if (requestedScopes.some((values) => values.includes("*"))) throw new Error("Wildcard scopes are prohibited; enumerate explicit tenant resources");

if (!getApps().length) initializeApp({ credential: applicationDefault(), projectId: process.env.FIREBASE_PROJECT_ID });
const auth = getAuth();
await auth.getUser(uid);
await auth.setCustomUserClaims(uid, {
  role,
  accessExpiresAt,
  organizationIds,
  practiceIds,
  providerIds: requestedScopes[2],
  careManagerIds: requestedScopes[3],
  patientIds: requestedScopes[4],
  serviceCodes: requestedScopes[5],
});
await auth.revokeRefreshTokens(uid);
await appendAuditEvent({
  principal: {
    uid: actorUid,
    role: "System Administrator",
    scopes: { organizationIds, practiceIds, providerIds: [], careManagerIds: [], patientIds: [], serviceCodes: [] },
  },
  action: "access.scope.changed",
  resourceType: "user",
  resourceId: uid,
  result: "success",
  source: "provisioning-cli",
  correlationId: crypto.randomUUID(),
  reason: `role=${role}`,
});
console.log(JSON.stringify({ status: "updated", uid, role, sessionsRevoked: true }));
