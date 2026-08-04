import React, { useState } from "react";
import { BookOpen, X, Search, Filter, AlertCircle, CheckCircle, Info } from "lucide-react";

export interface MetricDefinition {
  id: string;
  name: string;
  category: "Executive" | "CCM" | "RPM" | "PCM" | "BHI" | "APCM" | "TCM" | "RTM" | "CoCM" | "Productivity" | "Payroll" | "Revenue" | "Quality";
  definition: string;
  formula: string;
  numerator: string;
  denominator: string;
  sourceFields: string[];
  applicableServices: string[];
  exclusions: string;
  target: string;
  warningThreshold: string;
  criticalThreshold: string;
  effectiveDate: string;
  version: string;
}

export const METRIC_DICTIONARY_DATA: MetricDefinition[] = [
  {
    id: "MET-001",
    name: "Unique Active Patients",
    category: "Executive",
    definition: "Cantidad de pacientes únicos (deduplicados por MRN, Práctica y Mes) que recibieron al menos un servicio de Care Management en el periodo.",
    formula: "Count(Distinct MRN) where Month = SelectedMonth",
    numerator: "Registros únicos de paciente activos",
    denominator: "N/A (Conteo absoluto)",
    sourceFields: ["mrn", "practiceId", "monthOf"],
    applicableServices: ["CCM", "RPM", "PCM", "BHI", "TCM", "APCM", "RTM", "CoCM"],
    exclusions: "Registros duplicados y pacientes inactivos sin interacción en el mes.",
    target: "≥ 80 pacientes por Care Manager",
    warningThreshold: "< 60 pacientes",
    criticalThreshold: "< 40 pacientes",
    effectiveDate: "2026-01-01",
    version: "2.1",
  },
  {
    id: "MET-002",
    name: "Unique Billable Patients",
    category: "Executive",
    definition: "Pacientes únicos deduplicados que cumplen todos los criterios de facturación elegible en al menos uno de sus programas asignados.",
    formula: "Count(Distinct MRN) where MonthlyBilling > 0 AND Eligibility = 'Eligible'",
    numerator: "Pacientes únicos con códigos CPT facturables",
    denominator: "Unique Active Patients",
    sourceFields: ["mrn", "monthlyBilling", "eligibility", "payrollStatus"],
    applicableServices: ["Todos"],
    exclusions: "Pacientes no elegibles o con estados de exclusión manual en payroll.",
    target: "≥ 85% conversión billable",
    warningThreshold: "< 75%",
    criticalThreshold: "< 65%",
    effectiveDate: "2026-01-01",
    version: "2.0",
  },
  {
    id: "MET-003",
    name: "CCM Billable Rate",
    category: "CCM",
    definition: "Porcentaje de registros de servicio CCM que alcanzan los requerimientos de facturación (al menos 20 min y comunicación interactiva).",
    formula: "(Billable CCM Patients ÷ Total CCM Patient-Service Records) × 100",
    numerator: "Pacientes CCM con CPT 99490 / 99439 / 99491 válidos",
    denominator: "Total registros registrados en CCM en el mes",
    sourceFields: ["serviceCode", "monthlyBilling", "codes"],
    applicableServices: ["CCM"],
    exclusions: "Pacientes sin fecha de comunicación interactiva documentada.",
    target: "≥ 85.0%",
    warningThreshold: "< 75.0%",
    criticalThreshold: "< 65.0%",
    effectiveDate: "2026-01-01",
    version: "1.8",
  },
  {
    id: "MET-004",
    name: "CCM First-to-Second Interval Conversion",
    category: "CCM",
    definition: "Tasa de conversión de pacientes CCM que logran pasar del primer intervalo de 20 minutos (99490) al segundo intervalo adicional (99439).",
    formula: "(Patients with 2nd 20 Mins ÷ Patients with 1st 20 Mins) × 100",
    numerator: "Pacientes CCM con 40+ min documentados",
    denominator: "Pacientes CCM con 20+ min documentados",
    sourceFields: ["serviceCode", "codes", "logEntries"],
    applicableServices: ["CCM"],
    exclusions: "Pacientes sin primer intervalo completado.",
    target: "≥ 40.0%",
    warningThreshold: "< 30.0%",
    criticalThreshold: "< 20.0%",
    effectiveDate: "2026-01-01",
    version: "1.5",
  },
  {
    id: "MET-005",
    name: "RPM Billable Rate",
    category: "RPM",
    definition: "Porcentaje de registros de servicio RPM que califican para facturación mensual (dispositivo con 16 días o gestión interactiva de 20 min).",
    formula: "(Billable RPM Patients ÷ Total RPM Patient-Service Records) × 100",
    numerator: "Pacientes RPM con CPT 99454 o 99457 válidos",
    denominator: "Total de registros asignados a RPM",
    sourceFields: ["serviceCode", "codes", "monthlyBilling"],
    applicableServices: ["RPM"],
    exclusions: "Pacientes sin transmisiones fisiológicas o sin setup.",
    target: "≥ 80.0%",
    warningThreshold: "< 70.0%",
    criticalThreshold: "< 60.0%",
    effectiveDate: "2026-01-01",
    version: "2.0",
  },
  {
    id: "MET-006",
    name: "RPM 16-Day Measurement Coverage Rate",
    category: "RPM",
    definition: "Porcentaje de pacientes RPM que transmiten lecturas fisiológicas durante 16 o más días calendarios dentro del mes analizado.",
    formula: "(RPM Patients with 16+ Days ÷ Total RPM Patients) × 100",
    numerator: "Pacientes RPM con ≥16 días de lecturas registradas",
    denominator: "Total de pacientes inscritos en RPM",
    sourceFields: ["serviceCode", "rpmMeasurementDays", "logEntries"],
    applicableServices: ["RPM"],
    exclusions: "Pacientes en mes inicial de Educación / Setup (CPT 99453 únicamente).",
    target: "≥ 75.0%",
    warningThreshold: "< 60.0%",
    criticalThreshold: "< 50.0%",
    effectiveDate: "2026-01-01",
    version: "2.2",
  },
  {
    id: "MET-014",
    name: "PCM Billable Rate",
    category: "PCM",
    definition: "Porcentaje de pacientes en Principal Care Management que completan el umbral de 30 minutos de atención intensiva para una única condición compleja.",
    formula: "(Billable PCM Patients ÷ Total PCM Patient-Service Records) × 100",
    numerator: "Pacientes PCM con CPT 99424 / 99426 válidos",
    denominator: "Total registros en PCM",
    sourceFields: ["serviceCode", "monthlyBilling", "codes"],
    applicableServices: ["PCM"],
    exclusions: "Pacientes con más de una enfermedad compleja sin plan específico.",
    target: "≥ 75.0%",
    warningThreshold: "< 60.0%",
    criticalThreshold: "< 45.0%",
    effectiveDate: "2026-01-01",
    version: "1.0",
  },
  {
    id: "MET-015",
    name: "TCM 30-Day Episode Completion Rate",
    category: "TCM",
    definition: "Tasa de cumplimiento de episodios de Transitional Care Management con contacto interactivo en 2 días y visita médica dentro de 7/14 días post-alta.",
    formula: "(Completed TCM Episodes ÷ Total Eligible Hospital Discharges) × 100",
    numerator: "Episodios TCM con CPT 99495 / 99496 facturables",
    denominator: "Total altas hospitalarias identificadas",
    sourceFields: ["serviceCode", "tcmContactDate", "tcmFaceToFaceDate"],
    applicableServices: ["TCM"],
    exclusions: "Reingresos hospitalarios no planificados dentro del periodo de 30 días.",
    target: "≥ 80.0%",
    warningThreshold: "< 65.0%",
    criticalThreshold: "< 50.0%",
    effectiveDate: "2026-01-01",
    version: "1.2",
  },
  {
    id: "MET-016",
    name: "BHI Monthly Assessment & Care Plan Rate",
    category: "BHI",
    definition: "Porcentaje de pacientes en Behavioral Health Integration con evaluación estandarizada (PHQ-9/GAD-7) y 20 min de atención integral.",
    formula: "(Billable BHI Patients ÷ Total BHI Active Patients) × 100",
    numerator: "Pacientes BHI con CPT 99484 válido",
    denominator: "Total pacientes inscritos en BHI",
    sourceFields: ["serviceCode", "monthlyBilling", "codes"],
    applicableServices: ["BHI"],
    exclusions: "Pacientes sin escala de tamizaje estandarizada registrada.",
    target: "≥ 75.0%",
    warningThreshold: "< 60.0%",
    criticalThreshold: "< 45.0%",
    effectiveDate: "2026-01-01",
    version: "1.1",
  },
  {
    id: "MET-017",
    name: "APCM Comprehensive Primary Care Rate",
    category: "APCM",
    definition: "Tasa de cumplimiento de gestión avanzada de atención primaria integral en RHC/FQHC bajo código CPT G0511.",
    formula: "(Billable APCM Patients ÷ Total APCM Assigned Patients) × 100",
    numerator: "Pacientes APCM con CPT G0511 facturable",
    denominator: "Total pacientes asignados a APCM",
    sourceFields: ["serviceCode", "monthlyBilling", "codes"],
    applicableServices: ["APCM"],
    exclusions: "Servicios duplicados con otros programas de gestión en el mismo mes.",
    target: "≥ 80.0%",
    warningThreshold: "< 65.0%",
    criticalThreshold: "< 50.0%",
    effectiveDate: "2026-01-01",
    version: "1.0",
  },
  {
    id: "MET-018",
    name: "RTM Device & Therapeutic Compliance Rate",
    category: "RTM",
    definition: "Porcentaje de pacientes en Remote Therapeutic Monitoring con dispositivo configurado y cumplimiento de monitoreo musculoesquelético/respiratorio.",
    formula: "(Billable RTM Patients ÷ Total RTM Enrolled Patients) × 100",
    numerator: "Pacientes RTM con CPT 98975 / 98977 / 98980 válidos",
    denominator: "Total pacientes asignados a RTM",
    sourceFields: ["serviceCode", "monthlyBilling", "codes"],
    applicableServices: ["RTM"],
    exclusions: "Pacientes sin configuración inicial de dispositivo RTM.",
    target: "≥ 70.0%",
    warningThreshold: "< 55.0%",
    criticalThreshold: "< 40.0%",
    effectiveDate: "2026-01-01",
    version: "1.0",
  },
  {
    id: "MET-019",
    name: "CoCM Collaborative Care Time Compliance",
    category: "CoCM",
    definition: "Porcentaje de pacientes en Psychiatric Collaborative Care Management con el tiempo mínimo acumulado de consultoría psiquiátrica y gestión (70m / 60m).",
    formula: "(Billable CoCM Patients ÷ Total CoCM Enrolled Patients) × 100",
    numerator: "Pacientes CoCM con CPT 99492 / 99493 válidos",
    denominator: "Total pacientes en cuidado colaborativo",
    sourceFields: ["serviceCode", "monthlyBilling", "codes"],
    applicableServices: ["CoCM"],
    exclusions: "Pacientes sin revisión del consultor psiquiátrico documentada.",
    target: "≥ 75.0%",
    warningThreshold: "< 60.0%",
    criticalThreshold: "< 45.0%",
    effectiveDate: "2026-01-01",
    version: "1.0",
  },
  {
    id: "MET-007",
    name: "Adjusted Documented Time — Factor ×1.20",
    category: "Productivity",
    definition: "Tiempo total documentado en logs clínicos ajustado por un factor multiplicador (predeterminado 1.20) para reconocer tiempo indirecto de coordinación no logueado.",
    formula: "Total Documented Hours × Adjustment Factor (1.20)",
    numerator: "Horas documentadas en logs × 1.20",
    denominator: "N/A",
    sourceFields: ["documentedHours", "adjustmentFactor"],
    applicableServices: ["Todos"],
    exclusions: "Entradas de tiempo no verificadas o duplicadas.",
    target: "100% coincidencia con horas declaradas",
    warningThreshold: "< 80% de horas declaradas",
    criticalThreshold: "< 65% de horas declaradas",
    effectiveDate: "2026-06-01",
    version: "3.0",
  },
  {
    id: "MET-008",
    name: "Team Utilization Rate",
    category: "Productivity",
    definition: "Eficiencia del Care Manager calculada comparando las horas documentadas ajustadas contra las horas laborales declaradas.",
    formula: "(Adjusted Documented Hours ÷ Declared Working Hours) × 100",
    numerator: "Documented Hours × Factor (1.20)",
    denominator: "Declared Working Hours",
    sourceFields: ["documentedHours", "declaredWorkingHours"],
    applicableServices: ["Todos"],
    exclusions: "Ausencias aprobadas y licencias médicamente justificadas.",
    target: "85% - 100%",
    warningThreshold: "< 75% o > 115%",
    criticalThreshold: "< 60% o > 130%",
    effectiveDate: "2026-01-01",
    version: "2.1",
  },
  {
    id: "MET-009",
    name: "Final Payroll",
    category: "Payroll",
    definition: "Pago neto final del Care Manager sumando tarifa base/horas, bonos de calidad y volumen, deducciones y ajustes manuales auditados.",
    formula: "Base Payroll + Performance Bonus + Quality Bonus − Deductions + Manual Adjustments",
    numerator: "Calculado a nivel individual de Care Manager",
    denominator: "N/A",
    sourceFields: ["baseEarnings", "bonuses", "deductions", "manualAdjustments"],
    applicableServices: ["Todos"],
    exclusions: "Registros en estado Excluded de payroll.",
    target: "Basado en estructura salarial y metas",
    warningThreshold: "Variación >25% vs mes anterior",
    criticalThreshold: "Errores de validación sin resolver",
    effectiveDate: "2026-01-01",
    version: "2.5",
  },
  {
    id: "MET-010",
    name: "Direct Care Management Revenue",
    category: "Revenue",
    definition: "Ingreso bruto generado directamente por la facturación de servicios de gestión de atención (códigos CPT CCM, RPM, PCM, BHI, APCM, etc.).",
    formula: "Sum(MonthlyBilling) where Eligibility = 'Eligible'",
    numerator: "Suma de tarifas CPT aprobadas en facturación",
    denominator: "N/A",
    sourceFields: ["monthlyBilling", "codes", "eligibility"],
    applicableServices: ["Todos"],
    exclusions: "Reclamaciones rechazadas o servicios no facturables.",
    target: "≥ $5,500 por Care Manager a tiempo completo",
    warningThreshold: "< $4,000",
    criticalThreshold: "< $3,000",
    effectiveDate: "2026-01-01",
    version: "2.0",
  },
  {
    id: "MET-011",
    name: "Total Attributed Revenue",
    category: "Revenue",
    definition: "Ingreso total atribuido a la gestión del Care Manager, combinando Revenue Directo más ahorros compartidos y servicios derivados (ej. AWV, especialistas).",
    formula: "Direct Revenue + Attributed Shared Savings / Ancillary Referrals",
    numerator: "Direct Revenue + $1,200 promedio de atribuibles",
    denominator: "N/A",
    sourceFields: ["monthlyBilling", "attributedSavings"],
    applicableServices: ["Todos"],
    exclusions: "Atribuciones fuera del periodo de gestión activa.",
    target: "≥ $7,000 por Care Manager",
    warningThreshold: "< $5,000",
    criticalThreshold: "< $4,000",
    effectiveDate: "2026-01-01",
    version: "1.9",
  },
  {
    id: "MET-012",
    name: "Payroll-to-Direct-Revenue Ratio",
    category: "Revenue",
    definition: "Proporción porcentual del gasto total en payroll sobre el ingreso directo de Care Management generado.",
    formula: "(Final Payroll ÷ Direct Care Management Revenue) × 100",
    numerator: "Final Payroll Total",
    denominator: "Direct Care Management Revenue",
    sourceFields: ["netPay", "monthlyBilling"],
    applicableServices: ["Todos"],
    exclusions: "N/A",
    target: "30% - 40%",
    warningThreshold: "> 45%",
    criticalThreshold: "> 55%",
    effectiveDate: "2026-01-01",
    version: "2.0",
  },
  {
    id: "MET-013",
    name: "Revenue after Payroll",
    category: "Revenue",
    definition: "Margen disponible después de deducir el costo directo de payroll del ingreso atribuido total. (Aviso: No representa utilidad neta final por gastos operativos generales).",
    formula: "Total Attributed Revenue − Final Payroll",
    numerator: "Total Attributed Revenue − Final Payroll",
    denominator: "N/A",
    sourceFields: ["monthlyBilling", "netPay"],
    applicableServices: ["Todos"],
    exclusions: "Gastos indirectos de software e infraestructura.",
    target: "≥ $3,500 por Care Manager",
    warningThreshold: "< $2,000",
    criticalThreshold: "< $1,000",
    effectiveDate: "2026-01-01",
    version: "2.0",
  },
];

interface MetricDictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MetricDictionaryModal: React.FC<MetricDictionaryModalProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [activeMetric, setActiveMetric] = useState<MetricDefinition | null>(METRIC_DICTIONARY_DATA[0]);

  if (!isOpen) return null;

  const filteredMetrics = METRIC_DICTIONARY_DATA.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.definition.toLowerCase().includes(search.toLowerCase()) ||
      m.formula.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-400/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Diccionario Oficial de Métricas & Fórmulas</h3>
              <p className="text-xs text-slate-400">
                Gobernanza de indicadores, algoritmos de cálculo, umbrales y trazabilidad del reporte.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, definición o fórmula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {["ALL", "Executive", "CCM", "RPM", "PCM", "BHI", "APCM", "TCM", "RTM", "CoCM", "Productivity", "Payroll", "Revenue"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {cat === "ALL" ? "Todas" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Master List */}
          <div className="w-80 border-r border-slate-200 overflow-y-auto p-3 space-y-1 bg-slate-50/50">
            {filteredMetrics.map((m) => {
              const isSelected = activeMetric?.id === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveMetric(m)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                    isSelected
                      ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500/20"
                      : "bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">
                      {m.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">v{m.version}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs truncate">{m.name}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{m.definition}</p>
                </button>
              );
            })}
            {filteredMetrics.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                No se encontraron métricas con los filtros ingresados.
              </div>
            )}
          </div>

          {/* Right Detail Panel */}
          <div className="flex-1 overflow-y-auto p-6 bg-white space-y-6">
            {activeMetric ? (
              <div className="space-y-6 text-xs text-slate-700">
                {/* Metric Header */}
                <div className="border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 text-[11px] font-bold rounded-lg uppercase tracking-wider">
                      {activeMetric.category}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">ID: {activeMetric.id}</span>
                    <span className="text-slate-400 font-mono text-[11px]">Vigencia: {activeMetric.effectiveDate}</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{activeMetric.name}</h2>
                  <p className="text-slate-600 text-sm mt-1 leading-relaxed">{activeMetric.definition}</p>
                </div>

                {/* Formula Highlight Box */}
                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs space-y-2 shadow-inner border border-slate-800">
                  <div className="text-indigo-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" /> FÓRMULA DE CÁLCULO OFICIAL
                  </div>
                  <div className="text-sm font-semibold text-white">{activeMetric.formula}</div>
                </div>

                {/* Grid Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-slate-400 font-semibold text-[11px]">Numerador:</span>
                    <p className="font-medium text-slate-900">{activeMetric.numerator}</p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-slate-400 font-semibold text-[11px]">Denominador:</span>
                    <p className="font-medium text-slate-900">{activeMetric.denominator}</p>
                  </div>
                </div>

                {/* Source Fields & Services */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                    <span className="text-slate-400 font-semibold text-[11px]">Campos de Origen (Source Fields):</span>
                    <div className="flex flex-wrap gap-1">
                      {activeMetric.sourceFields.map((f) => (
                        <span key={f} className="px-2 py-0.5 bg-slate-100 text-slate-800 font-mono text-[11px] rounded border border-slate-200">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                    <span className="text-slate-400 font-semibold text-[11px]">Servicios Aplicables:</span>
                    <div className="flex flex-wrap gap-1">
                      {activeMetric.applicableServices.map((s) => (
                        <span key={s} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[11px] rounded border border-indigo-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Exclusions & Targets */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80 space-y-1">
                    <span className="font-bold text-amber-900 text-[11px] flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Exclusiones y Reglas Especiales:
                    </span>
                    <p className="text-amber-800">{activeMetric.exclusions}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                      <div className="text-[10px] font-bold text-emerald-800 uppercase">Meta (Target)</div>
                      <div className="font-bold text-emerald-900 text-sm mt-1">{activeMetric.target}</div>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                      <div className="text-[10px] font-bold text-amber-800 uppercase">Umbral de Advertencia</div>
                      <div className="font-bold text-amber-900 text-sm mt-1">{activeMetric.warningThreshold}</div>
                    </div>
                    <div className="bg-rose-50 p-3 rounded-xl border border-rose-200">
                      <div className="text-[10px] font-bold text-rose-800 uppercase">Umbral Crítico</div>
                      <div className="font-bold text-rose-900 text-sm mt-1">{activeMetric.criticalThreshold}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                Seleccione una métrica de la lista para ver su definición detallada.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
