import React, { useState } from "react";
import {
  FileCode2,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  AlertCircle,
  HelpCircle,
  Check,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { CPTCode, ConfigUserRole } from "../../../types";

interface CptHcpcsTabProps {
  cptCodes: CPTCode[];
  userRole: ConfigUserRole;
  onSelectCPT: (cpt: CPTCode) => void;
  onAddCPT: () => void;
  onDeactivateCPT: (cpt: CPTCode) => void;
}

export const CptHcpcsTab: React.FC<CptHcpcsTabProps> = ({
  cptCodes,
  userRole,
  onSelectCPT,
  onAddCPT,
  onDeactivateCPT,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [systemFilter, setSystemFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Inactive">("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "Base" | "AddOn">("ALL");

  const canEdit = ["System Administrator", "Billing Administrator"].includes(userRole);

  const filteredCodes = cptCodes.filter((cpt) => {
    const matchesSearch =
      cpt.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cpt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cpt.serviceCode && cpt.serviceCode.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSystem = systemFilter === "ALL" || (cpt.codeSystem || "CPT") === systemFilter;
    const matchesStatus = statusFilter === "ALL" || (cpt.status || "Active") === statusFilter;
    const matchesType =
      typeFilter === "ALL" || (typeFilter === "Base" ? cpt.isBaseCode !== false : cpt.isBaseCode === false);

    return matchesSearch && matchesSystem && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-4">
      {/* Local Filter & Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por Código CPT (99490, 99453...), Descripción o Servicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Code System Filter */}
          <select
            value={systemFilter}
            onChange={(e) => setSystemFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">Todos los Sistemas</option>
            <option value="CPT">CPT Category I</option>
            <option value="HCPCS Level II">HCPCS Level II (G-Codes)</option>
            <option value="Custom Internal Code">Custom Internal</option>
          </select>

          {/* Base vs Add-on Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">Base & Add-On</option>
            <option value="Base">Solo Código Base</option>
            <option value="AddOn">Solo Add-On Code</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="Active">Solo Activos</option>
            <option value="Inactive">Inactivos / Archivados</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={onAddCPT}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              + Add CPT / HCPCS Code
            </button>
          )}

          <button className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors">
            <Upload className="w-4 h-4 text-indigo-600" />
            Import File CMS
          </button>

          <button className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CPT Codes Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200 text-[10px]">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Sistema & Categoría</th>
                <th className="p-3">Descripción CPT / HCPCS</th>
                <th className="p-3 text-center">Tipo de Código</th>
                <th className="p-3 text-center">Tiempo Mínimo</th>
                <th className="p-3">Servicios Asociados</th>
                <th className="p-3 text-right">Tarifa Estándar</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCodes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No se encontraron códigos CPT/HCPCS con los filtros especificados.
                  </td>
                </tr>
              ) : (
                filteredCodes.map((cpt) => {
                  const isBase = cpt.isBaseCode !== false;
                  const servicesList = cpt.associatedServices || [cpt.serviceCode];

                  return (
                    <tr key={cpt.code} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                            {cpt.code}
                          </span>
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="font-bold text-slate-800">{cpt.codeSystem || "CPT"}</span>
                        <p className="text-[10px] text-slate-400">{cpt.category || "Clinical Care"}</p>
                      </td>

                      <td className="p-3 max-w-sm">
                        <p className="font-semibold text-slate-900 line-clamp-1">{cpt.description}</p>
                        {cpt.longDescription && (
                          <p className="text-[10px] text-slate-500 line-clamp-1">{cpt.longDescription}</p>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            isBase
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                          }`}
                        >
                          {isBase ? "Base Code" : `Add-On (to ${cpt.parentBaseCode || "Base"})`}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-mono font-semibold rounded text-[11px] flex items-center justify-center gap-1 mx-auto w-max">
                          <Clock className="w-3 h-3 text-indigo-600" />
                          {cpt.minimumTimeMinutes || 20} min
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {servicesList.map((s) => (
                            <span
                              key={s}
                              className="px-2 py-0.5 bg-amber-50 text-amber-800 font-bold rounded text-[10px] border border-amber-200"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        ${cpt.standardRate?.toFixed(2) || "0.00"}
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            (cpt.status || "Active") === "Active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {cpt.status || "Active"}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onSelectCPT(cpt)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5 text-indigo-400" />
                            Editar
                          </button>

                          {canEdit && (
                            <button
                              onClick={() => onDeactivateCPT(cpt)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Desactivar Código CPT"
                            >
                              <Trash2 className="w-4 h-4" />
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
