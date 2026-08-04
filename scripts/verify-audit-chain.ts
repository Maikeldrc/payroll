import "dotenv/config";
import crypto from "node:crypto";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const organization = argument("organization");
if (!organization || !/^[A-Za-z0-9._-]{1,128}$/.test(organization)) {
  throw new Error("A safe --organization identifier is required");
}

if (!getApps().length) initializeApp({ credential: applicationDefault(), projectId: process.env.FIREBASE_PROJECT_ID });
const snapshot = await getFirestore().collection("securityAuditEvents")
  .where("organization", "==", organization).orderBy("sequence", "asc").get();

let previousHash = "GENESIS";
let expectedSequence = 1;
for (const document of snapshot.docs) {
  const stored = document.data();
  const event = {
    eventId: stored.eventId,
    sequence: stored.sequence,
    timestamp: stored.timestamp,
    actorId: stored.actorId,
    role: stored.role,
    organization: stored.organization,
    practiceScope: stored.practiceScope,
    action: stored.action,
    resourceType: stored.resourceType,
    resourceId: stored.resourceId,
    result: stored.result,
    source: stored.source,
    correlationId: stored.correlationId,
    reason: stored.reason,
    previousHash: stored.previousHash,
  };
  const calculatedHash = crypto.createHash("sha256").update(JSON.stringify(event)).digest("hex");
  if (event.sequence !== expectedSequence || event.previousHash !== previousHash || stored.hash !== calculatedHash) {
    throw new Error(`Audit chain verification failed at sequence ${expectedSequence}`);
  }
  previousHash = stored.hash;
  expectedSequence += 1;
}

console.log(JSON.stringify({ organization, verifiedEvents: snapshot.size, lastHash: previousHash, status: "verified" }));
