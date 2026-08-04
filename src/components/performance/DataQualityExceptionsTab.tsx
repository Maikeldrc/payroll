import React, { useState } from "react";
import { AlertTriangle, ShieldCheck, CheckCircle2, Filter, Search, Edit2, Lock, ArrowRight, ShieldAlert } from "lucide-react";
import { useApp } from "../../context/AppContext";

export const DataQualityExceptionsTab: React.FC<{ onDrillDownPatient: (mrn: string) => void }> = ({ onDrillDownPatient }) => {
  const { records, addAuditLog, globalFilters } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [exceptionModalRecord, setExceptionModalRecord] = useState<any | null>(null);
  const [exceptionReason, setExceptionReason] = useState<string>("");

  const currentMonth = globalFilters.monthOf || "2026-07";

  // Filter records with errors or manual review flags
  const errorRecords = records.filter((r) => r.monthOf === currentMonth && r.validationErrors.length > 0);

  // Group error counts
  const countNoComm = errorRecords.filter((r) => r.validationErrors.some((e) => e.message.toLowerCase().includes("comunicación") || e.field === "latestInteractiveCommunication")).length;
  const countLowRPMDays = errorRecords.filter((r) => r.validationErrors.some((e) => e.message.toLowerCase().includes("días") || e.field === "logEntries")).length;
  const countNoBilling = errorRecords.filter((r) => r.validationErrors.some((e) => e.message.toLowerCase().includes("cpt") || e.field === "codes")).length;
  const countDuplicates = errorRecords.filter((r) => r.isDuplicate || r.validationErrors.some((e) => e.message.toLowerCase().includes("duplicado"))).length;

  const totalRevenueAtRisk = errorRecords.length * 115.0; // ~$115 avg claim at risk

  const handleApplyManualOverride = () => {
    if (!exceptionModalRecord || !exceptionReason.trim()) return;

    addAuditLog(
      "Quality Exception Approved",
      "MonthlyManagementRecord",
      exceptionModalRecord.id,
      `Excepción manual de calidad aprobada para paciente MRN ${exceptionModalRecord.mrn}. Justificación: "${exceptionReason.trim()}".`
    );

    setExceptionModalRecord(null);
    setExceptionReason("");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Revenue Impact Warning */}
      <div className="bg-rose-900 text-white p-5 rounded-2xl border border-rose-800 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-rose-500/30 text-rose-200 font-bold text-[11px] rounded uppercase tracking-wider border border-rose-400/30">
              Centro de Gobernanza & Excepciones de Datos
            </span>
            <span className="text-rose-200 text-xs font-mono">Mes: {currentMonth}</span>
          </div>
          <h3 className="text-xl font-bold text-white">
            {errorRecords.length} Inconsistencias Críticas Abiertas • ${totalRevenueAtRisk.toLocaleString()} en Riesgo
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 bg-amber-500/30 text-amber-200 font-bold rounded-xl border border-amber-400/30">
            Payroll Bloqueado Hasta Resolver Conflictos
          </span>
        </div>
      </div>

      {/* Error Category Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <button
          onClick={() => setSelectedCategory("ALL")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedCategory === "ALL"
              ? "bg-slate-900 text-white border-slate-900 shadow-sm"
              : "bg-white text-slate-800 border-slate-200 hover:border-slate-300"
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-400">Todas las Categorías</span>
          <div className="text-xl font-bold mt-1">{errorRecords.length} Casos</div>
        </button>

        <button
          onClick={() => setSelectedCategory("COMM")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedCategory === "COMM"
              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
              : "bg-white text-slate-800 border-slate-200 hover:border-indigo-300"
          }`}
        >
          <span className="text-[11px] font-semibold text-indigo-700">Sin Comunicación Interactiva</span>
          <div className="text-xl font-bold mt-1">{countNoComm} Casos</div>
        </button>

        <button
          onClick={() => setSelectedCategory("RPM")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedCategory === "RPM"
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "bg-white text-slate-800 border-slate-200 hover:border-blue-300"
          }`}
        >
          <span className="text-[11px] font-semibold text-blue-700">RPM &lt;16 Días de Lectura</span>
          <div className="text-xl font-bold mt-1">{countLowRPMDays} Casos</div>
        </button>

        <button
          onClick={() => setSelectedCategory("DUP")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedCategory === "DUP"
              ? "bg-amber-600 text-white border-amber-600 shadow-sm"
              : "bg-white text-slate-800 border-slate-200 hover:border-amber-300"
          }`}
        >
          <span className="text-[11px] font-semibold text-amber-700">Duplicados o Sin CPT</span>
          <div className="text-xl font-bold mt-1">{countNoBilling + countDuplicates} Casos</div>
        </button>
      </div>

      {/* Exception Audit Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800 flex items-center justify-between">
          <span>Detalle de Registros con Errores de Calidad ({errorRecords.length} Casos)</span>
          <span className="text-slate-500 font-normal">Requieren resolución o aprobación de excepción manual</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-semibold uppercase text-[10px]">
              <tr>
                <th className="p-3">Paciente / MRN</th>
                <th className="p-3">Servicio</th>
                <th className="p-3">Care Manager</th>
                <th className="p-3">Práctica</th>
                <th className="p-3">Inconsistencia Detectada</th>
                <th className="p-3 text-right">Revenue en Riesgo</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium">
              {errorRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-slate-900">
                    <div>{r.patientName}</div>
                    <span className="text-[10px] text-slate-400 font-mono">MRN: {r.mrn}</span>
                  </td>
                  <td className="p-3 font-bold text-indigo-600 font-mono">{r.serviceCode}</td>
                  <td className="p-3 text-slate-700">{r.careManagerName}</td>
                  <td className="p-3 text-slate-500">{r.practiceId}</td>

                  <td className="p-3 space-y-1">
                    {r.validationErrors.map((err) => (
                      <div key={err.id} className="text-[11px] text-rose-700 bg-rose-50 p-1.5 rounded border border-rose-100">
                        • {err.message}
                      </div>
                    ))}
                  </td>

                  <td className="p-3 text-right font-mono font-bold text-rose-600">
                    ${r.monthlyBilling > 0 ? r.monthlyBilling.toFixed(2) : "115.00"}
                  </td>

                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onDrillDownPatient(r.mrn)}
                        className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-[10px]"
                      >
                        Corregir
                      </button>
                      <button
                        onClick={() => setExceptionModalRecord(r)}
                        className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded font-bold text-[10px]"
                      >
                        Excepción
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Exception Modal */}
      {exceptionModalRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h4 className="font-bold text-slate-900 text-base">
              Aprobar Excepción Manual — {exceptionModalRecord.patientName}
            </h4>
            <p className="text-xs text-slate-500">
              Al aprobar esta excepción, el error de calidad se marcará como auditado y no bloqueará el cálculo ni la aprobación de payroll.
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="text-slate-400 font-semibold">Error a omitir:</span>
              <p className="font-bold text-rose-700">{exceptionModalRecord.validationErrors[0]?.message}</p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">Justificación Clínica / Administrativa:</label>
              <textarea
                rows={3}
                placeholder="Escriba la razón auditada para dispensar este error..."
                value={exceptionReason}
                onChange={(e) => setExceptionReason(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setExceptionModalRecord(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyManualOverride}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs shadow-md"
              >
                Aprobar Excepción Auditada
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
