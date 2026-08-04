import {
  MonthlyManagementRecord,
  PayrollRule,
  PayrollCalculation,
  PayrollBreakdownLine,
  CareManager,
  ManualAdjustment,
  PayrollFlowState,
} from "../types";

export function calculatePayrollForCareManager(
  careManager: CareManager,
  records: MonthlyManagementRecord[],
  rules: PayrollRule[],
  monthOf: string,
  existingCalc?: PayrollCalculation
): PayrollCalculation {
  // Filter records belonging to this Care Manager and month
  const cmRecords = records.filter(
    (r) => r.careManagerId === careManager.id && r.monthOf === monthOf
  );

  const managedCount = cmRecords.length;
  const eligibleRecords = cmRecords.filter((r) => r.payrollStatus === "Included");
  const excludedRecords = cmRecords.filter((r) => r.payrollStatus === "Excluded");

  const breakdownLines: PayrollBreakdownLine[] = [];
  let baseEarnings = 0;
  let totalBonuses = 0;
  let totalDeductions = 0;

  const activeRules = rules
    .filter((r) => r.active)
    .sort((a, b) => a.priority - b.priority);

  activeRules.forEach((rule) => {
    // Check if rule applies to this Care Manager or service
    if (
      rule.applicableCareManagers.length > 0 &&
      !rule.applicableCareManagers.includes(careManager.id)
    ) {
      return;
    }

    if (rule.ruleType === "service_rate") {
      // Find matching records for services
      const matching = eligibleRecords.filter((r) => {
        if (rule.applicableServices.length > 0 && !rule.applicableServices.includes(r.serviceCode)) {
          return false;
        }
        // Check rule conditions
        return evaluateRuleConditions(r, rule.conditions);
      });

      if (matching.length > 0) {
        const lineTotal = matching.length * rule.amountOrPercent;
        baseEarnings += lineTotal;
        breakdownLines.push({
          id: `LINE-${rule.id}-${Math.random().toString(36).substring(2, 6)}`,
          ruleName: rule.name,
          description: rule.description,
          itemCount: matching.length,
          unitRate: rule.amountOrPercent,
          subtotal: lineTotal,
          isDeduction: false,
          participatingPatientIds: matching.map((m) => m.id),
        });
      }
    } else if (rule.ruleType === "interactive_comm_bonus") {
      // Tasa de comunicación interactiva > 85%
      const commCount = cmRecords.filter((r) => r.latestInteractiveCommunication).length;
      const rate = managedCount > 0 ? (commCount / managedCount) * 100 : 0;
      if (rate >= 85 && managedCount > 0) {
        totalBonuses += rule.amountOrPercent;
        breakdownLines.push({
          id: `LINE-COMM-${rule.id}`,
          ruleName: rule.name,
          description: `${rule.description} (Tasa lograda: ${rate.toFixed(1)}%)`,
          itemCount: 1,
          unitRate: rule.amountOrPercent,
          subtotal: rule.amountOrPercent,
          isDeduction: false,
          participatingPatientIds: cmRecords.map((m) => m.id),
        });
      }
    } else if (rule.ruleType === "volume_bonus") {
      // Bonus si supera los 75 pacientes
      if (managedCount > 75) {
        const extraPatients = managedCount - 75;
        const lineTotal = extraPatients * rule.amountOrPercent;
        totalBonuses += lineTotal;
        breakdownLines.push({
          id: `LINE-VOL-${rule.id}`,
          ruleName: rule.name,
          description: `${rule.description} (${extraPatients} pacientes excedentes)`,
          itemCount: extraPatients,
          unitRate: rule.amountOrPercent,
          subtotal: lineTotal,
          isDeduction: false,
          participatingPatientIds: cmRecords.slice(75).map((m) => m.id),
        });
      }
    } else if (rule.ruleType === "incomplete_deduction") {
      // Registros incompletos o sin comunicación
      const incomplete = cmRecords.filter((r) => evaluateRuleConditions(r, rule.conditions));
      if (incomplete.length > 0) {
        const lineTotal = incomplete.length * rule.amountOrPercent;
        totalDeductions += lineTotal;
        breakdownLines.push({
          id: `LINE-DED-${rule.id}`,
          ruleName: rule.name,
          description: rule.description,
          itemCount: incomplete.length,
          unitRate: rule.amountOrPercent,
          subtotal: lineTotal,
          isDeduction: true,
          participatingPatientIds: incomplete.map((m) => m.id),
        });
      }
    }
  });

  const manualAdjustments: ManualAdjustment[] = existingCalc?.manualAdjustments || [];
  const manualTotal = manualAdjustments.reduce((acc, a) => acc + a.amount, 0);

  const grossPay = baseEarnings + totalBonuses;
  const netPay = Math.max(0, grossPay - totalDeductions + manualTotal);

  return {
    id: existingCalc?.id || `PAY-${careManager.id}-${monthOf}`,
    careManagerId: careManager.id,
    careManagerName: careManager.name,
    monthOf,
    status: existingCalc?.status || "Draft",
    version: (existingCalc?.version || 1),
    managedPatientsCount: managedCount,
    eligiblePatientsCount: eligibleRecords.length,
    excludedPatientsCount: excludedRecords.length,
    baseEarnings,
    bonuses: totalBonuses,
    deductions: totalDeductions,
    manualAdjustments,
    grossPay,
    netPay,
    breakdownLines,
    closedAt: existingCalc?.closedAt,
    closedBy: existingCalc?.closedBy,
    notes: existingCalc?.notes || "",
    history: existingCalc?.history || [],
  };
}

function evaluateRuleConditions(record: MonthlyManagementRecord, conditions: any[]): boolean {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every((cond) => {
    const recordVal = (record as any)[cond.field];
    switch (cond.operator) {
      case "==":
        return String(recordVal).toLowerCase() === String(cond.value).toLowerCase();
      case "!=":
        return String(recordVal).toLowerCase() !== String(cond.value).toLowerCase();
      case ">":
        return Number(recordVal) > Number(cond.value);
      case ">=":
        return Number(recordVal) >= Number(cond.value);
      case "<":
        return Number(recordVal) < Number(cond.value);
      case "<=":
        return Number(recordVal) <= Number(cond.value);
      case "contains":
        return String(recordVal).toLowerCase().includes(String(cond.value).toLowerCase());
      case "not_empty":
        return recordVal !== undefined && recordVal !== null && String(recordVal).trim() !== "";
      case "is_empty":
        return recordVal === undefined || recordVal === null || String(recordVal).trim() === "";
      default:
        return true;
    }
  });
}
