import { ValidationError, SeverityType, MonthlyManagementRecord, Provider, CareManager, ServiceCatalogItem, CPTCode } from "../types";

export interface FileValidationResult {
  validRecords: MonthlyManagementRecord[];
  allErrors: ValidationError[];
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  duplicateCount: number;
}

export function validateMonthlyRecord(
  rawRow: any,
  rowNumber: number,
  existingRecords: MonthlyManagementRecord[],
  knownProviders: Provider[],
  knownCMs: CareManager[],
  knownServices: ServiceCatalogItem[],
  knownCPTs: CPTCode[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  const addError = (field: string, value: any, severity: SeverityType, message: string) => {
    errors.push({
      id: `ERR-${rowNumber}-${Math.random().toString(36).substring(2, 7)}`,
      recordId: rawRow.id || `ROW-${rowNumber}`,
      rowNumber,
      field,
      value,
      severity,
      message,
      resolved: false,
    });
  };

  // 1. MRN
  if (!rawRow.mrn || String(rawRow.mrn).trim() === "") {
    addError("mrn", rawRow.mrn, "Critical Error", "MRN del paciente se encuentra vacío.");
  }

  // 2. Patient Name
  if (!rawRow.patientName && (!rawRow.firstName || !rawRow.lastName)) {
    addError("patientName", rawRow.patientName, "Critical Error", "Paciente sin nombre ni apellido especificado.");
  }

  // 3. Provider
  if (!rawRow.providerName || String(rawRow.providerName).trim() === "") {
    addError("providerName", rawRow.providerName, "Critical Error", "Nombre de Provider vacío.");
  } else {
    // Check provider spelling / alias
    const match = knownProviders.find(
      (p) =>
        p.name.toLowerCase() === String(rawRow.providerName).toLowerCase() ||
        p.aliases.some((a) => a.toLowerCase() === String(rawRow.providerName).toLowerCase())
    );
    if (!match) {
      addError("providerName", rawRow.providerName, "Warning", `Provider '${rawRow.providerName}' no reconocido en catálogo oficial.`);
    }
  }

  // 4. Care Manager
  if (!rawRow.careManagerName || String(rawRow.careManagerName).trim() === "") {
    addError("careManagerName", rawRow.careManagerName, "Critical Error", "Care Manager está vacío.");
  } else {
    const cmMatch = knownCMs.find(
      (cm) =>
        cm.name.toLowerCase() === String(rawRow.careManagerName).toLowerCase() ||
        cm.aliases.some((a) => a.toLowerCase() === String(rawRow.careManagerName).toLowerCase())
    );
    if (!cmMatch) {
      addError("careManagerName", rawRow.careManagerName, "Warning", `Care Manager '${rawRow.careManagerName}' con variación ortográfica o no encontrado en catálogo.`);
    }
  }

  // 5. Service
  if (!rawRow.serviceCode || String(rawRow.serviceCode).trim() === "") {
    addError("serviceCode", rawRow.serviceCode, "Critical Error", "Código de Servicio vacío.");
  } else {
    const srvMatch = knownServices.find((s) => s.code.toUpperCase() === String(rawRow.serviceCode).toUpperCase());
    if (!srvMatch) {
      addError("serviceCode", rawRow.serviceCode, "Critical Error", `Servicio '${rawRow.serviceCode}' no reconocido.`);
    }
  }

  // 6. Month Of
  if (!rawRow.monthOf || !/^\d{4}-\d{2}$/.test(String(rawRow.monthOf))) {
    addError("monthOf", rawRow.monthOf, "Critical Error", "Mes (Month Of) vacío o formato inválido (debe ser YYYY-MM).");
  }

  // 7. DOB / Future Date
  if (rawRow.dob) {
    const dobDate = new Date(rawRow.dob);
    if (isNaN(dobDate.getTime())) {
      addError("dob", rawRow.dob, "Warning", "Fecha de nacimiento inválida.");
    } else if (dobDate > new Date()) {
      addError("dob", rawRow.dob, "Critical Error", "Fecha de nacimiento es una fecha futura.");
    }
  }

  // 8. Log Entries
  if (rawRow.logEntries === undefined || rawRow.logEntries === null || rawRow.logEntries === "" || isNaN(Number(rawRow.logEntries))) {
    addError("logEntries", rawRow.logEntries, "Warning", "Log Entries vacío o no numérico.");
  } else if (Number(rawRow.logEntries) < 0) {
    addError("logEntries", rawRow.logEntries, "Critical Error", "Log Entries no puede ser un número negativo.");
  } else if (Number(rawRow.logEntries) === 0) {
    addError("logEntries", rawRow.logEntries, "Informational", "Paciente con 0 Log Entries registrados en el mes.");
  }

  // 9. Monthly Billing
  if (rawRow.monthlyBilling === undefined || rawRow.monthlyBilling === null || rawRow.monthlyBilling === "" || isNaN(Number(rawRow.monthlyBilling))) {
    addError("monthlyBilling", rawRow.monthlyBilling, "Warning", "Monthly Billing vacío o no numérico.");
  } else if (Number(rawRow.monthlyBilling) < 0) {
    addError("monthlyBilling", rawRow.monthlyBilling, "Critical Error", "Monthly Billing no puede ser un valor negativo.");
  }

  // 10. Latest Interactive Communication vs Month Of
  if (!rawRow.latestInteractiveCommunication || String(rawRow.latestInteractiveCommunication).trim() === "") {
    addError("latestInteractiveCommunication", rawRow.latestInteractiveCommunication, "Warning", "Paciente sin fecha de comunicación interactiva registrada.");
  } else if (rawRow.monthOf && String(rawRow.latestInteractiveCommunication).length >= 7) {
    const commMonth = String(rawRow.latestInteractiveCommunication).substring(0, 7);
    if (commMonth !== rawRow.monthOf) {
      addError("latestInteractiveCommunication", rawRow.latestInteractiveCommunication, "Warning", `Comunicación interactiva (${commMonth}) está fuera del mes analizado (${rawRow.monthOf}).`);
    }
  }

  // 11. Last Mod Time vs Latest Interactive Communication
  if (rawRow.lastModificationTime && rawRow.latestInteractiveCommunication) {
    const modDate = new Date(rawRow.lastModificationTime);
    const commDate = new Date(rawRow.latestInteractiveCommunication);
    if (!isNaN(modDate.getTime()) && !isNaN(commDate.getTime()) && modDate < commDate) {
      addError("lastModificationTime", rawRow.lastModificationTime, "Warning", "Last Modification Time es anterior a la fecha de comunicación interactiva.");
    }
  }

  // 12. Insurance Policy Number
  if (rawRow.primaryInsuranceName && (!rawRow.primaryPolicyNumber || String(rawRow.primaryPolicyNumber).trim() === "")) {
    addError("primaryPolicyNumber", rawRow.primaryPolicyNumber, "Informational", "Seguro primario especificado sin número de póliza.");
  }

  // 13. HMO Warning
  if (String(rawRow.hmo).toLowerCase() === "yes") {
    addError("hmo", rawRow.hmo, "Informational", "Paciente con plan HMO (requiere verificar autorización previa).");
  }

  // 14. Eligibility
  if (rawRow.eligibility === "Ineligible" || rawRow.eligibility === "Terminated") {
    addError("eligibility", rawRow.eligibility, "Critical Error", `Estado de elegibilidad inactivo (${rawRow.eligibility}).`);
  }

  // 15. CPT Code Check (Deshabilitado por requerimiento de no usar validaciones basadas en CPT/Conditions)
  // No se generan advertencias de código CPT/HCPCS ni validaciones por condición.

  // 16. Logical Duplicate check (MRN + Provider + Service + Month Of)
  if (rawRow.mrn && rawRow.providerName && rawRow.serviceCode && rawRow.monthOf) {
    const isDup = existingRecords.some(
      (r) =>
        r.mrn.toLowerCase() === String(rawRow.mrn).toLowerCase() &&
        r.serviceCode.toLowerCase() === String(rawRow.serviceCode).toLowerCase() &&
        r.monthOf === rawRow.monthOf &&
        r.id !== rawRow.id
    );
    if (isDup) {
      addError("mrn", rawRow.mrn, "Critical Error", `Duplicado detectado: El paciente ${rawRow.mrn} ya existe para el servicio ${rawRow.serviceCode} en el mes ${rawRow.monthOf}.`);
    }
  }

  return errors;
}
