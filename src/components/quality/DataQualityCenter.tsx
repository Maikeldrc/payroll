import React, { useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit,
  Check,
  RefreshCw,
  Search,
  UserPlus,
  HelpCircle,
  FileSpreadsheet,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { MonthlyManagementRecord } from "../../types";

export const DataQualityCenter: React.FC<{ onOpenPatient: (record: any) => void }> = ({
  onOpenPatient,
}) => {
  const demoMode = import.meta.env.VITE_DEMO_MODE === "true";
  const {
    records,
    resolveValidationError,
    toggleRecordPayrollStatus,
    careManagers,
    addAliasToCareManager,
    providers,
    addAliasToProvider,
    globalFilters,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"errors" | "duplicates" | "aliases">("errors");
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [aliasInput, setAliasInput] = useState("");
  const [selectedCmId, setSelectedCmId] = useState(careManagers[0]?.id || "");

  const currentMonth = globalFilters.monthOf || "2026-07";

  // Filter records with errors
  const recordsWithErrors = records.filter((r) => r.validationErrors.length > 0);
  const totalCriticals = records.reduce(
    (acc, r) => acc + r.validationErrors.filter((e) => e.severity === "Critical Error" && !e.resolved).length,
    0
  );
  const totalWarnings = records.reduce(
    (acc, r) => acc + r.validationErrors.filter((e) => e.severity === "Warning" && !e.resolved).length,
    0
  );

  // Duplicates
  const duplicateRecords = records.filter((r) => r.isDuplicate);

  const handleResolve = (recordId: string, errorId: string) => {
    resolveValidationError(recordId, errorId, "Resuelto manualmente por auditor en Centro de Calidad");
  };

  const handleAddCmAlias = () => {
    if (!aliasInput.trim() || !selectedCmId) return;
    addAliasToCareManager(selectedCmId, aliasInput.trim());
    setAliasInput("");
    alert(`Alias '${aliasInput.trim()}' vinculado exitosamente.`);
  };

  return (
    <div className="space-y-6 pb-12 text-xs text-slate-700">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold uppercase tracking-wider">
            Auditoría & Control de Calidad
          </span>
          <h1 className="text-xl font-black text-slate-900 mt-1">Centro de Calidad de Datos & Limpieza</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Detección proactiva de 25+ inconsistencias, duplicados, discrepancias de facturación y mapeo de alias ortográficos.
          </p>
        </div>

        <div className="bg-slate-100 p-1 rounded-xl flex items-center font-semibold">
          <button
            onClick={() => setActiveTab("errors")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "errors" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Alertas & Inconsistencias ({recordsWithErrors.length})
          </button>
          <button
            onClick={() => setActiveTab("duplicates")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "duplicates" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Duplicados ({duplicateRecords.length})
          </button>
          {demoMode && <button
            onClick={() => setActiveTab("aliases")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "aliases" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Alias Ortográficos
          </button>}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
          <span className="text-[10px] font-bold uppercase text-rose-800">Errores Críticos Pendientes</span>
          <div className="text-2xl font-black text-rose-900 mt-1">{totalCriticals}</div>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <span className="text-[10px] font-bold uppercase text-amber-800">Advertencias Operativas</span>
          <div className="text-2xl font-black text-amber-900 mt-1">{totalWarnings}</div>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <span className="text-[10px] font-bold uppercase text-emerald-800">Registros Impecables (Clean)</span>
          <div className="text-2xl font-black text-emerald-900 mt-1">
            {records.length - recordsWithErrors.length} / {records.length}
          </div>
        </div>
      </div>

      {activeTab === "errors" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Listado de Inconsistencias por Paciente</h3>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium"
            >
              <option value="ALL">Todas las Severidades</option>
              <option value="Critical Error">Critical Error</option>
              <option value="Warning">Warning</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 uppercase text-[10px] font-semibold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-3">MRN / Paciente</th>
                  <th className="p-3">Care Manager</th>
                  <th className="p-3">Servicio</th>
                  <th className="p-3">Descripción de Inconsistencia</th>
                  <th className="p-3 text-center">Severidad</th>
                  <th className="p-3 text-right">Acción de Corrección</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {recordsWithErrors.map((r) =>
                  r.validationErrors
                    .filter((e) => filterSeverity === "ALL" || e.severity === filterSeverity)
                    .map((err) => (
                      <tr key={`${r.id}-${err.id}`} className="hover:bg-slate-50">
                        <td className="p-3">
                          <span className="font-mono font-bold text-slate-900">{r.mrn}</span>
                          <p className="font-medium text-slate-800">{r.patientName}</p>
                        </td>
                        <td className="p-3 text-slate-600">{r.careManagerName}</td>
                        <td className="p-3 font-bold text-indigo-600">{r.serviceCode}</td>
                        <td className="p-3 text-rose-800 font-medium">{err.message}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              err.severity === "Critical Error"
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {err.severity}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!err.resolved && demoMode ? (
                              <button
                                onClick={() => handleResolve(r.id, err.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-[11px]"
                              >
                                Resolver
                              </button>
                            ) : err.resolved ? (
                              <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Resuelto
                              </span>
                            ) : <span className="text-[11px] font-semibold text-slate-500">Revisión backend</span>}
                            <button
                              onClick={() => onOpenPatient(r)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px]"
                            >
                              Dossier
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "duplicates" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Registros Duplicados Identificados ({duplicateRecords.length})</h3>
          <p className="text-slate-500">Mismo paciente (MRN) registrado múltiples veces en el mismo periodo y programa de servicio.</p>

          <div className="space-y-2">
            {duplicateRecords.map((r) => (
              <div key={r.id} className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-slate-900">MRN: {r.mrn}</span> • <strong className="text-slate-800">{r.patientName}</strong> • {r.serviceCode} ({r.monthOf})
                  <p className="text-[11px] text-slate-500 mt-0.5">Care Manager: {r.careManagerName} • Facturación: ${r.monthlyBilling}</p>
                </div>
                <div className="flex items-center gap-2">
                  {demoMode && <button
                    onClick={() => toggleRecordPayrollStatus(r.id, "Excluded", "Duplicado confirmado")}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-[11px]"
                  >
                    Excluir de Payroll
                  </button>}
                  <button
                    onClick={() => onOpenPatient(r)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-[11px]"
                  >
                    Ver Detalle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {demoMode && activeTab === "aliases" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Mapeo de Alias Ortográficos de Care Managers</h3>
          <p className="text-slate-500">Vincule nombres abreviados o variaciones tipográficas en los archivos Excel al perfil oficial del Care Manager.</p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-slate-700 font-semibold mb-1">Care Manager Oficial:</label>
              <select
                value={selectedCmId}
                onChange={(e) => setSelectedCmId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium"
              >
                {careManagers.map((cm) => (
                  <option key={cm.id} value={cm.id}>{cm.name} ({cm.role})</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-slate-700 font-semibold mb-1">Nuevo Alias a Vincular:</label>
              <input
                type="text"
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value)}
                placeholder="ej: Maria G. Perez"
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
              />
            </div>

            <button
              onClick={handleAddCmAlias}
              className="mt-5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md"
            >
              Vincular Alias
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
