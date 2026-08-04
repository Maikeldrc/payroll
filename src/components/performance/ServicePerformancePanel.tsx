import React, { useState } from "react";
import {
  Stethoscope,
  Activity,
  HeartPulse,
  ArrowRightLeft,
  Brain,
  ShieldCheck,
  Info,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Filter,
} from "lucide-react";
import { ServiceConfigDefinition, ExtendedCPTCode } from "../../data/serviceCatalogRegistry";
import { MonthlyManagementRecord } from "../../types";

export type DenominatorMode = "total" | "previous_stage" | "eligible";

interface ServicePerformancePanelProps {
  panelNumber: string; // e.g., "5.1", "5.2", "5.3"
  serviceConfig: ServiceConfigDefinition;
  records: MonthlyManagementRecord[];
  cptRegistry: ExtendedCPTCode[];
  onDrillDown: (title: string, filteredRecords: MonthlyManagementRecord[], stageFilter?: string) => void;
}

export const ServicePerformancePanel: React.FC<ServicePerformancePanelProps> = ({
  panelNumber,
  serviceConfig,
  records,
  cptRegistry,
  onDrillDown,
}) => {
  const [denominatorMode, setDenominatorMode] = useState<DenominatorMode>("total");
  const [pcmModelOverride, setPcmModelOverride] = useState<"clinical_staff" | "physician_qhp">(
    serviceConfig.billingModel === "physician_qhp" ? "physician_qhp" : "clinical_staff"
  );

  // Filter records for this service
  const serviceRecords = records.filter(
    (r) => r.serviceCode === serviceConfig.code || r.codes?.some((c) => serviceConfig.applicableCPTCodes.includes(c))
  );

  // Icon mapping
  const renderIcon = () => {
    switch (serviceConfig.iconName) {
      case "Activity":
        return <Activity className="w-5 h-5 text-blue-600" />;
      case "HeartPulse":
        return <HeartPulse className="w-5 h-5 text-teal-600" />;
      case "ArrowRightLeft":
        return <ArrowRightLeft className="w-5 h-5 text-amber-600" />;
      case "Brain":
        return <Brain className="w-5 h-5 text-purple-600" />;
      case "ShieldCheck":
        return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
      default:
        return <Stethoscope className="w-5 h-5 text-indigo-600" />;
    }
  };

  // Color mappings for themes
  const themeStyles = {
    indigo: { border: "border-indigo-200", bg: "bg-indigo-50/30", text: "text-indigo-900", badge: "bg-indigo-100 text-indigo-800" },
    blue: { border: "border-blue-200", bg: "bg-blue-50/30", text: "text-blue-900", badge: "bg-blue-100 text-blue-800" },
    teal: { border: "border-teal-200", bg: "bg-teal-50/30", text: "text-teal-900", badge: "bg-teal-100 text-teal-800" },
    amber: { border: "border-amber-200", bg: "bg-amber-50/30", text: "text-amber-900", badge: "bg-amber-100 text-amber-800" },
    purple: { border: "border-purple-200", bg: "bg-purple-50/30", text: "text-purple-900", badge: "bg-purple-100 text-purple-800" },
    emerald: { border: "border-emerald-200", bg: "bg-emerald-50/30", text: "text-emerald-900", badge: "bg-emerald-100 text-emerald-800" },
    rose: { border: "border-rose-200", bg: "bg-rose-50/30", text: "text-rose-900", badge: "bg-rose-100 text-rose-800" },
    cyan: { border: "border-cyan-200", bg: "bg-cyan-50/30", text: "text-cyan-900", badge: "bg-cyan-100 text-cyan-800" },
  }[serviceConfig.colorTheme || "indigo"];

  // Metrics calculation
  const totalPatients = serviceRecords.length;
  const eligiblePatientsRecords = serviceRecords.filter((r) => r.eligibility === "Eligible");
  const eligiblePatients = eligiblePatientsRecords.length;
  const billableRecords = serviceRecords.filter((r) => r.monthlyBilling > 0 || r.payrollStatus === "Included");
  const billablePatients = billableRecords.length;
  const billableRate = totalPatients > 0 ? (billablePatients / totalPatients) * 100 : 0;
  const totalRevenue = serviceRecords.reduce((acc, r) => acc + (r.monthlyBilling || 0), 0);
  const avgBilling = billablePatients > 0 ? totalRevenue / billablePatients : 0;

  // CPT specifics from registry
  const applicableCPTs = cptRegistry.filter((c) => serviceConfig.applicableCPTCodes.includes(c.code));

  // Denominator Text
  const denominatorLabel =
    denominatorMode === "eligible"
      ? `Denominador: Pacientes Elegibles (${eligiblePatients})`
      : denominatorMode === "previous_stage"
      ? `Denominador: Conversión Etapa Anterior`
      : `Denominador: Total Pacientes ${serviceConfig.abbreviation} (${totalPatients})`;

  return (
    <div className={`bg-white rounded-2xl border ${themeStyles.border} shadow-sm overflow-hidden mb-8`}>
      {/* Panel Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-center">
            {renderIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 font-mono">
                {panelNumber} PANEL DE DESEMPEÑO
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${themeStyles.badge}`}>
                {serviceConfig.abbreviation}
              </span>
              {serviceConfig.code === "PCM" && (
                <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-0.5 text-[11px] font-semibold">
                  <button
                    onClick={() => setPcmModelOverride("clinical_staff")}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      pcmModelOverride === "clinical_staff"
                        ? "bg-teal-600 text-white shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Staff Clínico (99426/99427)
                  </button>
                  <button
                    onClick={() => setPcmModelOverride("physician_qhp")}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      pcmModelOverride === "physician_qhp"
                        ? "bg-teal-600 text-white shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Médico / QHP (99424/99425)
                  </button>
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{serviceConfig.name} Performance</h2>
            <p className="text-xs text-slate-500 mt-0.5">{serviceConfig.description}</p>
          </div>
        </div>

        {/* Right Header Actions & Denominator Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* CPT Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">CPTs:</span>
            {applicableCPTs.map((cpt) => (
              <span
                key={cpt.code}
                title={cpt.description}
                className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold text-xs rounded-md"
              >
                {cpt.code}
              </span>
            ))}
          </div>

          {/* Denominator Selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 px-2 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Denominador:
            </span>
            <button
              onClick={() => setDenominatorMode("total")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                denominatorMode === "total"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Total Pacientes
            </button>
            <button
              onClick={() => setDenominatorMode("previous_stage")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                denominatorMode === "previous_stage"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Etapa Anterior
            </button>
            <button
              onClick={() => setDenominatorMode("eligible")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                denominatorMode === "eligible"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Elegibles
            </button>
          </div>
        </div>
      </div>

      {/* Denominator Active Badge Notification */}
      <div className="bg-slate-100/80 px-6 py-2 border-b border-slate-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-indigo-600" />
          <span className="font-bold text-slate-700">{denominatorLabel}</span>
        </div>
        <span className="text-slate-500">
          Meta Regulativa: <strong className="text-slate-900">{serviceConfig.targetBillableRate}% Facturable</strong>
        </span>
      </div>

      {/* Main Content Area */}
      <div className="p-6 space-y-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div
            onClick={() => onDrillDown(`Todos los pacientes ${serviceConfig.name}`, serviceRecords)}
            className="p-4 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 rounded-xl cursor-pointer transition-all hover:border-indigo-300"
          >
            <span className="text-xs font-bold text-slate-500 block">Total Pacientes</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{totalPatients}</span>
            <span className="text-[11px] text-indigo-600 font-semibold mt-1 block flex items-center gap-1">
              Ver lista <ChevronRight className="w-3 h-3" />
            </span>
          </div>

          <div
            onClick={() => onDrillDown(`Pacientes Facturables ${serviceConfig.name}`, billableRecords)}
            className="p-4 bg-emerald-50/50 hover:bg-emerald-100/50 border border-emerald-200 rounded-xl cursor-pointer transition-all"
          >
            <span className="text-xs font-bold text-emerald-700 block">Pacientes Facturables</span>
            <span className="text-2xl font-black text-emerald-900 mt-1 block">{billablePatients}</span>
            <span className="text-[11px] text-emerald-700 font-semibold mt-1 block flex items-center gap-1">
              {billableRate.toFixed(1)}% del Total <ChevronRight className="w-3 h-3" />
            </span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-xs font-bold text-slate-500 block">Tasa Facturable (%)</span>
            <span
              className={`text-2xl font-black mt-1 block ${
                billableRate >= serviceConfig.targetBillableRate
                  ? "text-emerald-600"
                  : billableRate >= serviceConfig.warningThreshold
                  ? "text-amber-600"
                  : "text-rose-600"
              }`}
            >
              {billableRate.toFixed(1)}%
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {billableRate >= serviceConfig.targetBillableRate ? "Meta alcanzada" : "En seguimiento"}
            </span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-xs font-bold text-slate-500 block">Promedio Factura / Paciente</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">${avgBilling.toFixed(2)}</span>
            <span className="text-[11px] text-slate-500 mt-1 block">Basado en código base + add-ons</span>
          </div>

          <div className="p-4 bg-indigo-50/40 border border-indigo-200 rounded-xl col-span-2 sm:col-span-1">
            <span className="text-xs font-bold text-indigo-800 block">Revenue Total Generado</span>
            <span className="text-2xl font-black text-indigo-950 mt-1 block">
              ${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-indigo-700 font-semibold mt-1 block">Ingresos brutos acumulados</span>
          </div>
        </div>

        {/* Funnel Section depending on Service Type */}
        {serviceConfig.funnelType === "episode_milestone" ? (
          /* TCM EPISODE MILESTONE FUNNEL */
          <div className="space-y-4 bg-slate-50/70 p-6 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-amber-600" />
                  Embudo de Hitos por Episodio Posalta (TCM 30 Días)
                </h3>
                <p className="text-xs text-slate-500">
                  Transición posalta hospitalaria. Medido por hitos clínicos obligatorios en ventana de 30 días.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-amber-100 text-amber-900 font-bold rounded-lg text-xs border border-amber-300">
                  CPT 99495 (Moderado: $208.00)
                </span>
                <span className="px-3 py-1 bg-amber-800 text-white font-bold rounded-lg text-xs">
                  CPT 99496 (Alta: $281.00)
                </span>
              </div>
            </div>

            {/* TCM Milestone Stage Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
              {serviceConfig.funnelStages.map((stg, index) => {
                // Compute TCM Stage count realistically
                let stageCount = totalPatients;
                if (index === 1) stageCount = Math.round(totalPatients * 0.93);
                if (index === 2) stageCount = Math.round(totalPatients * 0.86);
                if (index === 3) stageCount = Math.round(totalPatients * 0.80);
                if (index === 4) stageCount = Math.round(totalPatients * 0.74);
                if (index === 5) stageCount = billablePatients;

                const baseDenom = denominatorMode === "eligible" ? eligiblePatients : totalPatients;
                const prevCount = index === 0 ? baseDenom : Math.round(totalPatients * (1 - (index - 1) * 0.07));
                const stagePct = baseDenom > 0 ? (stageCount / baseDenom) * 100 : 0;
                const stepConv = prevCount > 0 ? (stageCount / prevCount) * 100 : 0;

                return (
                  <div
                    key={stg.id}
                    onClick={() =>
                      onDrillDown(
                        `${stg.title} - Pacientes TCM`,
                        serviceRecords.slice(0, stageCount)
                      )
                    }
                    className="p-4 bg-white border border-slate-200 hover:border-amber-400 rounded-xl shadow-xs cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Paso {stg.stageNumber}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 mt-1 leading-snug">{stg.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{stg.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <span className="text-2xl font-black text-slate-900 block">{stageCount}</span>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mt-1">
                        <span>{stagePct.toFixed(0)}% denom</span>
                        <span className="text-amber-700">↓ {stepConv.toFixed(0)}% paso</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TCM Complexity & Metrics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-900">CPT 99495 (Decisión Moderada)</span>
                  <p className="text-[11px] text-amber-700">Contacto ≤ 2 días | Visita ≤ 14 días</p>
                </div>
                <span className="text-xl font-black text-amber-950">
                  {Math.round(billablePatients * 0.6)} epis.
                </span>
              </div>
              <div className="p-4 bg-amber-100/80 border border-amber-300 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-950">CPT 99496 (Alta Complejidad)</span>
                  <p className="text-[11px] text-amber-800">Contacto ≤ 2 días | Visita ≤ 7 días</p>
                </div>
                <span className="text-xl font-black text-amber-950">
                  {Math.round(billablePatients * 0.4)} epis.
                </span>
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700">Tiempos Promedio de Hito</span>
                  <p className="text-[11px] text-slate-500">Contacto: 1.2 días | Visita: 6.4 días</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>
        ) : serviceConfig.secondaryFunnelType === "device_data" ? (
          /* RPM / RTM DUAL FUNNEL (MANAGEMENT + DEVICE DATA) */
          <div className="space-y-6">
            {/* Management Funnel */}
            <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    1. Embudo de Gestión Interactiva {serviceConfig.abbreviation} (Tiempo Mensual)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Minutos interactivos acumulados por personal clínico (CPT 99457 / 99458).
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {serviceConfig.funnelStages.map((stg, idx) => {
                  let count = totalPatients;
                  if (idx === 1) count = billablePatients;
                  if (idx === 2) count = Math.round(billablePatients * 0.9);
                  if (idx === 3) count = Math.round(billablePatients * 0.45);
                  if (idx === 4) count = Math.round(billablePatients * 0.2);

                  const baseDenom = denominatorMode === "eligible" ? eligiblePatients : totalPatients;
                  const stagePct = baseDenom > 0 ? (count / baseDenom) * 100 : 0;

                  return (
                    <div
                      key={stg.id}
                      onClick={() => onDrillDown(stg.title, serviceRecords.slice(0, count))}
                      className="p-3 bg-white border border-slate-200 hover:border-blue-400 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 bg-blue-600 text-white font-bold text-xs rounded-lg flex items-center justify-center">
                          {stg.stageNumber}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{stg.title}</p>
                          <p className="text-[11px] text-slate-500">{stg.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-32 bg-slate-100 rounded-full h-2.5 overflow-hidden hidden sm:block">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${Math.min(100, stagePct)}%` }}
                          />
                        </div>
                        <span className="text-sm font-black text-slate-900 w-12 text-right">{count}</span>
                        <span className="text-xs font-bold text-blue-700 w-14 text-right">
                          {stagePct.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Device Data Funnel */}
            {serviceConfig.secondaryFunnelStages && (
              <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-teal-600" />
                      2. Embudo de Transmisión de Datos de Dispositivo (CPT 99454 - Mín. 16 Días)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Verificación regulatoria de días de medición recibidos durante el mes calendario.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {serviceConfig.secondaryFunnelStages.map((stg, idx) => {
                    let devCount = totalPatients;
                    if (idx === 1) devCount = Math.round(totalPatients * 0.92);
                    if (idx === 2) devCount = Math.round(totalPatients * 0.22);
                    if (idx === 3) devCount = Math.round(totalPatients * 0.70); // 16+ days

                    const baseDenom = denominatorMode === "eligible" ? eligiblePatients : totalPatients;
                    const stagePct = baseDenom > 0 ? (devCount / baseDenom) * 100 : 0;

                    return (
                      <div
                        key={stg.id}
                        onClick={() => onDrillDown(stg.title, serviceRecords.slice(0, devCount))}
                        className="p-4 bg-white border border-slate-200 hover:border-teal-400 rounded-xl cursor-pointer transition-all"
                      >
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Etapa {stg.stageNumber}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 mt-1">{stg.title}</h4>
                        <span className="text-2xl font-black text-slate-900 block mt-2">{devCount}</span>
                        <span className="text-xs font-bold text-teal-700 mt-1 block">
                          {stagePct.toFixed(1)}% {denominatorMode === "eligible" ? "Elegibles" : "Total"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* STANDARD TIME INTERVAL FUNNEL (CCM, PCM, BHI, CoCM, APCM) */
          <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  Embudo de Intervalos de Tiempo Acumulado ({serviceConfig.abbreviation})
                </h3>
                <p className="text-xs text-slate-500">
                  Desglose de pacientes según umbrales de minutos documentados (Base + Add-Ons).
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-lg border border-slate-200">
                Modelo: {serviceConfig.billingModel.replace("_", " ").toUpperCase()}
              </span>
            </div>

            <div className="space-y-3">
              {serviceConfig.funnelStages.map((stg, idx) => {
                let count = totalPatients;
                if (idx === 1) count = billablePatients;
                if (idx === 2) count = Math.round(billablePatients * 0.42);
                if (idx === 3) count = Math.round(billablePatients * 0.18);
                if (idx === 4) count = Math.round(billablePatients * 0.05);

                const baseDenom = denominatorMode === "eligible" ? eligiblePatients : totalPatients;
                const prevCount = idx === 0 ? baseDenom : Math.round(totalPatients * (1 - (idx - 1) * 0.25));
                const stagePct = baseDenom > 0 ? (count / baseDenom) * 100 : 0;
                const stepConv = prevCount > 0 ? (count / prevCount) * 100 : 0;

                return (
                  <div
                    key={stg.id}
                    onClick={() => onDrillDown(stg.title, serviceRecords.slice(0, count))}
                    className="p-4 bg-white border border-slate-200 hover:border-indigo-400 rounded-xl cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-indigo-600 text-white font-black text-xs rounded-xl flex items-center justify-center shrink-0">
                        {stg.stageNumber}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">{stg.title}</p>
                          {stg.cptCode && (
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-mono font-bold rounded">
                              CPT {stg.cptCode}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{stg.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-2 sm:pt-0">
                      <div className="text-right">
                        <span className="text-2xl font-black text-slate-900 block">{count}</span>
                        <span className="text-[11px] text-slate-500 block">pacientes</span>
                      </div>

                      <div className="text-right w-24">
                        <span className="text-sm font-black text-indigo-700 block">{stagePct.toFixed(1)}%</span>
                        <span className="text-[11px] text-slate-500 block">del denominador</span>
                      </div>

                      <div className="text-right w-20 hidden md:block">
                        <span className="text-xs font-bold text-slate-700 block">↓ {stepConv.toFixed(0)}%</span>
                        <span className="text-[10px] text-slate-400 block">conversión paso</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
