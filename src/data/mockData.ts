import {
  Organization,
  Practice,
  Provider,
  CareManager,
  ServiceCatalogItem,
  CPTCode,
  ICD10Code,
  PayrollRule,
  MonthlyManagementRecord,
  ImportBatch,
  PayrollCalculation,
  TargetGoal,
  AuditLogEntry,
  MappingTemplate,
  AutomatedFinding,
} from "../types";

export const INITIAL_ORGANIZATION: Organization = {
  id: "ORG-001",
  name: "ITERA Health Network",
  code: "ITERA-HN",
};

export const INITIAL_PRACTICES: Practice[] = [
  {
    id: "PRAC-01",
    organizationId: "ORG-001",
    name: "ITERA Medical Group - North",
    code: "IMG-N",
    address: "1200 North Kendall Dr, Suite 400, Miami, FL",
  },
  {
    id: "PRAC-02",
    organizationId: "ORG-001",
    name: "ITERA Specialty Center - South",
    code: "ISC-S",
    address: "8900 SW 72nd St, Suite 210, Miami, FL",
  },
  {
    id: "PRAC-03",
    organizationId: "ORG-001",
    name: "Coastal Health Associates",
    code: "CHA",
    address: "450 Ocean Drive, Fort Lauderdale, FL",
  },
];

export const INITIAL_PROVIDERS: Provider[] = [
  {
    id: "PROV-101",
    practiceId: "PRAC-01",
    name: "Dr. Roberto Silva",
    npi: "1882910291",
    specialty: "Internal Medicine",
    aliases: ["Dr. R. Silva", "Roberto Silva MD", "Silva, Roberto"],
  },
  {
    id: "PROV-102",
    practiceId: "PRAC-01",
    name: "Dra. Patricia Morales",
    npi: "1492019382",
    specialty: "Endocrinology",
    aliases: ["Patricia Morales", "Dra. P. Morales"],
  },
  {
    id: "PROV-103",
    practiceId: "PRAC-02",
    name: "Dr. Fernando Ruiz",
    npi: "1928374651",
    specialty: "Cardiology",
    aliases: ["Dr. F. Ruiz", "Fernando Ruiz MD"],
  },
  {
    id: "PROV-104",
    practiceId: "PRAC-03",
    name: "Dra. Sofia Vance",
    npi: "1234987650",
    specialty: "Family Practice",
    aliases: ["Sofia Vance MD", "Dr. Vance"],
  },
];

export const INITIAL_CARE_MANAGERS: CareManager[] = [
  {
    id: "CM-201",
    name: "Maria Fernandez, RN",
    email: "m.fernandez@itera.health",
    role: "Lead Care Manager",
    supervisorId: "CM-SUPER-01",
    practiceIds: ["PRAC-01", "PRAC-02"],
    providerIds: ["PROV-101", "PROV-102"],
    targetGoalId: "TG-201",
    status: "Active",
    aliases: ["Maria Fernandez", "M. Fernandez RN", "Fernandez, Maria"],
  },
  {
    id: "CM-202",
    name: "Carlos Gutierrez, RN",
    email: "c.gutierrez@itera.health",
    role: "Senior Care Manager",
    supervisorId: "CM-SUPER-01",
    practiceIds: ["PRAC-01"],
    providerIds: ["PROV-102"],
    targetGoalId: "TG-202",
    status: "Active",
    aliases: ["Carlos Gutierrez", "C. Gutierrez", "Gutierrez, Carlos"],
  },
  {
    id: "CM-203",
    name: "Laura Santos, BSN",
    email: "l.santos@itera.health",
    role: "Care Manager",
    supervisorId: "CM-SUPER-01",
    practiceIds: ["PRAC-02", "PRAC-03"],
    providerIds: ["PROV-103", "PROV-104"],
    targetGoalId: "TG-203",
    status: "Active",
    aliases: ["Laura Santos", "L. Santos BSN"],
  },
  {
    id: "CM-204",
    name: "Javier Mendez, LPN",
    email: "j.mendez@itera.health",
    role: "Care Manager",
    supervisorId: "CM-SUPER-02",
    practiceIds: ["PRAC-03"],
    providerIds: ["PROV-104"],
    targetGoalId: "TG-204",
    status: "Active",
    aliases: ["Javier Mendez", "J. Mendez"],
  },
  {
    id: "CM-205",
    name: "Elena Torres, RN",
    email: "e.torres@itera.health",
    role: "Care Manager",
    supervisorId: "CM-SUPER-02",
    practiceIds: ["PRAC-01", "PRAC-03"],
    providerIds: ["PROV-101", "PROV-104"],
    targetGoalId: "TG-205",
    status: "Active",
    aliases: ["Elena Torres", "E. Torres RN"],
  },
  {
    id: "CM-206",
    name: "Ana Ruiz, RN",
    email: "a.ruiz@itera.health",
    role: "Care Manager",
    supervisorId: "CM-SUPER-02",
    practiceIds: ["PRAC-01"],
    providerIds: ["PROV-101"],
    targetGoalId: "TG-206",
    status: "Active",
    aliases: ["Ana Ruiz", "A. Ruiz RN"],
  },
  {
    id: "CM-207",
    name: "David Miller, RN",
    email: "d.miller@itera.health",
    role: "Senior Care Manager",
    supervisorId: "CM-SUPER-01",
    practiceIds: ["PRAC-02"],
    providerIds: ["PROV-103"],
    targetGoalId: "TG-207",
    status: "Active",
    aliases: ["David Miller", "D. Miller"],
  },
  {
    id: "CM-208",
    name: "Patricia Gomez, BSN",
    email: "p.gomez@itera.health",
    role: "Care Manager",
    supervisorId: "CM-SUPER-01",
    practiceIds: ["PRAC-02"],
    providerIds: ["PROV-103"],
    targetGoalId: "TG-208",
    status: "Active",
    aliases: ["Patricia Gomez", "P. Gomez BSN"],
  },
  {
    id: "CM-209",
    name: "Roberto Diaz, LPN",
    email: "r.diaz@itera.health",
    role: "Care Manager",
    supervisorId: "CM-SUPER-02",
    practiceIds: ["PRAC-03"],
    providerIds: ["PROV-104"],
    targetGoalId: "TG-209",
    status: "Active",
    aliases: ["Roberto Diaz", "R. Diaz"],
  },
  {
    id: "CM-210",
    name: "Sofia Alvarez, RN",
    email: "s.alvarez@itera.health",
    role: "Care Manager",
    supervisorId: "CM-SUPER-02",
    practiceIds: ["PRAC-01", "PRAC-02"],
    providerIds: ["PROV-102"],
    targetGoalId: "TG-210",
    status: "Active",
    aliases: ["Sofia Alvarez", "S. Alvarez RN"],
  },
  {
    id: "CM-211",
    name: "Daniel Vargas, BSN",
    email: "d.vargas@itera.health",
    role: "Care Manager",
    supervisorId: "CM-SUPER-02",
    practiceIds: ["PRAC-03"],
    providerIds: ["PROV-104"],
    targetGoalId: "TG-211",
    status: "Active",
    aliases: ["Daniel Vargas", "D. Vargas BSN"],
  },
];

export const INITIAL_SERVICES: ServiceCatalogItem[] = [
  {
    id: "SRV-CCM",
    code: "CCM",
    name: "Chronic Care Management",
    description: "Atención continua y coordinación para pacientes con 2+ condiciones crónicas.",
    isCustom: false,
    active: true,
    defaultCPTCodes: ["99490", "99439", "99491"],
  },
  {
    id: "SRV-RPM",
    code: "RPM",
    name: "Remote Patient Monitoring",
    description: "Monitoreo remoto continuo de signos vitales y datos fisiológicos.",
    isCustom: false,
    active: true,
    defaultCPTCodes: ["99453", "99454", "99457", "99458"],
  },
  {
    id: "SRV-PCM",
    code: "PCM",
    name: "Principal Care Management",
    description: "Enfoque intensivo en una sola condición compleja o de alto riesgo.",
    isCustom: false,
    active: true,
    defaultCPTCodes: ["99424", "99425"],
  },
  {
    id: "SRV-BHI",
    code: "BHI",
    name: "Behavioral Health Integration",
    description: "Integración de salud conductual en la atención primaria.",
    isCustom: false,
    active: true,
    defaultCPTCodes: ["99484"],
  },
  {
    id: "SRV-APCM",
    code: "APCM",
    name: "Advanced Primary Care Management",
    description: "Gestión avanzada integral de atención primaria.",
    isCustom: false,
    active: true,
    defaultCPTCodes: ["G0511"],
  },
  {
    id: "SRV-TCM",
    code: "TCM",
    name: "Transitional Care Management",
    description: "Gestión de transición del hospital al hogar durante 30 días post-alta.",
    isCustom: false,
    active: true,
    defaultCPTCodes: ["99495", "99496"],
  },
  {
    id: "SRV-RTM",
    code: "RTM",
    name: "Remote Therapeutic Monitoring",
    description: "Monitoreo remoto de respuestas terapéuticas y adherencia a medicamentos.",
    isCustom: false,
    active: true,
    defaultCPTCodes: ["98975", "98977"],
  },
  {
    id: "SRV-CoCM",
    code: "CoCM",
    name: "Psychiatric Collaborative Care",
    description: "Cuidado colaborativo psiquiátrico con equipo multidisciplinario.",
    isCustom: false,
    active: true,
    defaultCPTCodes: ["99492", "99493"],
  },
];

export const INITIAL_CPT_CODES: CPTCode[] = [
  { code: "99490", serviceCode: "CCM", description: "CCM primeros 20 minutos de personal médico por mes", standardRate: 62.5 },
  { code: "99439", serviceCode: "CCM", description: "CCM cada 20 minutos adicionales por mes", standardRate: 47.0 },
  { code: "99491", serviceCode: "CCM", description: "CCM primeros 30 minutos por médico o QHP", standardRate: 85.0 },
  { code: "99453", serviceCode: "RPM", description: "RPM configuración inicial del dispositivo y educación al paciente", standardRate: 19.5 },
  { code: "99454", serviceCode: "RPM", description: "RPM suministro del dispositivo con lecturas registradas (mínimo 16 días)", standardRate: 55.0 },
  { code: "99457", serviceCode: "RPM", description: "RPM primeros 20 minutos de tiempo de gestión interactiva", standardRate: 50.0 },
  { code: "99458", serviceCode: "RPM", description: "RPM cada 20 minutos adicionales de gestión interactiva", standardRate: 41.0 },
  { code: "99424", serviceCode: "PCM", description: "PCM primeros 30 minutos de médico o QHP por mes", standardRate: 83.0 },
  { code: "99484", serviceCode: "BHI", description: "BHI 20 minutos de servicios de salud conductual por mes", standardRate: 48.5 },
  { code: "G0511", serviceCode: "APCM", description: "Servicios de gestión de atención en RHC/FQHC", standardRate: 77.0 },
];

export const INITIAL_ICD10_CODES: ICD10Code[] = [
  { code: "E11.9", description: "Type 2 diabetes mellitus without complications", category: "Endocrine" },
  { code: "I10", description: "Essential (primary) hypertension", category: "Cardiovascular" },
  { code: "I50.9", description: "Heart failure, unspecified", category: "Cardiovascular" },
  { code: "J44.9", description: "Chronic obstructive pulmonary disease, unspecified", category: "Respiratory" },
  { code: "F33.1", description: "Major depressive disorder, recurrent, moderate", category: "Behavioral Health" },
  { code: "F41.1", description: "Generalized anxiety disorder", category: "Behavioral Health" },
  { code: "M17.9", description: "Osteoarthritis of knee, unspecified", category: "Musculoskeletal" },
  { code: "N18.3", description: "Chronic kidney disease, stage 3 (moderate)", category: "Renal" },
];

export const INITIAL_PAYROLL_RULES: PayrollRule[] = [
  {
    id: "RULE-01",
    name: "Tarifa Base CCM Paciente Elegible",
    description: "$25.00 por cada paciente CCM elegible gestionado con comunicación interactiva válida.",
    ruleType: "service_rate",
    baseCalculation: "Monto fijo por paciente gestionado en CCM",
    amountOrPercent: 25.0,
    conditions: [
      { field: "serviceCode", operator: "==", value: "CCM", connector: "AND" },
      { field: "eligibility", operator: "==", value: "Eligible", connector: "AND" },
      { field: "latestInteractiveCommunication", operator: "not_empty", value: "" },
    ],
    startDate: "2026-01-01",
    priority: 1,
    active: true,
    applicableServices: ["CCM"],
    applicableCareManagers: [],
    applicablePractices: [],
  },
  {
    id: "RULE-02",
    name: "Tarifa Base RPM Paciente Elegible",
    description: "$30.00 por cada paciente RPM elegible con al menos 10 log entries en el mes.",
    ruleType: "service_rate",
    baseCalculation: "Monto fijo por paciente en RPM",
    amountOrPercent: 30.0,
    conditions: [
      { field: "serviceCode", operator: "==", value: "RPM", connector: "AND" },
      { field: "eligibility", operator: "==", value: "Eligible", connector: "AND" },
      { field: "logEntries", operator: ">=", value: 10 },
    ],
    startDate: "2026-01-01",
    priority: 2,
    active: true,
    applicableServices: ["RPM"],
    applicableCareManagers: [],
    applicablePractices: [],
  },
  {
    id: "RULE-03",
    name: "Tarifa Base PCM/BHI/TCM/Otros",
    description: "$28.00 por paciente elegible gestionado en servicios especializados.",
    ruleType: "service_rate",
    baseCalculation: "Monto fijo por paciente PCM/BHI/TCM",
    amountOrPercent: 28.0,
    conditions: [
      { field: "eligibility", operator: "==", value: "Eligible", connector: "AND" },
      { field: "monthlyBilling", operator: ">", value: 0 },
    ],
    startDate: "2026-01-01",
    priority: 3,
    active: true,
    applicableServices: ["PCM", "BHI", "TCM", "APCM", "RTM", "CoCM"],
    applicableCareManagers: [],
    applicablePractices: [],
  },
  {
    id: "RULE-04",
    name: "Bonificación por Comunicación Interactiva Alta (>85%)",
    description: "$200.00 de bono mensual al Care Manager si su tasa de comunicación interactiva supera el 85%.",
    ruleType: "interactive_comm_bonus",
    baseCalculation: "Bono fijo por cumplimiento de calidad de comunicación",
    amountOrPercent: 200.0,
    conditions: [],
    startDate: "2026-01-01",
    priority: 10,
    active: true,
    applicableServices: [],
    applicableCareManagers: [],
    applicablePractices: [],
  },
  {
    id: "RULE-05",
    name: "Bonificación por Volumen Elevado (>75 Pacientes)",
    description: "$3.00 adicional por paciente cuando la carga total de pacientes gestionados supera 75.",
    ruleType: "volume_bonus",
    baseCalculation: "$3 extra por paciente a partir del paciente 76",
    amountOrPercent: 3.0,
    conditions: [],
    startDate: "2026-01-01",
    priority: 11,
    active: true,
    applicableServices: [],
    applicableCareManagers: [],
    applicablePractices: [],
  },
  {
    id: "RULE-06",
    name: "Deducción por Datos Incompletos o Sin Comunicación",
    description: "Deducción de -$10.00 por registro faltante de comunicación o sin facturación mensual válida.",
    ruleType: "incomplete_deduction",
    baseCalculation: "Penalización por falta de calidad",
    amountOrPercent: 10.0,
    conditions: [
      { field: "latestInteractiveCommunication", operator: "is_empty", value: "" },
    ],
    startDate: "2026-01-01",
    priority: 20,
    active: true,
    applicableServices: [],
    applicableCareManagers: [],
    applicablePractices: [],
  },
];

export const INITIAL_MAPPING_TEMPLATES: MappingTemplate[] = [
  {
    id: "MAP-01",
    name: "Plantilla Estándar Excel ITERA Care",
    reportType: "Care Management Monthly Export",
    createdAt: "2026-05-10",
    mappings: {
      MRN: "mrn",
      Patient: "patientName",
      "First Name": "firstName",
      "Last Name": "lastName",
      Sex: "sex",
      "Date of Birth": "dob",
      Provider: "providerName",
      "Care Manager": "careManagerName",
      Service: "serviceCode",
      Conditions: "conditions",
      "ICD-10s": "icd10s",
      Codes: "codes",
      "Month Of": "monthOf",
      "Log Entries": "logEntries",
      "Monthly Billing": "monthlyBilling",
      "Last Modification Time": "lastModificationTime",
      "Latest Interactive Communication": "latestInteractiveCommunication",
      "Primary Insurance Name": "primaryInsuranceName",
      "Primary Policy Number": "primaryPolicyNumber",
      "Secondary Insurance Name": "secondaryInsuranceName",
      "Secondary Policy Number": "secondaryPolicyNumber",
      Address: "address",
      Eligibility: "eligibility",
      HMO: "hmo",
      Code1: "code1",
      Code2: "code2",
      Code3: "code3",
      Code4: "code4",
      Code5: "code5",
      Code6: "code6",
    },
  },
];

export const INITIAL_TARGET_GOALS: TargetGoal[] = [
  {
    id: "TG-201",
    careManagerId: "CM-201",
    monthOf: "2026-07",
    minPatients: 80,
    minInteractiveCommRate: 85,
    minLogEntriesAvg: 8,
    targetBilling: 6000,
    minQualityScore: 90,
  },
  {
    id: "TG-202",
    careManagerId: "CM-202",
    monthOf: "2026-07",
    minPatients: 75,
    minInteractiveCommRate: 80,
    minLogEntriesAvg: 7,
    targetBilling: 5500,
    minQualityScore: 88,
  },
  {
    id: "TG-203",
    careManagerId: "CM-203",
    monthOf: "2026-07",
    minPatients: 70,
    minInteractiveCommRate: 82,
    minLogEntriesAvg: 6,
    targetBilling: 5000,
    minQualityScore: 85,
  },
  {
    id: "TG-204",
    careManagerId: "CM-204",
    monthOf: "2026-07",
    minPatients: 65,
    minInteractiveCommRate: 75,
    minLogEntriesAvg: 5,
    targetBilling: 4200,
    minQualityScore: 80,
  },
  {
    id: "TG-205",
    careManagerId: "CM-205",
    monthOf: "2026-07",
    minPatients: 70,
    minInteractiveCommRate: 80,
    minLogEntriesAvg: 6,
    targetBilling: 4800,
    minQualityScore: 85,
  },
];

// Helper to generate rich synthetic records for June, July, August 2026
export function generateSyntheticRecords(): MonthlyManagementRecord[] {
  const records: MonthlyManagementRecord[] = [];
  const months = ["2026-06", "2026-07", "2026-08"];

  const patientNames = [
    { first: "Carlos", last: "Gomez", sex: "M", dob: "1955-04-12", address: "742 Evergreen Terrace, Springfield, FL" },
    { first: "Elena", last: "Rodriguez", sex: "F", dob: "1962-11-20", address: "1204 Pine St, Suite 2B, Miami, FL" },
    { first: "Juan", last: "Martinez", sex: "M", dob: "1948-02-05", address: "450 Ocean Drive, Apt 401, Miami, FL" },
    { first: "Sofia", last: "Sanchez", sex: "F", dob: "1970-09-14", address: "890 Palm Ave, Hialeah, FL" },
    { first: "Ricardo", last: "Alvarez", sex: "M", dob: "1953-06-30", address: "3301 Coral Way, Coral Gables, FL" },
    { first: "Carmen", last: "Diaz", sex: "F", dob: "1966-01-18", address: "550 Biltmore Way, Coral Gables, FL" },
    { first: "Miguel", last: "Herrera", sex: "M", dob: "1959-08-22", address: "1020 NW 36th St, Miami, FL" },
    { first: "Ana", last: "Morales", sex: "F", dob: "1975-03-09", address: "780 Sunset Dr, South Miami, FL" },
    { first: "Luis", last: "Castro", sex: "M", dob: "1945-12-01", address: "2200 Biscayne Blvd, Miami, FL" },
    { first: "Isabel", last: "Navarro", sex: "F", dob: "1958-07-25", address: "1400 Alton Rd, Miami Beach, FL" },
    { first: "Roberto", last: "Vargas", sex: "M", dob: "1961-05-15", address: "910 Kendall Dr, Miami, FL" },
    { first: "Teresa", last: "Mendoza", sex: "F", dob: "1952-10-31", address: "600 Brickell Ave, Miami, FL" },
    { first: "Fernando", last: "Ortiz", sex: "M", dob: "1968-02-28", address: "1800 SW 8th St, Miami, FL" },
    { first: "Beatriz", last: "Rios", sex: "F", dob: "1963-09-04", address: "400 Crandon Blvd, Key Biscayne, FL" },
    { first: "Gabriel", last: "Soto", sex: "M", dob: "1956-11-11", address: "1100 NW 17th Ave, Miami, FL" },
  ];

  const insurances = [
    { name: "Medicare Part B", secName: "Aetna Supplemental" },
    { name: "Humana Senior", secName: "Florida Blue" },
    { name: "Blue Cross Blue Shield", secName: "" },
    { name: "UnitedHealthcare", secName: "Wellcare Medigap" },
    { name: "Simply Healthcare HMO", secName: "" },
    { name: "Devoted Health HMO", secName: "Medicaid FL" },
  ];

  const cms = INITIAL_CARE_MANAGERS;
  const provs = INITIAL_PROVIDERS;
  const services = INITIAL_SERVICES;

  let idCounter = 1000;

  months.forEach((month) => {
    patientNames.forEach((p, pIdx) => {
      // Each patient is assigned to 1 or 2 services per month
      const primaryService = services[pIdx % services.length];
      const assignedCM = cms[pIdx % cms.length];
      const assignedProv = provs[pIdx % provs.length];

      const mrn = `ITERA-${10000 + pIdx}`;
      const ins = insurances[pIdx % insurances.length];

      // Introduce realistic variations & potential data errors
      const isHMO = ins.name.includes("HMO") ? "Yes" : "No";
      const isEligible = pIdx === 4 && month === "2026-07" ? "Ineligible" : "Eligible";
      const hasInteractiveComm = !(pIdx === 2 && month === "2026-07");
      const interactiveDate = hasInteractiveComm ? `${month}-${10 + (pIdx % 15)} 14:20` : "";

      const logEntries = pIdx === 2 && month === "2026-07" ? 0 : 5 + ((pIdx * 3) % 15);
      const billing = isEligible === "Eligible" ? 45.0 + (pIdx % 5) * 17.5 : 0;
      const primaryCode = primaryService.defaultCPTCodes[0] || "99490";

      const valErrors = [];
      if (!hasInteractiveComm) {
        valErrors.push({
          id: `ERR-${idCounter}`,
          recordId: `REC-${idCounter}`,
          rowNumber: pIdx + 1,
          field: "latestInteractiveCommunication",
          value: "",
          severity: "Warning" as const,
          message: "Sin fecha de comunicación interactiva en el mes analizado.",
          resolved: false,
        });
      }
      if (logEntries === 0) {
        valErrors.push({
          id: `ERR-${idCounter + 1}`,
          recordId: `REC-${idCounter}`,
          rowNumber: pIdx + 1,
          field: "logEntries",
          value: 0,
          severity: "Warning" as const,
          message: "Log Entries en cero sin actividad registrada.",
          resolved: false,
        });
      }
      if (isEligible === "Ineligible") {
        valErrors.push({
          id: `ERR-${idCounter + 2}`,
          recordId: `REC-${idCounter}`,
          rowNumber: pIdx + 1,
          field: "eligibility",
          value: "Ineligible",
          severity: "Critical Error" as const,
          message: "Paciente identificado como no elegible durante la verificación.",
          resolved: false,
        });
      }

      const qualityScore = Math.max(
        60,
        100 - valErrors.length * 15 - (hasInteractiveComm ? 0 : 15) - (logEntries < 3 ? 10 : 0)
      );

      const payrollStatus =
        isEligible === "Ineligible"
          ? "Excluded"
          : !hasInteractiveComm
          ? "Pending Review"
          : "Included";

      // Adjust codes & service specific metadata
      let assignedCodes = [primaryCode];
      let tcmMeta: any = {};
      let pcmMeta: any = {};

      if (primaryService.code === "PCM") {
        const isPhysicianModel = pIdx % 2 === 0;
        const baseCode = isPhysicianModel ? "99424" : "99426";
        const addonCode = isPhysicianModel ? "99425" : "99427";
        assignedCodes = pIdx % 3 === 0 ? [baseCode, addonCode] : [baseCode];
        pcmMeta = { pcmBillingModel: isPhysicianModel ? "physician_qhp" : "clinical_staff" };
      } else if (primaryService.code === "TCM") {
        const isHighComplexity = pIdx % 2 === 0;
        const cpt = isHighComplexity ? "99496" : "99495";
        assignedCodes = [cpt];
        tcmMeta = {
          tcmDischargeDate: `${month}-03`,
          tcmContactDate: `${month}-04`,
          tcmMedReconDate: `${month}-05`,
          tcmFaceToFaceDate: isHighComplexity ? `${month}-09` : `${month}-15`,
          tcmComplexity: isHighComplexity ? "High" : "Moderate",
        };
      } else if (primaryService.code === "CCM") {
        assignedCodes = pIdx % 3 === 0 ? ["99490", "99439"] : ["99490"];
      } else if (primaryService.code === "RPM") {
        assignedCodes = pIdx % 3 === 0 ? ["99453", "99454", "99457", "99458"] : ["99454", "99457"];
      }

      records.push({
        id: `REC-${idCounter++}`,
        batchId: `BATCH-${month}`,
        mrn,
        patientName: `${p.last}, ${p.first}`,
        firstName: p.first,
        lastName: p.last,
        sex: p.sex as any,
        dob: p.dob,
        providerId: assignedProv.id,
        providerName: assignedProv.name,
        careManagerId: assignedCM.id,
        careManagerName: assignedCM.name,
        practiceId: assignedProv.practiceId,
        practiceName:
          INITIAL_PRACTICES.find((pr) => pr.id === assignedProv.practiceId)?.name || "ITERA Medical",
        serviceId: primaryService.id,
        serviceCode: primaryService.code,
        conditions: ["Essential Hypertension", "Type 2 Diabetes"],
        icd10s: ["I10", "E11.9"],
        codes: assignedCodes,
        code1: assignedCodes[0],
        code2: assignedCodes[1],
        monthOf: month,
        logEntries,
        monthlyBilling: billing,
        lastModificationTime: `${month}-28 17:00`,
        latestInteractiveCommunication: interactiveDate,
        primaryInsuranceName: ins.name,
        primaryPolicyNumber: `POL-${88000 + pIdx * 19}`,
        secondaryInsuranceName: ins.secName,
        secondaryPolicyNumber: ins.secName ? `SEC-${77000 + pIdx * 13}` : "",
        address: p.address,
        eligibility: isEligible as any,
        hmo: isHMO as any,
        payrollStatus: payrollStatus as any,
        payrollExclusionReason:
          payrollStatus === "Excluded"
            ? "Elegibilidad inactiva"
            : payrollStatus === "Pending Review"
            ? "Pendiente verificación de comunicación interactiva"
            : "",
        qualityScore,
        validationErrors: valErrors,
        isDuplicate: false,
        manualOverride: false,
        ...tcmMeta,
        ...pcmMeta,
      });

      // Second service for some patients (e.g. RPM + CCM)
      if (pIdx % 3 === 0) {
        const secondaryService = services[(pIdx + 1) % services.length];
        const secCode = secondaryService.defaultCPTCodes[0] || "99454";
        records.push({
          id: `REC-${idCounter++}`,
          batchId: `BATCH-${month}`,
          mrn,
          patientName: `${p.last}, ${p.first}`,
          firstName: p.first,
          lastName: p.last,
          sex: p.sex as any,
          dob: p.dob,
          providerId: assignedProv.id,
          providerName: assignedProv.name,
          careManagerId: assignedCM.id,
          careManagerName: assignedCM.name,
          practiceId: assignedProv.practiceId,
          practiceName:
            INITIAL_PRACTICES.find((pr) => pr.id === assignedProv.practiceId)?.name || "ITERA Medical",
          serviceId: secondaryService.id,
          serviceCode: secondaryService.code,
          conditions: ["Heart Failure", "COPD"],
          icd10s: ["I50.9", "J44.9"],
          codes: [secCode],
          code1: secCode,
          monthOf: month,
          logEntries: 14,
          monthlyBilling: 75.0,
          lastModificationTime: `${month}-29 11:30`,
          latestInteractiveCommunication: `${month}-21 09:45`,
          primaryInsuranceName: ins.name,
          primaryPolicyNumber: `POL-${88000 + pIdx * 19}`,
          secondaryInsuranceName: ins.secName,
          secondaryPolicyNumber: ins.secName ? `SEC-${77000 + pIdx * 13}` : "",
          address: p.address,
          eligibility: "Eligible",
          hmo: isHMO as any,
          payrollStatus: "Included",
          payrollExclusionReason: "",
          qualityScore: 95,
          validationErrors: [],
          isDuplicate: false,
          manualOverride: false,
        });
      }
    });
  });

  return records;
}

export const INITIAL_IMPORT_BATCHES: ImportBatch[] = [
  {
    id: "BATCH-2026-06",
    filename: "ITERA_Consolidated_Care_Report_June_2026.xlsx",
    fileHash: "a1b2c3d4e5f67890",
    uploadedAt: "2026-07-02 09:15:00",
    uploadedBy: "Carlos Admin",
    totalRows: 120,
    validRows: 115,
    warningRows: 5,
    rejectedRows: 0,
    duplicateRows: 1,
    totalBilling: 8950.0,
    identifiedProviders: ["Dr. Roberto Silva", "Dra. Patricia Morales", "Dr. Fernando Ruiz"],
    identifiedCMs: ["Maria Fernandez, RN", "Carlos Gutierrez, RN", "Laura Santos, BSN"],
    identifiedServices: ["CCM", "RPM", "PCM", "BHI"],
    identifiedMonths: ["2026-06"],
    status: "Completed",
  },
  {
    id: "BATCH-2026-07",
    filename: "ITERA_Consolidated_Care_Report_July_2026.xlsx",
    fileHash: "f9e8d7c6b5a43210",
    uploadedAt: "2026-08-01 10:30:00",
    uploadedBy: "Elena Ops Admin",
    totalRows: 145,
    validRows: 135,
    warningRows: 8,
    rejectedRows: 2,
    duplicateRows: 2,
    totalBilling: 11240.0,
    identifiedProviders: ["Dr. Roberto Silva", "Dra. Patricia Morales", "Dr. Fernando Ruiz", "Dra. Sofia Vance"],
    identifiedCMs: [
      "Maria Fernandez, RN",
      "Carlos Gutierrez, RN",
      "Laura Santos, BSN",
      "Javier Mendez, LPN",
      "Elena Torres, RN",
    ],
    identifiedServices: ["CCM", "RPM", "PCM", "BHI", "TCM", "APCM"],
    identifiedMonths: ["2026-07"],
    status: "Completed",
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "AUD-1001",
    timestamp: "2026-08-01 10:30:00",
    user: "Elena Ops Admin",
    userRole: "Operations Administrator",
    action: "Importation Batch Completed",
    entityType: "ImportBatch",
    entityId: "BATCH-2026-07",
    details: "Archivo ITERA_Consolidated_Care_Report_July_2026.xlsx procesado exitosamente con 145 filas.",
  },
  {
    id: "AUD-1002",
    timestamp: "2026-08-02 14:15:00",
    user: "Payroll Officer",
    userRole: "Payroll Administrator",
    action: "Payroll Calculation Executed",
    entityType: "PayrollCalculation",
    entityId: "PAY-CM-201-2026-07",
    details: "Cálculo de payroll para Maria Fernandez, RN ejecutado para el mes 2026-07. Neto: $2,125.00",
  },
  {
    id: "AUD-1003",
    timestamp: "2026-08-03 09:40:00",
    user: "Manager Supervisor",
    userRole: "Operations Manager",
    action: "Manual Payroll Adjustment Added",
    entityType: "PayrollCalculation",
    entityId: "PAY-CM-201-2026-07",
    details: "Ajuste manual de +$150.00 aplicado a Maria Fernandez, RN por incentivo de excelencia de calidad.",
  },
];

export const INITIAL_AUTOMATED_FINDINGS: AutomatedFinding[] = [
  {
    id: "FIND-01",
    severity: "High",
    title: "Tasa baja de comunicación interactiva en Javier Mendez, LPN",
    description: "Javier Mendez registra un 68% de comunicación interactiva en el mes de Julio, por debajo del estándar del 80%.",
    metricAffected: "Tasa de Comunicación Interactiva",
    currentValue: "68%",
    expectedValue: "≥ 80%",
    relatedRecordIds: [],
    recommendation: "Revisar agenda de llamadas y reasignar apoyo de coordinación.",
    suggestedAction: "Abrir Scorecard de Care Manager",
  },
  {
    id: "FIND-02",
    severity: "Medium",
    title: "Pacientes con billing en $0.00 pero con actividad registrada",
    description: "Se detectaron 4 pacientes con más de 10 Log Entries pero sin facturación mensual asignada.",
    metricAffected: "Facturación Mensual (Monthly Billing)",
    currentValue: "$0.00",
    expectedValue: "> $0.00",
    relatedRecordIds: [],
    recommendation: "Verificar mapeo de códigos CPT y elegibilidad del seguro.",
    suggestedAction: "Revisar Centro de Calidad de Datos",
  },
  {
    id: "FIND-03",
    severity: "Low",
    title: "Concentración de pacientes HMO en Coastal Health Associates",
    description: "El 42% de los pacientes de Coastal Health pertenecen a planes HMO que requieren autorización previa.",
    metricAffected: "Distribución de Seguros HMO",
    currentValue: "42%",
    expectedValue: "< 25%",
    relatedRecordIds: [],
    recommendation: "Auditar autorizaciones activas antes del cierre de mes.",
    suggestedAction: "Ver Análisis de Práctica",
  },
];
