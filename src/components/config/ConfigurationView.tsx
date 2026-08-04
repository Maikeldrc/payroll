import React, { useState } from "react";
import {
  Building2,
  Users,
  Stethoscope,
  Layers,
  FileCode2,
  BookOpen,
  Tag,
  FileSpreadsheet,
  ShieldCheck,
  Plus,
  Settings,
  UserCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import {
  Organization,
  Practice,
  CareManager,
  Provider,
  ServiceCatalogItem,
  CPTCode,
  ICD10Code,
  ServiceICD10CodeSet,
  DataAliasMapping,
  CatalogImportTemplate,
  ConfigUserRole,
} from "../../types";

// Import Tab Components
import { OrganizationsPracticesTab } from "./tabs/OrganizationsPracticesTab";
import { CareManagersTab } from "./tabs/CareManagersTab";
import { ProvidersTab } from "./tabs/ProvidersTab";
import { ServicesTab } from "./tabs/ServicesTab";
import { CptHcpcsTab } from "./tabs/CptHcpcsTab";
import { Icd10Tab } from "./tabs/Icd10Tab";
import { AliasMappingTab } from "./tabs/AliasMappingTab";
import { ImportTemplatesTab } from "./tabs/ImportTemplatesTab";

// Import Drawers and Modals
import { EntityDetailDrawer } from "./drawers/EntityDetailDrawer";
import { DeactivateModal } from "./modals/DeactivateModal";

// Initial Mock Data for missing catalog states
const INITIAL_SERVICE_CODE_SETS: ServiceICD10CodeSet[] = [
  {
    id: "SET-CCM-01",
    name: "CCM Eligible Chronic Conditions",
    serviceCode: "CCM",
    description: "Criterios diagnósticos CMS para Chronic Care Management (2+ condiciones crónicas).",
    includedCodes: ["E11.9", "I10", "I50.9", "J44.9", "N18.3"],
    excludedCodes: [],
    effectiveDate: "2026-01-01",
    version: "1.2",
    status: "Active",
    lastModified: "2026-07-15",
  },
  {
    id: "SET-RPM-01",
    name: "RPM Hypertension & Cardio Protocol",
    serviceCode: "RPM",
    description: "Códigos de diagnóstico primarios para dispositivos de monitoreo remoto kardia/BP.",
    includedCodes: ["I10", "I50.9"],
    excludedCodes: [],
    effectiveDate: "2026-01-01",
    version: "2.0",
    status: "Active",
    lastModified: "2026-06-20",
  },
  {
    id: "SET-BHI-01",
    name: "Behavioral Health Integration Set",
    serviceCode: "BHI",
    description: "Diagnósticos de salud mental aprobados para servicios BHI en atención primaria.",
    includedCodes: ["F33.1", "F41.1"],
    excludedCodes: [],
    effectiveDate: "2026-02-01",
    version: "1.0",
    status: "Active",
    lastModified: "2026-05-10",
  },
];

const INITIAL_ALIAS_MAPPINGS: DataAliasMapping[] = [
  {
    id: "ALIAS-01",
    rawValue: "M. Fernandez RN",
    entityType: "Care Manager",
    suggestedMatch: "Maria Fernandez, RN",
    sourceFile: "REPORTE_MENSUAL_JULIO_2026.xlsx",
    occurrences: 142,
    firstSeen: "2026-07-01",
    lastSeen: "2026-07-31",
    confidence: 98,
    status: "Suggested",
  },
  {
    id: "ALIAS-02",
    rawValue: "Dr. R. Silva MD",
    entityType: "Provider",
    suggestedMatch: "Dr. Roberto Silva",
    sourceFile: "EMR_BILLING_EXPORT_PRAC01.xlsx",
    occurrences: 89,
    firstSeen: "2026-06-15",
    lastSeen: "2026-07-31",
    confidence: 95,
    status: "Suggested",
  },
  {
    id: "ALIAS-03",
    rawValue: "IMG NORTH CLINIC",
    entityType: "Practice",
    suggestedMatch: "ITERA Medical Group - North",
    sourceFile: "PATIENT_ROSTER_Q3.csv",
    occurrences: 45,
    firstSeen: "2026-07-10",
    lastSeen: "2026-07-28",
    confidence: 92,
    status: "Suggested",
  },
  {
    id: "ALIAS-04",
    rawValue: "CHRONIC CARE MGMT",
    entityType: "Service",
    suggestedMatch: "CCM",
    sourceFile: "LOGS_HORARIOS_AUGUST.xlsx",
    occurrences: 310,
    firstSeen: "2026-07-01",
    lastSeen: "2026-08-01",
    confidence: 100,
    status: "Confirmed",
  },
];

const INITIAL_IMPORT_TEMPLATES: CatalogImportTemplate[] = [
  {
    id: "TPL-01",
    name: "Plantilla Estándar Excel Carga Mensual",
    fileType: "Excel (.xlsx)",
    expectedColumns: [
      "MRN",
      "Patient Name",
      "Provider Name",
      "Care Manager",
      "Service Code",
      "Interactive Time Mins",
      "Log Entries",
    ],
    columnMapping: {
      MRN: "mrn",
      "Patient Name": "patientName",
      "Provider Name": "providerName",
      "Care Manager": "careManagerName",
    },
    transformationRules: ["Uppercase MRN", "Trim spaces", "Normalize Care Manager name"],
    dateFormat: "YYYY-MM-DD",
    decimalFormat: "0.00",
    aliasRules: "Auto-match with >90% confidence",
    duplicateDetectionRule: "MRN + ServiceCode + MonthOf",
    effectiveDate: "2026-01-01",
    status: "Active",
    lastModified: "2026-07-10",
  },
  {
    id: "TPL-02",
    name: "Plantilla Exportación Billing EMR Coastal",
    fileType: "CSV",
    expectedColumns: ["PatientID", "PhysicianNPI", "Service", "BillingCode", "MonthYear"],
    columnMapping: {
      PatientID: "mrn",
      PhysicianNPI: "providerId",
    },
    transformationRules: ["Map NPI to Provider Master"],
    dateFormat: "MM/DD/YYYY",
    decimalFormat: "0",
    aliasRules: "Strict NPI match",
    duplicateDetectionRule: "Exact line hash match",
    effectiveDate: "2026-03-15",
    status: "Active",
    lastModified: "2026-06-01",
  },
];

export const ConfigurationView: React.FC = () => {
  const {
    careManagers,
    providers,
    practices,
    services,
    cptCodes,
    icd10Codes,
    auditLogs,
    addAuditLog,
    currentUserRole,
  } = useApp();

  // Active Main Nav Tab (6 Tabs)
  const [activeTab, setActiveTab] = useState<
    | "orgs"
    | "cm"
    | "providers"
    | "services"
    | "aliases"
    | "templates"
  >("orgs");

  // Organizations Local State
  const [organizations, setOrganizations] = useState<Organization[]>([
    {
      id: "ORG-001",
      name: "ITERA Health Network",
      legalName: "ITERA Healthcare Management Solutions LLC",
      code: "ITERA-HN",
      type: "MSO",
      status: "Active",
      effectiveDate: "2025-01-01",
      address: "1200 North Kendall Dr, Suite 400, Miami, FL 33176",
      mainContact: { name: "Dr. Carlos ITERA", email: "admin@itera.health", phone: "305-555-0100" },
      activeServices: ["CCM", "RPM", "PCM", "TCM", "BHI", "APCM"],
    },
    {
      id: "ORG-002",
      name: "Coastal Medical Alliance",
      legalName: "Coastal Doctors ACO Inc.",
      code: "COASTAL-ACO",
      type: "ACO",
      status: "Active",
      effectiveDate: "2025-06-01",
      address: "450 Ocean Drive, Fort Lauderdale, FL 33301",
      mainContact: { name: "Sarah Jenkins", email: "s.jenkins@coastalaco.com", phone: "954-555-0199" },
      activeServices: ["CCM", "RPM"],
    },
  ]);

  // Local state for extended catalogs
  const [localPractices, setLocalPractices] = useState<Practice[]>(practices);
  const [localCareManagers, setLocalCareManagers] = useState<CareManager[]>(careManagers);
  const [localProviders, setLocalProviders] = useState<Provider[]>(providers);
  const [localServices, setLocalServices] = useState<ServiceCatalogItem[]>(services);
  const [localCPTCodes, setLocalCPTCodes] = useState<CPTCode[]>(cptCodes);
  const [serviceCodeSets, setServiceCodeSets] = useState<ServiceICD10CodeSet[]>(INITIAL_SERVICE_CODE_SETS);
  const [aliasMappings, setAliasMappings] = useState<DataAliasMapping[]>(INITIAL_ALIAS_MAPPINGS);
  const [importTemplates, setImportTemplates] = useState<CatalogImportTemplate[]>(INITIAL_IMPORT_TEMPLATES);

  // Drawer and Modal States
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<
    "Organization" | "Practice" | "CareManager" | "Provider" | "Service" | "CPT" | "ICD10CodeSet" | "ImportTemplate" | null
  >(null);

  const [deactivateEntityInfo, setDeactivateEntityInfo] = useState<{
    entity: any;
    type: string;
  } | null>(null);

  // Role permissions switcher state
  // Entity Drawer Handlers
  const handleOpenDrawer = (entity: any, type: any) => {
    setSelectedEntity(entity);
    setSelectedEntityType(type);
  };

  const handleCloseDrawer = () => {
    setSelectedEntity(null);
    setSelectedEntityType(null);
  };

  const handleSaveEntity = (updatedEntity: any, type: string) => {
    if (type === "Organization") {
      setOrganizations((prev) =>
        prev.map((o) => (o.id === updatedEntity.id ? updatedEntity : o))
      );
    } else if (type === "Practice") {
      setLocalPractices((prev) =>
        prev.map((p) => (p.id === updatedEntity.id ? updatedEntity : p))
      );
    } else if (type === "CareManager") {
      setLocalCareManagers((prev) =>
        prev.map((cm) => (cm.id === updatedEntity.id ? updatedEntity : cm))
      );
    } else if (type === "Provider") {
      setLocalProviders((prev) =>
        prev.map((p) => (p.id === updatedEntity.id ? updatedEntity : p))
      );
    } else if (type === "Service") {
      setLocalServices((prev) =>
        prev.map((s) => (s.id === updatedEntity.id ? updatedEntity : s))
      );
    } else if (type === "CPT") {
      setLocalCPTCodes((prev) =>
        prev.map((c) => (c.code === updatedEntity.code ? updatedEntity : c))
      );
    } else if (type === "ICD10CodeSet") {
      setServiceCodeSets((prev) =>
        prev.map((cs) => (cs.id === updatedEntity.id ? updatedEntity : cs))
      );
    }

    addAuditLog(
      `Updated ${type} master record: ${updatedEntity.name || updatedEntity.code}`,
      type,
      updatedEntity.id || updatedEntity.code,
      `Modificación de catálogo maestro ejecutada por ${currentUserRole}.`
    );
  };

  // Soft Deactivation Handler
  const handleConfirmDeactivate = (effectiveDate: string, reason: string) => {
    if (!deactivateEntityInfo) return;
    const { entity, type } = deactivateEntityInfo;

    const updatedEntity = {
      ...entity,
      status: "Inactive",
      terminationDate: effectiveDate,
      deactivationReason: reason,
    };

    handleSaveEntity(updatedEntity, type);
    setDeactivateEntityInfo(null);
  };

  // Add Handlers for creation
  const handleAddNewOrg = () => {
    const newOrg: Organization = {
      id: `ORG-00${organizations.length + 1}`,
      name: "Nueva Organización Médica",
      legalName: "Nueva Org Legal Inc.",
      code: `ORG-${organizations.length + 1}`,
      type: "Medical Group",
      status: "Active",
      effectiveDate: new Date().toISOString().split("T")[0],
    };
    setOrganizations((prev) => [...prev, newOrg]);
    handleOpenDrawer(newOrg, "Organization");
  };

  const handleAddNewPractice = () => {
    const newPrac: Practice = {
      id: `PRAC-0${localPractices.length + 1}`,
      organizationId: "ORG-001",
      name: "Nueva Práctica Médica",
      code: `PRAC-0${localPractices.length + 1}`,
      status: "Active",
      effectiveDate: new Date().toISOString().split("T")[0],
    };
    setLocalPractices((prev) => [...prev, newPrac]);
    handleOpenDrawer(newPrac, "Practice");
  };

  const handleAddNewCareManager = () => {
    const newCM: CareManager = {
      id: `CM-2${localCareManagers.length + 1}`,
      name: "Nuevo Care Manager, RN",
      email: "nuevo.cm@itera.health",
      role: "Care Manager",
      practiceIds: ["PRAC-01"],
      providerIds: ["PROV-101"],
      status: "Active",
      aliases: [],
    };
    setLocalCareManagers((prev) => [...prev, newCM]);
    handleOpenDrawer(newCM, "CareManager");
  };

  const handleAddNewProvider = () => {
    const newProv: Provider = {
      id: `PROV-10${localProviders.length + 1}`,
      practiceId: "PRAC-01",
      name: "Dr. Nuevo Médico",
      npi: "1999888777",
      specialty: "Internal Medicine",
      aliases: [],
      status: "Active",
    };
    setLocalProviders((prev) => [...prev, newProv]);
    handleOpenDrawer(newProv, "Provider");
  };

  const handleAddNewService = () => {
    const newSrv: ServiceCatalogItem = {
      id: `SRV-NEW-${localServices.length + 1}`,
      code: `SRV${localServices.length + 1}`,
      name: "Nuevo Programa Clínico",
      description: "Programa de gestión de salud preventiva y personalizada.",
      isCustom: true,
      active: true,
      defaultCPTCodes: ["99490"],
    };
    setLocalServices((prev) => [...prev, newSrv]);
    handleOpenDrawer(newSrv, "Service");
  };

  const handleAddNewCPT = () => {
    const newCPT: CPTCode = {
      code: `9949${localCPTCodes.length + 1}`,
      serviceCode: "CCM",
      description: "Nuevo Código de Gestión CPT",
      standardRate: 55.0,
      status: "Active",
    };
    setLocalCPTCodes((prev) => [...prev, newCPT]);
    handleOpenDrawer(newCPT, "CPT");
  };

  return (
    <div className="space-y-6 pb-16 text-xs text-slate-700">
      {/* Module Title Banner & Role Permissions Switcher */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold uppercase tracking-wider">
              Master Data Center
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Rol Actual: {currentUserRole}
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">Configuración & Catálogos Corporativos</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Centro administrativo centralizado para organizaciones, prácticas, care managers, médicos, programas, mapeos de alias y plantillas de importación.
          </p>
        </div>

        <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 shrink-0">
          Permisos determinados por el servidor
        </div>
      </div>

      {/* 8 Primary Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 rounded-2xl p-1 shadow-xs overflow-x-auto no-scrollbar flex items-center gap-1 font-bold text-xs">
        <button
          onClick={() => setActiveTab("orgs")}
          className={`px-3.5 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "orgs"
              ? "bg-slate-900 text-white shadow-xs font-black"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Building2 className="w-4 h-4 text-indigo-400" />
          Organizations & Practices ({organizations.length + localPractices.length})
        </button>

        <button
          onClick={() => setActiveTab("cm")}
          className={`px-3.5 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "cm"
              ? "bg-slate-900 text-white shadow-xs font-black"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Users className="w-4 h-4 text-teal-400" />
          Care Managers ({localCareManagers.length})
        </button>

        <button
          onClick={() => setActiveTab("providers")}
          className={`px-3.5 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "providers"
              ? "bg-slate-900 text-white shadow-xs font-black"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Stethoscope className="w-4 h-4 text-emerald-400" />
          Providers ({localProviders.length})
        </button>

        <button
          onClick={() => setActiveTab("services")}
          className={`px-3.5 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "services"
              ? "bg-slate-900 text-white shadow-xs font-black"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Layers className="w-4 h-4 text-amber-400" />
          Services ({localServices.length})
        </button>

        <button
          onClick={() => setActiveTab("aliases")}
          className={`px-3.5 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "aliases"
              ? "bg-slate-900 text-white shadow-xs font-black"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Tag className="w-4 h-4 text-rose-400" />
          Alias & Data Mapping ({aliasMappings.length})
        </button>

        <button
          onClick={() => setActiveTab("templates")}
          className={`px-3.5 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "templates"
              ? "bg-slate-900 text-white shadow-xs font-black"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
          Import Templates ({importTemplates.length})
        </button>
      </div>

      {/* Render Active Tab Content */}
      {activeTab === "orgs" && (
        <OrganizationsPracticesTab
          organizations={organizations}
          practices={localPractices}
          careManagers={localCareManagers}
          providers={localProviders}
          userRole={currentUserRole as ConfigUserRole}
          onSelectEntity={(ent, type) => handleOpenDrawer(ent, type)}
          onAddOrganization={handleAddNewOrg}
          onAddPractice={handleAddNewPractice}
          onDeactivateEntity={(ent, type) => setDeactivateEntityInfo({ entity: ent, type })}
        />
      )}

      {activeTab === "cm" && (
        <CareManagersTab
          careManagers={localCareManagers}
          practices={localPractices}
          providers={localProviders}
          userRole={currentUserRole as ConfigUserRole}
          onSelectCareManager={(cm) => handleOpenDrawer(cm, "CareManager")}
          onAddCareManager={handleAddNewCareManager}
          onDeactivateCareManager={(cm) => setDeactivateEntityInfo({ entity: cm, type: "CareManager" })}
        />
      )}

      {activeTab === "providers" && (
        <ProvidersTab
          providers={localProviders}
          practices={localPractices}
          careManagers={localCareManagers}
          userRole={currentUserRole as ConfigUserRole}
          onSelectProvider={(p) => handleOpenDrawer(p, "Provider")}
          onAddProvider={handleAddNewProvider}
          onDeactivateProvider={(p) => setDeactivateEntityInfo({ entity: p, type: "Provider" })}
        />
      )}

      {activeTab === "services" && (
        <ServicesTab
          services={localServices}
          practices={localPractices}
          providers={localProviders}
          userRole={currentUserRole as ConfigUserRole}
          onSelectService={(s) => handleOpenDrawer(s, "Service")}
          onAddService={handleAddNewService}
          onDeactivateService={(s) => setDeactivateEntityInfo({ entity: s, type: "Service" })}
        />
      )}

      {activeTab === "aliases" && (
        <AliasMappingTab
          aliasMappings={aliasMappings}
          userRole={currentUserRole as ConfigUserRole}
          onConfirmMapping={(id, matchedEntity) => {
            setAliasMappings((prev) =>
              prev.map((item) =>
                item.id === id ? { ...item, status: "Confirmed", confirmedMatch: matchedEntity } : item
              )
            );
          }}
          onCreateMasterRecord={(alias) => {
            if (alias.entityType === "Care Manager") {
              handleAddNewCareManager();
            } else if (alias.entityType === "Provider") {
              handleAddNewProvider();
            }
          }}
          onIgnoreAlias={(id) => {
            setAliasMappings((prev) => prev.filter((item) => item.id !== id));
          }}
        />
      )}

      {activeTab === "templates" && (
        <ImportTemplatesTab
          templates={importTemplates}
          userRole={currentUserRole as ConfigUserRole}
          onSelectTemplate={(tpl) => handleOpenDrawer(tpl, "ImportTemplate")}
          onAddTemplate={() => {
            const newTpl: CatalogImportTemplate = {
              id: `TPL-0${importTemplates.length + 1}`,
              name: "Nueva Plantilla Excel",
              fileType: "Excel (.xlsx)",
              expectedColumns: ["MRN", "Patient", "Service"],
              columnMapping: { MRN: "mrn" },
              transformationRules: ["Trim"],
              dateFormat: "YYYY-MM-DD",
              decimalFormat: "0.00",
              aliasRules: "Auto-match",
              duplicateDetectionRule: "MRN + ServiceCode",
              effectiveDate: new Date().toISOString().split("T")[0],
              status: "Active",
              lastModified: new Date().toISOString().split("T")[0],
            };
            setImportTemplates((prev) => [...prev, newTpl]);
            handleOpenDrawer(newTpl, "ImportTemplate");
          }}
          onDuplicateTemplate={(tpl) => {
            const dup = {
              ...tpl,
              id: `TPL-0${importTemplates.length + 1}`,
              name: `${tpl.name} (Copia)`,
            };
            setImportTemplates((prev) => [...prev, dup]);
          }}
        />
      )}

      {/* Unified Side Drawer */}
      <EntityDetailDrawer
        isOpen={Boolean(selectedEntity)}
        entity={selectedEntity}
        entityType={selectedEntityType}
        userRole={currentUserRole as ConfigUserRole}
        auditLogs={auditLogs}
        practices={localPractices}
        providers={localProviders}
        careManagers={localCareManagers}
        services={localServices}
        onClose={handleCloseDrawer}
        onSave={handleSaveEntity}
      />

      {/* Soft Deactivation Confirmation Modal */}
      {deactivateEntityInfo && (
        <DeactivateModal
          isOpen={Boolean(deactivateEntityInfo)}
          entityName={deactivateEntityInfo.entity.name || deactivateEntityInfo.entity.code}
          entityType={deactivateEntityInfo.type}
          onClose={() => setDeactivateEntityInfo(null)}
          onConfirm={handleConfirmDeactivate}
        />
      )}
    </div>
  );
};
