import { createHmac, timingSafeEqual } from "node:crypto";

interface AnalysisTokenPayload { fileHash: string; reportingPeriod: string; actorId: string; expiresAt: number }

function secret(): string {
  const value = process.env.IMPORT_ANALYSIS_TOKEN_SECRET || "";
  if (process.env.NODE_ENV === "production" && value.length < 32) throw new Error("IMPORT_ANALYSIS_TOKEN_SECRET is not configured");
  return value || "local-development-analysis-token-secret";
}

function signature(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function issueAnalysisToken(fileHash: string, reportingPeriod: string, actorId: string): string {
  const payload = Buffer.from(JSON.stringify({ fileHash, reportingPeriod, actorId, expiresAt: Date.now() + 15 * 60_000 } satisfies AnalysisTokenPayload)).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function verifyAnalysisToken(token: string, expected: Omit<AnalysisTokenPayload, "expiresAt">): void {
  const [payload, supplied] = token.split(".");
  if (!payload || !supplied) throw new Error("Invalid analysis token");
  const wanted = signature(payload);
  if (supplied.length !== wanted.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(wanted))) throw new Error("Invalid analysis token");
  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AnalysisTokenPayload;
  if (decoded.expiresAt <= Date.now() || decoded.fileHash !== expected.fileHash || decoded.reportingPeriod !== expected.reportingPeriod || decoded.actorId !== expected.actorId) {
    throw new Error("Analysis token expired or does not match the upload");
  }
}
