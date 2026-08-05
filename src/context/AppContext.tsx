import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import {
  MonthlyManagementRecord,
  ImportBatch,
  PayrollRule,
  PayrollCalculation,
  Provider,
  CareManager,
  Practice,
  ServiceCatalogItem,
  CPTCode,
  ICD10Code,
  MappingTemplate,
  TargetGoal,
  AuditLogEntry,
  AutomatedFinding,
  UserRole,
  GlobalFilterState,
  ValidationError,
  PayrollStatus,
  ManualAdjustment,
} from "../types";
import {
  INITIAL_ORGANIZATION,
  INITIAL_PRACTICES,
  INITIAL_PROVIDERS,
  INITIAL_CARE_MANAGERS,
  INITIAL_SERVICES,
  INITIAL_CPT_CODES,
  INITIAL_ICD10_CODES,
  INITIAL_PAYROLL_RULES,
  INITIAL_MAPPING_TEMPLATES,
  INITIAL_TARGET_GOALS,
  INITIAL_IMPORT_BATCHES,
  INITIAL_AUDIT_LOGS,
  INITIAL_AUTOMATED_FINDINGS,
  generateSyntheticRecords,
} from "../data/mockData";
import {
  INITIAL_SERVICE_CONFIGS,
  INITIAL_EXTENDED_CPT_REGISTRY,
  ServiceConfigDefinition,
  ExtendedCPTCode,
} from "../data/serviceCatalogRegistry";
import { calculatePayrollForCareManager } from "../utils/payrollEngine";
import { apiFetch } from "../lib/apiClient";
import { roleHasPermission } from "../../shared/authorization";

interface AppContextType {
  // State
  records: MonthlyManagementRecord[];
  importBatches: ImportBatch[];
  payrollRules: PayrollRule[];
  payrollCalculations: PayrollCalculation[];
  providers: Provider[];
  careManagers: CareManager[];
  practices: Practice[];
  services: ServiceCatalogItem[];
  cptCodes: CPTCode[];
  icd10Codes: ICD10Code[];
  serviceConfigs: ServiceConfigDefinition[];
  extendedCPTCodes: ExtendedCPTCode[];
  mappingTemplates: MappingTemplate[];
  targetGoals: TargetGoal[];
  auditLogs: AuditLogEntry[];
  findings: AutomatedFinding[];
  currentUserRole: UserRole;
  globalFilters: GlobalFilterState;

  // Setters & Methods
  setRecords: React.Dispatch<React.SetStateAction<MonthlyManagementRecord[]>>;
  setGlobalFilters: React.Dispatch<React.SetStateAction<GlobalFilterState>>;
  resetGlobalFilters: () => void;
  updateServiceConfig: (updated: ServiceConfigDefinition) => void;
  toggleServiceActive: (code: string) => void;
  updateExtendedCPTCode: (updated: ExtendedCPTCode) => void;

  // Actions
  addImportBatch: (batch: ImportBatch, newRecords: MonthlyManagementRecord[]) => void;
  updateRecord: (updated: MonthlyManagementRecord) => void;
  resolveValidationError: (recordId: string, errorId: string, note?: string) => void;
  toggleRecordPayrollStatus: (recordId: string, newStatus: PayrollStatus, reason?: string) => void;

  // Payroll Actions
  recalculateAllPayroll: (monthOf: string) => void;
  updatePayrollRule: (rule: PayrollRule) => void;
  addPayrollRule: (rule: PayrollRule) => void;
  deletePayrollRule: (ruleId: string) => void;
  addManualPayrollAdjustment: (calcId: string, adjustment: Omit<ManualAdjustment, "id" | "timestamp">) => void;
  updatePayrollStatus: (calcId: string, newStatus: PayrollCalculation["status"]) => void;

  // Catalog Actions
  addCareManager: (cm: CareManager) => void;
  addProvider: (prov: Provider) => void;
  addService: (srv: ServiceCatalogItem) => void;
  addAliasToCareManager: (cmId: string, alias: string) => void;
  addAliasToProvider: (provId: string, alias: string) => void;

  // Audit
  addAuditLog: (action: string, entityType: string, entityId: string, details: string) => void;

  // Reset demo
  resetToSyntheticDemo: () => void;
}

const defaultGlobalFilters: GlobalFilterState = {
  monthOf: "2026-07",
  monthRange: ["2026-06", "2026-07", "2026-08"],
  organizationId: "ORG-001",
  practiceId: "ALL",
  providerId: "ALL",
  careManagerId: "ALL",
  serviceCode: "ALL",
  insurance: "ALL",
  eligibility: "ALL",
  hmo: "ALL",
  cptCode: "ALL",
  condition: "ALL",
  icd10: "ALL",
  payrollStatus: "ALL",
  qualityStatus: "ALL",
  searchQuery: "",
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{
  children: React.ReactNode;
  authenticatedRole: UserRole;
  authenticatedActor: string;
}> = ({ children, authenticatedRole, authenticatedActor }) => {
  const demoMode = import.meta.env.VITE_DEMO_MODE === "true";
  const [records, setRecords] = useState<MonthlyManagementRecord[]>(() => demoMode ? generateSyntheticRecords() : []);
  const [importBatches, setImportBatches] = useState<ImportBatch[]>(() => demoMode ? INITIAL_IMPORT_BATCHES : []);
  const [payrollRules, setPayrollRules] = useState<PayrollRule[]>(() => demoMode ? INITIAL_PAYROLL_RULES : []);
  const [providers, setProviders] = useState<Provider[]>(() => demoMode ? INITIAL_PROVIDERS : []);
  const [careManagers, setCareManagers] = useState<CareManager[]>(() => demoMode ? INITIAL_CARE_MANAGERS : []);
  const [practices, setPractices] = useState<Practice[]>(() => demoMode ? INITIAL_PRACTICES : []);
  const [services, setServices] = useState<ServiceCatalogItem[]>(INITIAL_SERVICES);
  const [cptCodes] = useState<CPTCode[]>(INITIAL_CPT_CODES);
  const [icd10Codes] = useState<ICD10Code[]>(INITIAL_ICD10_CODES);
  const [mappingTemplates, setMappingTemplates] = useState<MappingTemplate[]>(INITIAL_MAPPING_TEMPLATES);
  const [targetGoals, setTargetGoals] = useState<TargetGoal[]>(INITIAL_TARGET_GOALS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [findings] = useState<AutomatedFinding[]>(INITIAL_AUTOMATED_FINDINGS);
  const currentUserRole = authenticatedRole;
  const [globalFilters, setGlobalFilters] = useState<GlobalFilterState>(defaultGlobalFilters);
  const [serviceConfigs, setServiceConfigs] = useState<ServiceConfigDefinition[]>(INITIAL_SERVICE_CONFIGS);
  const [extendedCPTCodes, setExtendedCPTCodes] = useState<ExtendedCPTCode[]>(INITIAL_EXTENDED_CPT_REGISTRY);
  const [payrollCalculations, setPayrollCalculations] = useState<PayrollCalculation[]>([]);
  const [backendDataRevision, setBackendDataRevision] = useState(0);

  useEffect(() => {
    if (demoMode) return;
    if (!roleHasPermission(currentUserRole, "patient:view")) {
      setRecords([]);
      return;
    }
    let active = true;
    const months = [...new Set([globalFilters.monthOf, ...globalFilters.monthRange].filter(Boolean))];
    void Promise.all(months.map(async (reportingPeriod) => {
      const response = await apiFetch(`/api/patients?monthOf=${encodeURIComponent(reportingPeriod)}`);
      if (!response.ok) throw new Error("patient_data_denied");
      return response.json() as Promise<{ monthOf: string; records?: Array<Record<string, unknown>> }>;
    })).then((payloads) => {
      if (!active) return;
      const mapped: MonthlyManagementRecord[] = payloads.flatMap((payload) => (payload.records || []).map((record) => {
        const validationStatus = String(record.validationStatus || "Valid");
        const duplicateStatus = String(record.duplicateStatus || "New");
        const payrollStatus = String(record.payrollStatus || "Pending Review");
        const validationErrors: ValidationError[] = validationStatus === "Valid" ? [] : [{
          id: `${String(record.id || "record")}:validation`, recordId: String(record.id || ""), rowNumber: 0,
          field: "Validation Status", value: validationStatus,
          severity: validationStatus === "Rejected" ? "Critical Error" : "Warning",
          message: `El backend marcó el registro como ${validationStatus}.`, resolved: false,
        }];
        return ({
        id: String(record.id || ""), batchId: "backend", mrn: String(record.mrn || ""), patientName: String(record.patientName || ""),
        firstName: "", lastName: "", sex: "Other", dob: "", providerId: String(record.providerId || ""), providerName: String(record.providerName || ""),
        careManagerId: String(record.careManagerId || ""), careManagerName: String(record.careManagerName || ""), practiceId: String(record.practiceId || ""), practiceName: "",
        serviceId: String(record.serviceCode || ""), serviceCode: String(record.serviceCode || ""), conditions: record.diagnosisSummary ? [String(record.diagnosisSummary)] : [],
        icd10s: [], codes: Array.isArray(record.codes) ? record.codes.map(String) : [], monthOf: payload.monthOf, logEntries: Number(record.logEntries || 0), monthlyBilling: Number(record.monthlyBilling || 0), lastModificationTime: "",
        latestInteractiveCommunication: String(record.latestInteractiveCommunication || ""), primaryInsuranceName: String(record.insuranceName || ""), primaryPolicyNumber: "", secondaryInsuranceName: "",
        secondaryPolicyNumber: "", address: "", eligibility: ["Eligible", "Ineligible", "Pending", "Terminated"].includes(String(record.eligibility)) ? record.eligibility as MonthlyManagementRecord["eligibility"] : "Pending",
        hmo: record.hmo === "Yes" ? "Yes" : "No",
        payrollStatus: ["Included", "Excluded", "Pending Review", "Manual Exception"].includes(payrollStatus) ? payrollStatus as MonthlyManagementRecord["payrollStatus"] : "Pending Review",
        payrollExclusionReason: "", qualityScore: record.dataQualityStatus === "Clean" ? 100 : 70, validationErrors,
        isDuplicate: duplicateStatus !== "New", duplicateDetails: duplicateStatus !== "New" ? duplicateStatus : undefined, manualOverride: false,
      });}));
      setRecords(mapped);
      const managerMap = new Map<string, CareManager>();
      const providerMap = new Map<string, Provider>();
      const practiceMap = new Map<string, Practice>();
      mapped.forEach((record) => {
        if (record.careManagerId && !managerMap.has(record.careManagerId)) managerMap.set(record.careManagerId, {
          id: record.careManagerId, name: record.careManagerName || record.careManagerId, email: "", role: "Care Manager",
          practiceIds: record.practiceId ? [record.practiceId] : [], providerIds: record.providerId ? [record.providerId] : [],
          serviceCodes: record.serviceCode ? [record.serviceCode] : [], status: "Active", aliases: [],
        });
        if (record.providerId && !providerMap.has(record.providerId)) providerMap.set(record.providerId, {
          id: record.providerId, practiceId: record.practiceId, name: record.providerName || record.providerId, aliases: [], status: "Active",
        });
        if (record.practiceId && !practiceMap.has(record.practiceId)) practiceMap.set(record.practiceId, {
          id: record.practiceId, organizationId: "ORG-001", name: record.practiceName || record.practiceId,
          code: record.practiceId, status: "Active",
        });
      });
      setCareManagers([...managerMap.values()]);
      setProviders([...providerMap.values()]);
      setPractices([...practiceMap.values()]);
    }).catch(() => {
      if (!active) return;
      setRecords([]);
      setCareManagers([]);
      setProviders([]);
      setPractices([]);
    });
    return () => { active = false; };
  }, [currentUserRole, demoMode, globalFilters.monthOf, globalFilters.monthRange]);

  const updateServiceConfig = (updated: ServiceConfigDefinition) => {
    setServiceConfigs((prev) => prev.map((sc) => (sc.id === updated.id ? updated : sc)));
    addAuditLog("Update Service Config", "ServiceConfigDefinition", updated.id, `Configuración actualizada para servicio ${updated.code}`);
  };

  const toggleServiceActive = (code: string) => {
    setServiceConfigs((prev) =>
      prev.map((sc) => (sc.code === code ? { ...sc, active: !sc.active } : sc))
    );
    addAuditLog("Toggle Service Active", "ServiceConfigDefinition", code, `Estado activo alternado para servicio ${code}`);
  };

  const updateExtendedCPTCode = (updated: ExtendedCPTCode) => {
    setExtendedCPTCodes((prev) => prev.map((cpt) => (cpt.code === updated.code ? updated : cpt)));
    addAuditLog("Update CPT Registry Code", "ExtendedCPTCode", updated.code, `Actualizado CPT ${updated.code} en catálogo`);
  };

  // Load authorized payroll in production; use the local engine only in explicit demo mode.
  useEffect(() => {
    if (!roleHasPermission(currentUserRole, "payroll:view")) {
      setPayrollCalculations([]);
      return;
    }
    if (demoMode) {
      const month = globalFilters.monthOf || "2026-07";
      const calcs = careManagers.map((cm) => {
        const existing = payrollCalculations.find((c) => c.careManagerId === cm.id && c.monthOf === month);
        return calculatePayrollForCareManager(cm, records, payrollRules, month, existing);
      });
      setPayrollCalculations(calcs);
      return;
    }
    let active = true;
    const months = [...new Set([globalFilters.monthOf, ...globalFilters.monthRange].filter(Boolean))];
    void Promise.all(months.map(async (monthOf) => {
      const response = await apiFetch(`/api/payroll?monthOf=${encodeURIComponent(monthOf)}`);
      if (!response.ok) throw new Error("payroll_data_denied");
      return response.json() as Promise<{ rows?: Array<Record<string, unknown>> }>;
    })).then((payloads) => {
      if (!active) return;
      const allowedStatuses: PayrollCalculation["status"][] = ["Draft", "Data Validation", "Manager Review", "Adjustments Required", "Ready for Approval", "Approved", "Closed", "Exported"];
      const rows = payloads.flatMap((payload) => payload.rows || []).map((row): PayrollCalculation => {
        const monthOf = String(row.monthOf || globalFilters.monthOf);
        const careManagerId = String(row.careManagerId || "");
        const managedPatientsCount = records.filter((record) => record.monthOf === monthOf && record.careManagerId === careManagerId).length;
        const rawStatus = String(row.status || "Draft") as PayrollCalculation["status"];
        const baseEarnings = Number(row.baseEarnings || 0);
        const bonuses = Number(row.bonuses || 0);
        const deductions = Number(row.deductions || 0);
        return {
          id: String(row.id || `${monthOf}:${careManagerId}`), careManagerId, careManagerName: String(row.careManagerName || careManagerId), monthOf,
          status: allowedStatuses.includes(rawStatus) ? rawStatus : "Draft", version: Number(row.calculationVersion || 1),
          managedPatientsCount, eligiblePatientsCount: managedPatientsCount, excludedPatientsCount: 0,
          baseEarnings, bonuses, deductions, manualAdjustments: [], grossPay: baseEarnings + bonuses,
          netPay: Number(row.netPay || 0), breakdownLines: [], history: [],
        };
      });
      setPayrollCalculations(rows);
    }).catch(() => { if (active) setPayrollCalculations([]); });
    return () => { active = false; };
  }, [records, payrollRules, careManagers, currentUserRole, demoMode, globalFilters.monthOf, globalFilters.monthRange, backendDataRevision]);

  const addAuditLog = (action: string, entityType: string, entityId: string, details: string) => {
    const newEntry: AuditLogEntry = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      user: authenticatedActor,
      userRole: currentUserRole,
      action,
      entityType,
      entityId,
      details,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  const addImportBatch = (batch: ImportBatch, newRecords: MonthlyManagementRecord[]) => {
    setImportBatches((prev) => [batch, ...prev]);
    setRecords((prev) => [...newRecords, ...prev]);
    addAuditLog("Import Batch Completed", "ImportBatch", batch.id, `Cargado archivo ${batch.filename} con ${batch.totalRows} registros.`);
  };

  const updateRecord = (updated: MonthlyManagementRecord) => {
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    addAuditLog("Update Record", "MonthlyManagementRecord", updated.id, `Actualizado registro de paciente ${updated.mrn}`);
  };

  const resolveValidationError = (recordId: string, errorId: string, note?: string) => {
    if (!demoMode) return;
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== recordId) return r;
        const updatedErrors = r.validationErrors.map((err) =>
          err.id === errorId ? { ...err, resolved: true, resolutionNote: note || "Resuelto por usuario" } : err
        );
        return { ...r, validationErrors: updatedErrors };
      })
    );
    addAuditLog("Resolve Validation Error", "ValidationError", errorId, `Error resuelto para registro ${recordId}`);
  };

  const toggleRecordPayrollStatus = (recordId: string, newStatus: PayrollStatus, reason?: string) => {
    if (!demoMode) return;
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== recordId) return r;
        return {
          ...r,
          payrollStatus: newStatus,
          payrollExclusionReason: reason || r.payrollExclusionReason,
          manualOverride: true,
        };
      })
    );
    addAuditLog("Change Payroll Status", "MonthlyManagementRecord", recordId, `Cambiado estado a ${newStatus}. Razón: ${reason || 'N/A'}`);
  };

  const recalculateAllPayroll = (monthOf: string) => {
    if (!demoMode) {
      void apiFetch("/api/reporting-periods/recalculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportingPeriod: monthOf }),
      }).then((response) => {
        if (response.ok) setBackendDataRevision((revision) => revision + 1);
      });
      return;
    }
    const calcs = careManagers.map((cm) => {
      const existing = payrollCalculations.find((c) => c.careManagerId === cm.id && c.monthOf === monthOf);
      return calculatePayrollForCareManager(cm, records, payrollRules, monthOf, existing);
    });
    setPayrollCalculations(calcs);
    addAuditLog("Recalculate All Payroll", "PayrollCalculation", monthOf, `Recalculado el payroll completo del mes ${monthOf}.`);
  };

  const updatePayrollRule = (rule: PayrollRule) => {
    setPayrollRules((prev) => prev.map((r) => (r.id === rule.id ? rule : r)));
    addAuditLog("Update Payroll Rule", "PayrollRule", rule.id, `Regla ${rule.name} modificada.`);
  };

  const addPayrollRule = (rule: PayrollRule) => {
    setPayrollRules((prev) => [...prev, rule]);
    addAuditLog("Add Payroll Rule", "PayrollRule", rule.id, `Nueva regla creada: ${rule.name}`);
  };

  const deletePayrollRule = (ruleId: string) => {
    setPayrollRules((prev) => prev.filter((r) => r.id !== ruleId));
    addAuditLog("Delete Payroll Rule", "PayrollRule", ruleId, `Regla eliminada.`);
  };

  const addManualPayrollAdjustment = (calcId: string, adjustment: Omit<ManualAdjustment, "id" | "timestamp">) => {
    if (!demoMode) return;
    const adjObj: ManualAdjustment = {
      ...adjustment,
      id: `ADJ-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
    };

    setPayrollCalculations((prev) =>
      prev.map((c) => {
        if (c.id !== calcId) return c;
        const newAdjustments = [...c.manualAdjustments, adjObj];
        const manualTotal = newAdjustments.reduce((acc, a) => acc + a.amount, 0);
        const grossPay = c.baseEarnings + c.bonuses;
        const netPay = Math.max(0, grossPay - c.deductions + manualTotal);
        return {
          ...c,
          manualAdjustments: newAdjustments,
          netPay,
        };
      })
    );
    addAuditLog("Manual Payroll Adjustment", "PayrollCalculation", calcId, `Ajuste manual de $${adjustment.amount} por ${adjustment.reason}`);
  };

  const updatePayrollStatus = (calcId: string, newStatus: PayrollCalculation["status"]) => {
    if (!demoMode) return;
    setPayrollCalculations((prev) =>
      prev.map((c) => {
        if (c.id !== calcId) return c;
        const isClosed = newStatus === "Closed";
        const historyEntry = {
          version: c.version,
          timestamp: new Date().toISOString(),
          modifiedBy: currentUserRole,
          changeReason: `Estado cambiado a ${newStatus}`,
          netPay: c.netPay,
        };
        return {
          ...c,
          status: newStatus,
          closedAt: isClosed ? new Date().toISOString() : c.closedAt,
          closedBy: isClosed ? currentUserRole : c.closedBy,
          version: isClosed ? c.version + 1 : c.version,
          history: [...(c.history || []), historyEntry],
        };
      })
    );
    addAuditLog("Payroll Status Changed", "PayrollCalculation", calcId, `Estado del payroll actualizado a ${newStatus}`);
  };

  const addCareManager = (cm: CareManager) => {
    setCareManagers((prev) => [...prev, cm]);
    addAuditLog("Add Care Manager", "CareManager", cm.id, `Nuevo Care Manager ${cm.name} agregado al catálogo.`);
  };

  const addProvider = (prov: Provider) => {
    setProviders((prev) => [...prev, prov]);
    addAuditLog("Add Provider", "Provider", prov.id, `Nuevo Provider ${prov.name} agregado.`);
  };

  const addService = (srv: ServiceCatalogItem) => {
    setServices((prev) => [...prev, srv]);
    addAuditLog("Add Service", "ServiceCatalogItem", srv.id, `Nuevo Servicio ${srv.code} - ${srv.name} agregado.`);
  };

  const addAliasToCareManager = (cmId: string, alias: string) => {
    if (!demoMode) return;
    setCareManagers((prev) =>
      prev.map((cm) => (cm.id === cmId ? { ...cm, aliases: [...new Set([...cm.aliases, alias])] } : cm))
    );
    addAuditLog("Add Alias to Care Manager", "CareManager", cmId, `Alias '${alias}' agregado a Care Manager.`);
  };

  const addAliasToProvider = (provId: string, alias: string) => {
    if (!demoMode) return;
    setProviders((prev) =>
      prev.map((p) => (p.id === provId ? { ...p, aliases: [...new Set([...p.aliases, alias])] } : p))
    );
    addAuditLog("Add Alias to Provider", "Provider", provId, `Alias '${alias}' agregado a Provider.`);
  };

  const resetGlobalFilters = () => setGlobalFilters(defaultGlobalFilters);

  const resetToSyntheticDemo = () => {
    if (!demoMode) return;
    setRecords(generateSyntheticRecords());
    setImportBatches(INITIAL_IMPORT_BATCHES);
    setPayrollRules(INITIAL_PAYROLL_RULES);
    setCareManagers(INITIAL_CARE_MANAGERS);
    setProviders(INITIAL_PROVIDERS);
    setGlobalFilters(defaultGlobalFilters);
    addAuditLog("Reset Demo", "System", "ALL", "Datos sintéticos redefinidos para estado de demostración.");
  };

  return (
    <AppContext.Provider
      value={{
        records,
        importBatches,
        payrollRules,
        payrollCalculations,
        providers,
        careManagers,
        practices,
        services,
        cptCodes,
        icd10Codes,
        serviceConfigs,
        extendedCPTCodes,
        mappingTemplates,
        targetGoals,
        auditLogs,
        findings,
        currentUserRole,
        globalFilters,
        setRecords,
        setGlobalFilters,
        resetGlobalFilters,
        updateServiceConfig,
        toggleServiceActive,
        updateExtendedCPTCode,
        addImportBatch,
        updateRecord,
        resolveValidationError,
        toggleRecordPayrollStatus,
        recalculateAllPayroll,
        updatePayrollRule,
        addPayrollRule,
        deletePayrollRule,
        addManualPayrollAdjustment,
        updatePayrollStatus,
        addCareManager,
        addProvider,
        addService,
        addAliasToCareManager,
        addAliasToProvider,
        addAuditLog,
        resetToSyntheticDemo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
