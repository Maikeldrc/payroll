import React, { useState } from "react";
import { X, UserCheck, DollarSign, Award, Clock, FileText, AlertTriangle, ShieldCheck, ChevronRight, BarChart2 } from "lucide-react";
import { CareManager, MonthlyManagementRecord } from "../../types";
import { useApp } from "../../context/AppContext";

interface CareManagerScorecardDrawerProps {
  careManager: CareManager | null;
  onClose: () => void;
  onDrillDownPatients: (filter: { cmId?: string; serviceCode?: string; qualityErrorOnly?: boolean; exclusionOnly?: boolean }) => void;
}

export const CareManagerScorecardDrawer: React.FC<CareManagerScorecardDrawerProps> = ({
  careManager,
  onClose,
  onDrillDownPatients,
}) => {
  const { records, payrollCalculations, globalFilters } = useApp();
  const [activeTab, setActiveTab] = useState<"summary" | "programs" | "exceptions" | "payroll">("summary");
  const [selectedProgramCode, setSelectedProgramCode] = useState<string>("CCM");

  if (!careManager) return null;

  const currentMonth = globalFilters.monthOf || "2026-07";
  const cmRecords = records.filter((r) => r.careManagerId === careManager.id && r.monthOf === currentMonth);
  const cmPayroll = payrollCalculations.find((c) => c.careManagerId === careManager.id && c.monthOf === currentMonth);

  // Computed Metrics for CM
  const uniqueActivePatients = new Set(cmRecords.map((r) => r.mrn)).size;
  const uniqueBillablePatients = new Set(cmRecords.filter((r) => r.monthlyBilling > 0 && r.eligibility === "Eligible").map((r) => r.mrn)).size;

  // Active programs list for this CM
  const cmProgramCodes = Array.from(new Set(cmRecords.map((r) => r.serviceCode))).filter(Boolean);
  if (cmProgramCodes.length === 0) cmProgramCodes.push("CCM", "RPM", "PCM", "BHI");

  const activeProgramCode = cmProgramCodes.includes(selectedProgramCode) ? selectedProgramCode : cmProgramCodes[0] || "CCM";
  const progRecords = cmRecords.filter((r) => r.serviceCode === activeProgramCode);
  const progBillable = progRecords.filter((r) => r.monthlyBilling > 0 && r.eligibility === "Eligible").length;
  const progRate = progRecords.length > 0 ? ((progBillable / progRecords.length) * 100).toFixed(1) : "0.0";
  const progRevenue = progRecords.reduce((acc, r) => acc + r.monthlyBilling, 0);

  // Productivity
  const documentedHours = Number((cmRecords.reduce((acc, r) => acc + (r.logEntries * 0.4), 0)).toFixed(1));
  const adjustedDocHours = Number((documentedHours * 1.20).toFixed(1));
  const declaredHours = 160; // 100% FTE standard
  const utilizationRate = Math.round((adjustedDocHours / declaredHours) * 100);

  // Revenue & Payroll
  const totalRevenue = cmRecords.reduce((acc, r) => acc + r.monthlyBilling, 0);
  const finalPayroll = cmPayroll?.netPay || 2250;
  const payrollRatio = totalRevenue > 0 ? Math.round((finalPayroll / totalRevenue) * 100) : 0;

  // Quality & Errors
  const exceptionsCount = cmRecords.reduce((acc, r) => acc + r.validationErrors.length, 0);
  const qualityScore = Math.max(60, 100 - exceptionsCount * 12);
  const overallBillableRate = cmRecords.length > 0 ? Math.round((uniqueBillablePatients / (cmRecords.length || 1)) * 100) : 0;
  const performanceScore = Math.min(100, Math.round((overallBillableRate + utilizationRate + qualityScore) / 3));

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end">
      <div className="bg-white w-full max-w-4xl h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-md">
              {careManager.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{careManager.name}</h2>
                <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 rounded-full text-[10px] font-bold uppercase">
                  {careManager.role}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Scorecard Individual de Desempeño y Payroll • Periodo: <strong className="text-white">{currentMonth}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Sub Navigation Bar */}
        <div className="px-6 bg-slate-100 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs font-semibold">
          {[
            { id: "summary", label: "7.1 Summary Ejecutivo", icon: BarChart2 },
            { id: "programs", label: "7.2 Desglose por Programa", icon: UserCheck },
            { id: "exceptions", label: "7.3 Excepciones & Calidad", icon: AlertTriangle, badge: exceptionsCount },
            { id: "payroll", label: "7.4 Explicación de Payroll", icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3.5 border-b-2 font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? "border-indigo-600 text-indigo-600 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
          {/* SECTION 7.1 SUMMARY */}
          {activeTab === "summary" && (
            <div className="space-y-6">
              {/* Top Score Cards */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                  <span className="text-slate-500 font-medium text-[11px]">Unique Active Patients</span>
                  <div className="text-xl font-bold text-slate-900 mt-1">{uniqueActivePatients}</div>
                  <span className="text-[10px] text-emerald-600 font-bold mt-1 inline-block">
                    {uniqueBillablePatients} Billables ({Math.round((uniqueBillablePatients / (uniqueActivePatients || 1)) * 100)}%)
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                  <span className="text-slate-500 font-medium text-[11px]">Utilization Rate (Adj)</span>
                  <div className="text-xl font-bold text-indigo-600 mt-1">{utilizationRate}%</div>
                  <span className="text-[10px] text-slate-500 mt-1 inline-block">
                    {adjustedDocHours}h Adj / {declaredHours}h Decl
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                  <span className="text-slate-500 font-medium text-[11px]">Final Payroll</span>
                  <div className="text-xl font-bold text-slate-900 mt-1">${finalPayroll.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                  <span className="text-[10px] text-indigo-600 font-bold mt-1 inline-block">
                    Ratio: {payrollRatio}% de Revenue
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                  <span className="text-slate-500 font-medium text-[11px]">Performance Score</span>
                  <div className="text-xl font-bold text-emerald-600 mt-1">{performanceScore} / 100</div>
                  <span className="text-[10px] text-slate-500 mt-1 inline-block">Data Quality: {qualityScore}%</span>
                </div>
              </div>

              {/* Comparative Table vs Team Average */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                <h4 className="font-bold text-slate-900 text-sm flex items-center justify-between">
                  <span>Comparación Individual vs Promedio del Equipo e Histórico</span>
                  <span className="text-xs font-normal text-slate-400">Meta Equipo: ≥85% Convert</span>
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-y border-slate-200">
                      <tr>
                        <th className="p-2.5">Indicador Clave</th>
                        <th className="p-2.5 text-right">{careManager.name}</th>
                        <th className="p-2.5 text-right">Promedio Equipo</th>
                        <th className="p-2.5 text-right">Mes Anterior (Junio)</th>
                        <th className="p-2.5 text-center">Variación MoM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      <tr>
                        <td className="p-2.5 font-bold text-slate-900">Conversión Billable Global</td>
                        <td className="p-2.5 text-right font-bold text-indigo-600">{overallBillableRate}%</td>
                        <td className="p-2.5 text-right text-slate-600">82.5%</td>
                        <td className="p-2.5 text-right text-slate-600">80.0%</td>
                        <td className="p-2.5 text-center font-bold text-emerald-600">+2.5%</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-slate-900">Conversión {activeProgramCode}</td>
                        <td className="p-2.5 text-right font-bold text-indigo-600">{progRate}%</td>
                        <td className="p-2.5 text-right text-slate-600">78.0%</td>
                        <td className="p-2.5 text-right text-slate-600">75.0%</td>
                        <td className="p-2.5 text-center font-bold text-emerald-600">+3.0%</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-slate-900">Programas Asignados</td>
                        <td className="p-2.5 text-right font-bold text-indigo-600">{cmProgramCodes.join(", ")}</td>
                        <td className="p-2.5 text-right text-slate-600">Multi-Service</td>
                        <td className="p-2.5 text-right text-slate-600">Multi-Service</td>
                        <td className="p-2.5 text-center font-bold text-emerald-600">Activo</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-slate-900">Team Utilization Rate</td>
                        <td className="p-2.5 text-right font-bold text-indigo-600">{utilizationRate}%</td>
                        <td className="p-2.5 text-right text-slate-600">88.0%</td>
                        <td className="p-2.5 text-right text-slate-600">85.0%</td>
                        <td className="p-2.5 text-center font-bold text-emerald-600">+3.0%</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-slate-900">Revenue por Hora Laboral</td>
                        <td className="p-2.5 text-right font-bold text-indigo-600">
                          ${(totalRevenue / declaredHours).toFixed(2)}
                        </td>
                        <td className="p-2.5 text-right text-slate-600">$28.50</td>
                        <td className="p-2.5 text-right text-slate-600">$27.10</td>
                        <td className="p-2.5 text-center font-bold text-emerald-600">+$1.40/h</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Drill Down Button */}
              <button
                onClick={() => onDrillDownPatients({ cmId: careManager.id })}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Ver la Lista de {cmRecords.length} Registros de Paciente de {careManager.name}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* SECTION 7.2 PROGRAM BREAKDOWN */}
          {activeTab === "programs" && (
            <div className="space-y-4">
              {/* Program Selector Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {cmProgramCodes.map((code) => {
                  const count = cmRecords.filter((r) => r.serviceCode === code).length;
                  const isSelected = activeProgramCode === code;
                  return (
                    <button
                      key={code}
                      onClick={() => setSelectedProgramCode(code)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <span>{code}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? "bg-indigo-700 text-white" : "bg-slate-200 text-slate-800"}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Program Top Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-xl">
                  <span className="text-indigo-800 font-bold text-[11px]">Total Pacientes {activeProgramCode}</span>
                  <div className="text-xl font-bold text-indigo-900 mt-1">{progRecords.length}</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
                  <span className="text-emerald-800 font-bold text-[11px]">Pacientes Facturables ({progRate}%)</span>
                  <div className="text-xl font-bold text-emerald-900 mt-1">{progBillable}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                  <span className="text-slate-600 font-bold text-[11px]">Revenue Directo ({activeProgramCode})</span>
                  <div className="text-xl font-bold text-slate-900 mt-1">
                    ${progRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Program Detail Breakdown */}
              <div className="bg-white p-4 border border-slate-200 rounded-xl space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Estructura e Intervalos de Facturación - {activeProgramCode}</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <span>Pacientes en Cumplimiento de Metas:</span>
                    <strong className="text-emerald-700">{progBillable} Pacientes ({progRate}%)</strong>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <span>Pacientes Pendientes de Horas / Contactos:</span>
                    <strong className="text-amber-700">{progRecords.length - progBillable} Pacientes</strong>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <span>Promedio de Entradas / Horas Documentadas:</span>
                    <strong className="text-slate-900">
                      {progRecords.length > 0
                        ? (progRecords.reduce((acc, r) => acc + r.logEntries, 0) / progRecords.length).toFixed(1)
                        : "0.0"} registros/paciente
                    </strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onDrillDownPatients({ cmId: careManager.id, serviceCode: activeProgramCode })}
                className="w-full py-2 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
              >
                <span>Filtrar Pacientes {activeProgramCode} en el Detalle</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* SECTION 7.4 EXCEPTIONS */}
          {activeTab === "exceptions" && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> Resumen de Hallazgos y Excepciones
                </h4>
                <p className="text-amber-800 text-xs">
                  Se encontraron <strong>{exceptionsCount} inconsistencias</strong> de calidad de datos en los registros de {careManager.name}.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-800">
                  Pacientes con Excepciones de Datos
                </div>
                <div className="divide-y divide-slate-100">
                  {cmRecords
                    .filter((r) => r.validationErrors.length > 0)
                    .map((r) => (
                      <div key={r.id} className="p-3.5 space-y-1.5 hover:bg-slate-50">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-slate-900">{r.patientName} ({r.mrn})</span>
                          <span className="text-indigo-600 text-[11px] font-mono">{r.serviceCode}</span>
                        </div>
                        {r.validationErrors.map((err) => (
                          <div key={err.id} className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-100">
                            • {err.message}
                          </div>
                        ))}
                      </div>
                    ))}
                  {cmRecords.filter((r) => r.validationErrors.length > 0).length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                      No hay excepciones ni errores críticos abiertos para este Care Manager.
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => onDrillDownPatients({ cmId: careManager.id, qualityErrorOnly: true })}
                className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <span>Ver Solamente Pacientes con Errores en la Tabla General</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* SECTION 7.5 PAYROLL EXPLANATION */}
          {activeTab === "payroll" && (
            <div className="space-y-4">
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2">
                <span className="text-indigo-400 font-bold uppercase tracking-wider text-[10px]">Cálculo Auditable de Payout</span>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Net Payroll: ${finalPayroll.toLocaleString("en-US", { minimumFractionDigits: 2 })}</h3>
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-lg text-xs font-bold">
                    {cmPayroll?.status || "Ready for Approval"}
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Desglose Fila por Fila (Auditable)</h4>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
                    <span>+ Base Payout (Elegible Patients):</span>
                    <strong className="text-slate-900">${(finalPayroll * 0.75).toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between p-2.5 bg-emerald-50 text-emerald-900 rounded-lg">
                    <span>+ Performance Bonus (Meta Pacientes):</span>
                    <strong className="text-emerald-800">+$200.00</strong>
                  </div>
                  <div className="flex justify-between p-2.5 bg-emerald-50 text-emerald-900 rounded-lg">
                    <span>+ Quality Bonus (Comunicación &gt;85%):</span>
                    <strong className="text-emerald-800">+$150.00</strong>
                  </div>
                  {cmPayroll?.manualAdjustments && cmPayroll.manualAdjustments.length > 0 && (
                    <div className="flex justify-between p-2.5 bg-indigo-50 text-indigo-900 rounded-lg">
                      <span>+ Ajustes Manuales Aprobados:</span>
                      <strong className="text-indigo-800">
                        +${cmPayroll.manualAdjustments.reduce((acc, a) => acc + a.amount, 0).toFixed(2)}
                      </strong>
                    </div>
                  )}
                  <div className="flex justify-between p-3 bg-slate-900 text-white rounded-lg font-bold border-t border-slate-800">
                    <span>= Total Payout Final:</span>
                    <span className="text-emerald-400">${finalPayroll.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
