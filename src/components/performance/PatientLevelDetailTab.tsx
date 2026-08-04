import React, { useState, useMemo } from "react";
import { Search, Download, Filter, Edit3, ShieldAlert, CheckCircle, ChevronRight, Eye, AlertTriangle, FileText } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { MonthlyManagementRecord } from "../../types";

interface PatientLevelDetailTabProps {
  preFilter?: {
    serviceCode?: string;
    billableOnly?: boolean;
    minDays?: number;
    cmId?: string;
    search?: string;
    qualityErrorOnly?: boolean;
  };
}

export const PatientLevelDetailTab: React.FC<PatientLevelDetailTabProps> = ({ preFilter }) => {
  const { records, globalFilters, addAuditLog } = useApp();
  const [search, setSearch] = useState<string>(preFilter?.search || "");
  const [selectedRecordForEdit, setSelectedRecordForEdit] = useState<MonthlyManagementRecord | null>(null);

  const currentMonth = globalFilters.monthOf || "2026-07";

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (r.monthOf !== currentMonth) return false;
      if (preFilter?.serviceCode && r.serviceCode !== preFilter.serviceCode) return false;
      if (preFilter?.cmId && r.careManagerId !== preFilter.cmId) return false;
      if (preFilter?.billableOnly && (r.monthlyBilling === 0 || r.eligibility !== "Eligible")) return false;
      if (preFilter?.minDays && r.logEntries < preFilter.minDays) return false;
      if (preFilter?.qualityErrorOnly && r.validationErrors.length === 0) return false;

      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = r.patientName.toLowerCase().includes(query);
        const matchesMRN = r.mrn.toLowerCase().includes(query);
        const matchesCM = r.careManagerName.toLowerCase().includes(query);
        const matchesPractice = r.practiceId.toLowerCase().includes(query);
        if (!matchesName && !matchesMRN && !matchesCM && !matchesPractice) return false;
      }
      return true;
    });
  }, [records, currentMonth, preFilter, search]);

  return (
    <div className="space-y-4 text-xs">
      {/* Search & Control Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por Nombre, MRN, Care Manager o Práctica..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          {preFilter && Object.keys(preFilter).length > 0 && (
            <span className="px-3 py-1.5 bg-indigo-100 text-indigo-800 rounded-xl font-bold border border-indigo-200 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter Applied from KPI Drill-down
            </span>
          )}
          <button className="px-3 py-2 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-1.5">
            <Download className="w-4 h-4" /> Export Excel ({filteredRecords.length})
          </button>
        </div>
      </div>

      {/* Main Patient Detail Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-900 text-white font-semibold uppercase text-[10px]">
            <tr>
              <th className="p-3">MRN / Paciente</th>
              <th className="p-3">Práctica / Provider</th>
              <th className="p-3">Care Manager</th>
              <th className="p-3">Servicio / Sub-service</th>
              <th className="p-3">Códigos CPT</th>
              <th className="p-3 text-right">Tiempo Documentado</th>
              <th className="p-3 text-right">Días RPM</th>
              <th className="p-3 text-right">Facturación</th>
              <th className="p-3 text-center">Calidad / Alertas</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredRecords.map((r) => {
              const docHours = (r.logEntries * 0.4).toFixed(1);
              const adjHours = (r.logEntries * 0.4 * 1.20).toFixed(1);

              return (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{r.patientName}</div>
                    <span className="text-[10px] text-slate-400 font-mono">MRN: {r.mrn}</span>
                  </td>

                  <td className="p-3 text-slate-600">
                    <div>{r.practiceId}</div>
                    <span className="text-[10px] text-slate-400">Dr. Provider</span>
                  </td>

                  <td className="p-3 font-semibold text-slate-800">{r.careManagerName}</td>

                  <td className="p-3 font-mono font-bold text-indigo-600">
                    <div>{r.serviceCode}</div>
                    <span className="text-[10px] text-slate-400 font-normal">Complex Care</span>
                  </td>

                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {r.codes.map((c) => (
                        <span key={c} className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded font-mono text-[10px] border border-slate-200">
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="p-3 text-right font-mono">
                    <div className="font-bold text-slate-900">{docHours} h</div>
                    <span className="text-[10px] text-indigo-600 font-semibold">Adj: {adjHours} h</span>
                  </td>

                  <td className="p-3 text-right font-mono font-bold text-slate-800">
                    {r.serviceCode === "RPM" ? `${r.logEntries} días` : "N/A"}
                  </td>

                  <td className="p-3 text-right font-mono font-bold text-emerald-700">
                    ${r.monthlyBilling.toFixed(2)}
                  </td>

                  <td className="p-3 text-center">
                    {r.validationErrors.length > 0 ? (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]">
                        {r.validationErrors.length} Error(es)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                        OK Facturable
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-center">
                    <button
                      onClick={() => setSelectedRecordForEdit(r)}
                      className="px-2.5 py-1 bg-indigo-600 text-white hover:bg-indigo-500 rounded font-bold text-[11px]"
                    >
                      Editar / Logs
                    </button>
                  </td>
                </tr>
              );
            })}

            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={10} className="p-12 text-center text-slate-400">
                  No se encontraron registros de paciente con los criterios de búsqueda o filtro aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Patient Log Modal */}
      {selectedRecordForEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h4 className="font-bold text-slate-900 text-base">
              Editar Registro de Paciente — {selectedRecordForEdit.patientName} (MRN: {selectedRecordForEdit.mrn})
            </h4>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Estado de Elegibilidad:</label>
                <select className="w-full border border-slate-300 rounded-xl p-2 font-medium">
                  <option value="Eligible">Eligible</option>
                  <option value="Ineligible">Ineligible</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Entradas de Log Registradas:</label>
                <input
                  type="number"
                  defaultValue={selectedRecordForEdit.logEntries}
                  className="w-full border border-slate-300 rounded-xl p-2 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedRecordForEdit(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  addAuditLog("Patient Record Updated", "MonthlyManagementRecord", selectedRecordForEdit.id, "Actualización manual de log de paciente.");
                  setSelectedRecordForEdit(null);
                }}
                className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-md"
              >
                Guardar Cambios Auditados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
