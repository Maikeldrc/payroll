import { getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export function auditFirestore() {
  const databaseId = process.env.AUDIT_FIRESTORE_DATABASE_ID?.trim();
  if (process.env.NODE_ENV === "production" && !databaseId) {
    throw new Error("AUDIT_FIRESTORE_DATABASE_ID is required in production");
  }
  return databaseId ? getFirestore(getApp(), databaseId) : getFirestore();
}
