import { MONTHLY_RECORD_HEADERS } from "../google/schemas";
import { monthlyBusinessKey } from "./normalizationEngine";
import type { NormalizedMonthlyRecord } from "./types";

function indexOf(header: string): number {
  return MONTHLY_RECORD_HEADERS.indexOf(header as (typeof MONTHLY_RECORD_HEADERS)[number]);
}

export function applyDuplicateClassification(records: NormalizedMonthlyRecord[], existingRows: string[][]): void {
  const existing = new Map<string, { rowHash: string; version: number }>();
  for (const row of existingRows.slice(1)) {
    if (!row.length) continue;
    const key = monthlyBusinessKey(
      row[indexOf("Reporting Period")] || "",
      row[indexOf("Practice ID")] || "",
      row[indexOf("MRN")] || "",
      row[indexOf("Provider Normalized ID")] || "",
      row[indexOf("Service Normalized ID")] || "",
    );
    existing.set(key, {
      rowHash: row[indexOf("Source Row Hash")] || "",
      version: Number(row[indexOf("Record Version")] || 1),
    });
  }
  const incoming = new Map<string, NormalizedMonthlyRecord[]>();
  for (const record of records) incoming.set(record.businessKey, [...(incoming.get(record.businessKey) || []), record]);

  for (const record of records) {
    const persisted = existing.get(record.businessKey);
    const sameBatch = incoming.get(record.businessKey) || [];
    if (persisted?.rowHash === record.sourceRowHash) {
      record.duplicateStatus = "Exact Duplicate";
      record.payrollInclusionStatus = "Excluded";
    } else if (persisted) {
      record.duplicateStatus = "Update Candidate";
      record.validationStatus = "Requires Review";
      record.payrollInclusionStatus = "Requires Review";
      record.recordVersion = persisted.version + 1;
    } else if (sameBatch.length > 1) {
      record.duplicateStatus = sameBatch.every((item) => item.sourceRowHash === record.sourceRowHash) ? "Exact Duplicate" : "Conflict";
      record.validationStatus = "Requires Review";
      record.payrollInclusionStatus = "Requires Review";
    }
  }
}
