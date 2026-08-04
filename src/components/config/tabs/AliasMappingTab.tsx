import React, { useState } from "react";
import {
  Tag,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw,
  GitMerge,
  HelpCircle,
} from "lucide-react";
import { DataAliasMapping, ConfigUserRole } from "../../../types";

interface AliasMappingTabProps {
  aliasMappings: DataAliasMapping[];
  userRole: ConfigUserRole;
  onConfirmMapping: (id: string, matchedEntity: string) => void;
  onCreateMasterRecord: (alias: DataAliasMapping) => void;
  onIgnoreAlias: (id: string) => void;
}

export const AliasMappingTab: React.FC<AliasMappingTabProps> = ({
  aliasMappings,
  userRole,
  onConfirmMapping,
  onCreateMasterRecord,
  onIgnoreAlias,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const canEdit = ["System Administrator", "Operations Administrator"].includes(userRole);

  const filteredMappings = aliasMappings.filter((item) => {
    const matchesSearch =
      item.rawValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.suggestedMatch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sourceFile.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEntity = entityTypeFilter === "ALL" || item.entityType === entityTypeFilter;
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;

    return matchesSearch && matchesEntity && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar Valor Crudo Importado, Coincidencia o Archivo Origen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Entity Type Filter */}
          <select
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">Todas las Entidades</option>
            <option value="Care Manager">Care Manager</option>
            <option value="Provider">Provider / Médico</option>
            <option value="Practice">Práctica / Clínica</option>
            <option value="Service">Servicio / Programa</option>
            <option value="Insurance Name">Aseguradora</option>
            <option value="CPT Code">Código CPT</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="Suggested">Sugeridos (Suggested)</option>
            <option value="Unmapped">Sin Mapear (Unmapped)</option>
            <option value="Confirmed">Confirmados (Confirmed)</option>
            <option value="Needs Review">Requiere Revisión</option>
          </select>
        </div>

        <button className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors">
          <RefreshCw className="w-4 h-4 text-indigo-600" />
          Re-analizar Aliases
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200 text-[10px]">
              <tr>
                <th className="p-3">Valor Importado (Raw Text)</th>
                <th className="p-3">Tipo de Entidad</th>
                <th className="p-3">Coincidencia Sugerida / Confirmada</th>
                <th className="p-3">Archivo Origen</th>
                <th className="p-3 text-center">Ocurrencias</th>
                <th className="p-3 text-center">Score Confianza</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-center">Acciones de Mapeo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMappings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No hay mapeos de alias pendientes con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredMappings.map((item) => {
                  const isConfirmed = item.status === "Confirmed";

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          "{item.rawValue}"
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-800 font-bold rounded-lg text-[10px]">
                          {item.entityType}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-bold text-slate-900">
                            {item.confirmedMatch || item.suggestedMatch}
                          </span>
                        </div>
                      </td>

                      <td className="p-3">
                        <p className="font-medium text-slate-600 flex items-center gap-1 text-[11px]">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                          {item.sourceFile}
                        </p>
                      </td>

                      <td className="p-3 text-center font-bold font-mono text-slate-700">
                        {item.occurrences}x
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-bold font-mono text-[10px] ${
                            item.confidence >= 90
                              ? "bg-emerald-100 text-emerald-800"
                              : item.confidence >= 70
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {item.confidence}%
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isConfirmed
                              ? "bg-emerald-100 text-emerald-800"
                              : item.status === "Suggested"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isConfirmed && canEdit && (
                            <button
                              onClick={() => onConfirmMapping(item.id, item.suggestedMatch)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-colors"
                              title="Confirmar Mapeo"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Confirmar
                            </button>
                          )}

                          {canEdit && (
                            <button
                              onClick={() => onCreateMasterRecord(item)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors"
                              title="Crear como nuevo maestro"
                            >
                              <Plus className="w-3.5 h-3.5 text-indigo-600" />
                              Nuevo Maestro
                            </button>
                          )}

                          {canEdit && (
                            <button
                              onClick={() => onIgnoreAlias(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Ignorar alias"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
