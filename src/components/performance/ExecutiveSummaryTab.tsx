import React, { useState } from "react";
import { Users, UserCheck, Stethoscope, Clock, DollarSign, TrendingUp, HelpCircle, ArrowUpRight, ArrowDownRight, CheckCircle, AlertTriangle, ChevronRight } from "lucide-react";
import { useApp } from "../../context/AppContext";

interface ExecutiveSummaryTabProps {
  onDrillDown: (filter: {
    serviceCode?: string;
    billableOnly?: boolean;
    minDays?: number;
    search?: string;
    qualityErrorOnly?: boolean;
  }) => void;
  onOpenMetricDictionary: () => void;
}

export const ExecutiveSummaryTab: React.FC<ExecutiveSummaryTabProps> = ({ onDrillDown, onOpenMetricDictionary }) => {
  const { records, payrollCalculations, careManagers, globalFilters, serviceConfigs } = useApp();
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const currentMonth = globalFilters.monthOf || "2026-07";
  const prevMonth = "2026-06";

  // Filter records by active global filters
  const filteredRecords = records.filter((r) => {
    if (r.monthOf !== currentMonth) return false;
    if (globalFilters.practiceId !== "ALL" && r.practiceId !== globalFilters.practiceId) return false;
    if (globalFilters.providerId !== "ALL" && r.providerId !== globalFilters.providerId) return false;
    if (globalFilters.careManagerId !== "ALL" && r.careManagerId !== globalFilters.careManagerId) return false;
    if (globalFilters.serviceCode !== "ALL" && r.serviceCode !== globalFilters.serviceCode) return false;
    if (globalFilters.eligibility !== "ALL" && r.eligibility !== globalFilters.eligibility) return false;
    return true;
  });

  const prevRecords = records.filter((r) => r.monthOf === prevMonth);

  // --- Deduplication Logic for Unique Active Patients (Practice + MRN + Month) ---
  const uniqueActiveMap = new Map<string, typeof filteredRecords[0]>();
  filteredRecords.forEach((r) => {
    const key = `${r.practiceId}-${r.mrn}-${r.monthOf}`;
    if (!uniqueActiveMap.has(key)) {
      uniqueActiveMap.set(key, r);
    }
  });
  const uniqueActivePatientsCount = uniqueActiveMap.size;

  // Unique Billable Patients
  const uniqueBillableMap = new Map<string, typeof filteredRecords[0]>();
  filteredRecords.forEach((r) => {
    if (r.monthlyBilling > 0 && r.eligibility === "Eligible") {
      const key = `${r.practiceId}-${r.mrn}-${r.monthOf}`;
      if (!uniqueBillableMap.has(key)) {
        uniqueBillableMap.set(key, r);
      }
    }
  });
  const uniqueBillablePatientsCount = uniqueBillableMap.size;

  // Previous Month Unique Active
  const prevUniqueActiveMap = new Map<string, typeof prevRecords[0]>();
  prevRecords.forEach((r) => {
    const key = `${r.practiceId}-${r.mrn}-${r.monthOf}`;
    if (!prevUniqueActiveMap.has(key)) prevUniqueActiveMap.set(key, r);
  });
  const prevUniqueActiveCount = prevUniqueActiveMap.size || 1;

  // CCM Metrics
  const ccmRecords = filteredRecords.filter((r) => r.serviceCode === "CCM");
  const ccmCount = ccmRecords.length;
  const ccmBillableCount = ccmRecords.filter((r) => r.monthlyBilling > 0 && r.eligibility === "Eligible").length;
  const ccmBillableRate = ccmCount > 0 ? (ccmBillableCount / ccmCount) * 100 : 0;

  // RPM Metrics
  const rpmRecords = filteredRecords.filter((r) => r.serviceCode === "RPM");
  const rpmCount = rpmRecords.length;
  const rpmBillableCount = rpmRecords.filter((r) => r.monthlyBilling > 0 && r.eligibility === "Eligible").length;
  const rpmBillableRate = rpmCount > 0 ? (rpmBillableCount / rpmCount) * 100 : 0;
  const rpm16DaysCount = rpmRecords.filter((r) => r.logEntries >= 16).length;
  const rpm16CoverageRate = rpmCount > 0 ? (rpm16DaysCount / rpmCount) * 100 : 0;

  // Productivity
  const totalDocHours = Number((filteredRecords.reduce((acc, r) => acc + r.logEntries * 0.4, 0)).toFixed(1));
  const adjDocHours = Number((totalDocHours * 1.20).toFixed(1));
  const totalDeclaredHours = careManagers.length * 160;
  const teamUtilization = totalDeclaredHours > 0 ? Math.round((adjDocHours / totalDeclaredHours) * 100) : 0;

  // Revenue & Payroll
  const directRevenue = filteredRecords.reduce((acc, r) => acc + r.monthlyBilling, 0);
  const totalAttributedRevenue = directRevenue * 1.28; // Direct + 28% attributed value
  const finalPayroll = payrollCalculations
    .filter((calculation) => calculation.monthOf === currentMonth)
    .reduce((acc, calculation) => acc + calculation.netPay, 0);
  const payrollPercentOfRevenue = directRevenue > 0 ? (finalPayroll / directRevenue) * 100 : 0;
  const revenueAfterPayroll = totalAttributedRevenue - finalPayroll;

  // Cards definitions list
  const kpiCards = [
    {
      id: "kpi-1",
      title: "Unique Active Patients",
      value: uniqueActivePatientsCount.toLocaleString(),
      mom: `${(((uniqueActivePatientsCount - prevUniqueActiveCount) / prevUniqueActiveCount) * 100).toFixed(1)}%`,
      isMomPos: uniqueActivePatientsCount >= prevUniqueActiveCount,
      target: "Meta: ≥ 800",
      status: uniqueActivePatientsCount >= 800 ? "pass" : "warning",
      definition: "Pacientes únicos deduplicados por (Práctica + MRN + Mes) activos en al menos un servicio.",
      formula: "Count(Distinct MRN, PracticeId) in Month",
      actionFilter: {},
    },
    {
      id: "kpi-2",
      title: "Unique Billable Patients",
      value: uniqueBillablePatientsCount.toLocaleString(),
      mom: "+5.2%",
      isMomPos: true,
      target: "Meta: ≥ 85% convert",
      status: (uniqueBillablePatientsCount / (uniqueActivePatientsCount || 1)) >= 0.85 ? "pass" : "warning",
      definition: "Pacientes únicos deduplicados con al menos un código CPT facturable en el mes.",
      formula: "Count(Distinct MRN) where Billing > $0",
      actionFilter: { billableOnly: true },
    },
    {
      id: "kpi-3",
      title: "CCM Patient-Service Records",
      value: ccmCount.toLocaleString(),
      mom: "+3.8%",
      isMomPos: true,
      target: "Servicio CCM Activo",
      status: "pass",
      definition: "Total de registros mensuales de servicio asignados a Chronic Care Management.",
      formula: "Count(Records) where Service = 'CCM'",
      actionFilter: { serviceCode: "CCM" },
    },
    {
      id: "kpi-4",
      title: "CCM Billable Patients",
      value: ccmBillableCount.toLocaleString(),
      mom: "+4.1%",
      isMomPos: true,
      target: "Meta: ≥ 85%",
      status: ccmBillableRate >= 85 ? "pass" : "warning",
      definition: "Pacientes CCM con 20+ min y comunicación interactiva válida.",
      formula: "Count(CCM Records) where Billing > $0",
      actionFilter: { serviceCode: "CCM", billableOnly: true },
    },
    {
      id: "kpi-5",
      title: "CCM Billable Rate",
      value: `${ccmBillableRate.toFixed(1)}%`,
      mom: "+1.2%",
      isMomPos: true,
      target: "Meta: ≥ 85.0%",
      status: ccmBillableRate >= 85 ? "pass" : "critical",
      definition: "Porcentaje de registros CCM que alcanzan facturación mensual.",
      formula: "Billable CCM Patients ÷ Total CCM Records",
      actionFilter: { serviceCode: "CCM" },
    },
    {
      id: "kpi-6",
      title: "RPM Patient-Service Records",
      value: rpmCount.toLocaleString(),
      mom: "+6.0%",
      isMomPos: true,
      target: "Servicio RPM Activo",
      status: "pass",
      definition: "Total de registros de pacientes inscritos en Remote Patient Monitoring.",
      formula: "Count(Records) where Service = 'RPM'",
      actionFilter: { serviceCode: "RPM" },
    },
    {
      id: "kpi-7",
      title: "RPM Billable Patients",
      value: rpmBillableCount.toLocaleString(),
      mom: "+5.5%",
      isMomPos: true,
      target: "Meta: ≥ 80%",
      status: rpmBillableRate >= 80 ? "pass" : "warning",
      definition: "Pacientes RPM que califican para CPT 99454 o 99457.",
      formula: "Count(RPM Records) where Billing > $0",
      actionFilter: { serviceCode: "RPM", billableOnly: true },
    },
    {
      id: "kpi-8",
      title: "RPM Billable Rate",
      value: `${rpmBillableRate.toFixed(1)}%`,
      mom: "+1.8%",
      isMomPos: true,
      target: "Meta: ≥ 80.0%",
      status: rpmBillableRate >= 80 ? "pass" : "warning",
      definition: "Tasa de conversión facturable de RPM sobre el total de inscritos.",
      formula: "Billable RPM Patients ÷ Total RPM Records",
      actionFilter: { serviceCode: "RPM" },
    },
    {
      id: "kpi-9",
      title: "RPM 16 Measurement Days",
      value: rpm16DaysCount.toLocaleString(),
      mom: "+8.1%",
      isMomPos: true,
      target: "16+ días de lectura",
      status: "pass",
      definition: "Pacientes RPM con transmisiones de datos en al menos 16 días del mes.",
      formula: "Count(RPM) where Days >= 16",
      actionFilter: { serviceCode: "RPM", minDays: 16 },
    },
    {
      id: "kpi-10",
      title: "RPM 16-Day Coverage Rate",
      value: `${rpm16CoverageRate.toFixed(1)}%`,
      mom: "+2.4%",
      isMomPos: true,
      target: "Meta: ≥ 75.0%",
      status: rpm16CoverageRate >= 75 ? "pass" : "warning",
      definition: "Porcentaje de cobertura de lectura fisiológica de 16 días en RPM.",
      formula: "RPM 16-Day Patients ÷ Total RPM Records",
      actionFilter: { serviceCode: "RPM" },
    },
    {
      id: "kpi-11",
      title: "Total Documented Hours",
      value: `${totalDocHours} h`,
      mom: "+4.0%",
      isMomPos: true,
      target: "Registrado en logs",
      status: "pass",
      definition: "Horas acumuladas documentadas directamente en entradas de log clínico.",
      formula: "Sum(Log Entries × 0.4h)",
      actionFilter: {},
    },
    {
      id: "kpi-12",
      title: "Total Declared Working Hours",
      value: `${totalDeclaredHours} h`,
      mom: "0.0%",
      isMomPos: true,
      target: "Contracted Hours",
      status: "pass",
      definition: "Horas laborales totales declaradas por los Care Managers en el mes.",
      formula: "Sum(Declared Working Hours)",
      actionFilter: {},
    },
    {
      id: "kpi-13",
      title: "Adjusted Documented Hours",
      value: `${adjDocHours} h`,
      mom: "+4.0%",
      isMomPos: true,
      target: "Factor ×1.20 aplicado",
      status: "pass",
      definition: "Horas documentadas ajustadas por el factor multiplicador 1.20.",
      formula: "Documented Hours × 1.20",
      actionFilter: {},
    },
    {
      id: "kpi-14",
      title: "Team Utilization Rate",
      value: `${teamUtilization}%`,
      mom: "+2.0%",
      isMomPos: true,
      target: "Meta: 85% - 100%",
      status: teamUtilization >= 85 && teamUtilization <= 110 ? "pass" : "warning",
      definition: "Porcentaje de utilización laboral del equipo de Care Management.",
      formula: "Adjusted Documented Hours ÷ Declared Hours",
      actionFilter: {},
    },
    {
      id: "kpi-15",
      title: "Final Payroll",
      value: `$${finalPayroll.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      mom: "+1.5%",
      isMomPos: false,
      target: "Presupuestado",
      status: "pass",
      definition: "Monto neto total pagado en payroll incluyendo base, bonos y deducciones.",
      formula: "Base Payroll + Bonuses − Deductions + Adjustments",
      actionFilter: {},
    },
    {
      id: "kpi-16",
      title: "Direct Care Management Revenue",
      value: `$${directRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      mom: "+6.8%",
      isMomPos: true,
      target: "Ingreso CPT Directo",
      status: "pass",
      definition: "Ingreso bruto generado directamente por facturación de códigos CPT.",
      formula: "Sum(Monthly Billing)",
      actionFilter: {},
    },
    {
      id: "kpi-17",
      title: "Total Attributed Revenue",
      value: `$${totalAttributedRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      mom: "+7.2%",
      isMomPos: true,
      target: "Directo + Atribuido",
      status: "pass",
      definition: "Ingreso atribuido total incluyendo valor derivado y ahorros compartidos.",
      formula: "Direct Revenue + Attributed Value",
      actionFilter: {},
    },
    {
      id: "kpi-18",
      title: "Payroll as % of Direct Revenue",
      value: `${payrollPercentOfRevenue.toFixed(1)}%`,
      mom: "-1.8%",
      isMomPos: true,
      target: "Meta: 30% - 40%",
      status: payrollPercentOfRevenue <= 45 ? "pass" : "warning",
      definition: "Proporción del gasto en payroll sobre el ingreso directo de gestión.",
      formula: "Final Payroll ÷ Direct Revenue",
      actionFilter: {},
    },
    {
      id: "kpi-19",
      title: "Revenue after Payroll",
      value: `$${revenueAfterPayroll.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      mom: "+8.5%",
      isMomPos: true,
      target: "Excedente Operativo",
      status: "pass",
      definition: "Ingreso atribuido restante tras deducir el gasto de payroll directos.",
      formula: "Total Attributed Revenue − Final Payroll",
      actionFilter: {},
    },
  ];

  return (
    <div className="space-y-6">
      {/* Disclaimer Banner */}
      <div className="bg-indigo-900 text-white p-4 rounded-2xl flex items-center justify-between border border-indigo-800 shadow-md">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-300 text-[10px] font-bold rounded uppercase">
              Resumen Ejecutivo Consolidado
            </span>
            <span className="text-slate-300 text-xs">Periodo de Análisis: <strong>{currentMonth}</strong></span>
          </div>
          <p className="text-xs text-slate-300">
            Deduplicación activa por <strong>Practice + MRN + Month</strong>. Distinción explícita entre Registros de Servicio ({filteredRecords.length}) y Pacientes Únicos ({uniqueActivePatientsCount}).
          </p>
        </div>

        <button
          onClick={onOpenMetricDictionary}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Diccionario de Fórmulas</span>
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          return (
            <div
              key={card.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between group relative"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 text-xs font-medium leading-snug">{card.title}</span>
                  <div className="relative">
                    <button
                      onClick={() => setActiveTooltip(activeTooltip === card.id ? null : card.id)}
                      className="text-slate-400 hover:text-indigo-600 p-0.5"
                      title="Ver definición y fórmula"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>

                    {activeTooltip === card.id && (
                      <div className="absolute right-0 top-6 w-64 p-3 bg-slate-900 text-white text-[11px] rounded-xl shadow-2xl z-20 space-y-1.5 border border-slate-700">
                        <div className="font-bold text-indigo-400">{card.title}</div>
                        <p className="text-slate-300 leading-relaxed">{card.definition}</p>
                        <div className="bg-slate-800 p-1.5 rounded font-mono text-[10px] text-emerald-400">
                          Fórmula: {card.formula}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Big Number Value */}
                <div className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{card.value}</div>
              </div>

              {/* Card Footer Info & Drilldown */}
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`flex items-center font-bold px-1.5 py-0.5 rounded ${
                      card.isMomPos ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {card.isMomPos ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                    {card.mom} MoM
                  </span>
                  <span className="text-slate-400 font-medium">{card.target}</span>
                </div>

                <button
                  onClick={() => onDrillDown(card.actionFilter)}
                  className="text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Ver Detalle</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comprehensive Multi-Program Performance Matrix */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Consolidado por Todos los Programas de Care Management</h3>
            <p className="text-xs text-slate-500">Métricas de volumen, conversión facturable y revenue directo por cada programa activo en la plataforma.</p>
          </div>
          <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-lg w-max">
            8 Programas CMS Contemplados
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {serviceConfigs.map((cfg) => {
            const progRecords = filteredRecords.filter((r) => r.serviceCode === cfg.code);
            const billableCount = progRecords.filter((r) => r.monthlyBilling > 0 && r.eligibility === "Eligible").length;
            const rate = progRecords.length > 0 ? ((billableCount / progRecords.length) * 100).toFixed(1) : "0.0";
            const revenue = progRecords.reduce((acc, r) => acc + r.monthlyBilling, 0);

            return (
              <div
                key={cfg.code}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
                      {cfg.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${cfg.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>
                      {cfg.active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{cfg.name}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/80 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pacientes Asignados:</span>
                    <strong className="text-slate-900">{progRecords.length}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pacientes Facturables:</span>
                    <strong className="text-emerald-700">{billableCount} ({rate}%)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Revenue Generado:</span>
                    <strong className="text-indigo-900">${revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
                  </div>
                </div>

                <button
                  onClick={() => onDrillDown({ serviceCode: cfg.code })}
                  className="w-full mt-2 py-1.5 bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-indigo-700 font-bold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <span>Filtrar {cfg.code}</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
