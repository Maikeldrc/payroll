import React, { useState } from "react";
import {
  Stethoscope,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
  Eye,
  Building2,
  Users,
  Layers,
  Tag,
  ShieldCheck,
  FileCheck2,
} from "lucide-react";
import { Provider, Practice, CareManager, ConfigUserRole } from "../../../types";

interface ProvidersTabProps {
  providers: Provider[];
  practices: Practice[];
  careManagers: CareManager[];
  userRole: ConfigUserRole;
  onSelectProvider: (provider: Provider) => void;
  onAddProvider: () => void;
  onDeactivateProvider: (provider: Provider) => void;
}

export const ProvidersTab: React.FC<ProvidersTabProps> = ({
  providers,
  practices,
  careManagers,
  userRole,
  onSelectProvider,
  onAddProvider,
  onDeactivateProvider,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Inactive">("ALL");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("ALL");
  const [selectedProvIds, setSelectedProvIds] = useState<string[]>([]);

  const canEdit = ["System Administrator", "Operations Administrator"].includes(userRole);

  const specialties = Array.from(
    new Set(providers.map((p) => p.specialty).filter(Boolean))
  );

  const filteredProviders = providers.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.npi && p.npi.includes(searchTerm)) ||
      (p.specialty && p.specialty.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || (p.status || "Active") === statusFilter;
    const matchesSpecialty = specialtyFilter === "ALL" || p.specialty === specialtyFilter;

    return matchesSearch && matchesStatus && matchesSpecialty;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar Provider por Nombre, NPI, ID o Especialidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

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

          {/* Specialty Filter */}
          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">Todas las Especialidades</option>
            {specialties.map((sp) => (
              <option key={sp} value={sp}>
                {sp}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={onAddProvider}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              + Add Provider
            </button>
          )}

          <button className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors">
            <Upload className="w-4 h-4 text-indigo-600" />
            Import Roster
          </button>

          <button className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200 text-[10px]">
              <tr>
                <th className="p-3">ID / Provider</th>
                <th className="p-3">NPI</th>
                <th className="p-3">Especialidad & Taxonomía</th>
                <th className="p-3">Afiliación de Prácticas</th>
                <th className="p-3">Servicios Habilitados</th>
                <th className="p-3">Care Managers Asignados</th>
                <th className="p-3">Aliases Ortográficos</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProviders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No se encontraron médicos/providers con los criterios especificados.
                  </td>
                </tr>
              ) : (
                filteredProviders.map((prov) => {
                  const primaryPractice = practices.find((p) => p.id === prov.practiceId);
                  const assignedCMsCount = careManagers.filter((cm) =>
                    cm.providerIds.includes(prov.id)
                  ).length;
                  const aliasCount = prov.aliases?.length || 0;

                  return (
                    <tr key={prov.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0">
                            <Stethoscope className="w-4 h-4 text-teal-700" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              {prov.name}
                            </div>
                            <p className="text-[11px] text-slate-500 font-mono">ID: {prov.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 font-mono font-bold text-slate-800">
                        {prov.npi || "N/A"}
                      </td>

                      <td className="p-3">
                        <p className="font-semibold text-slate-800">{prov.specialty || "General Practice"}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {prov.taxonomy || "207Q00000X"}
                        </p>
                      </td>

                      <td className="p-3">
                        <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold rounded-lg text-[11px] flex items-center gap-1 w-max">
                          <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                          {primaryPractice?.code || "Práctica Primaria"}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {["CCM", "RPM", "PCM", "BHI"].map((s) => (
                            <span
                              key={s}
                              className="px-2 py-0.5 bg-amber-50 text-amber-800 font-bold rounded text-[10px] border border-amber-200"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-800 font-bold rounded-lg text-[11px] flex items-center gap-1 w-max">
                          <Users className="w-3.5 h-3.5 text-teal-600" />
                          {assignedCMsCount} Care Managers
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded text-[10px] flex items-center gap-1 border border-slate-200 w-max">
                          <Tag className="w-3 h-3 text-slate-500" />
                          {aliasCount} Variantes
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            (prov.status || "Active") === "Active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {prov.status || "Active"}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onSelectProvider(prov)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5 text-indigo-400" />
                            Gestionar
                          </button>

                          {canEdit && (
                            <button
                              onClick={() => onDeactivateProvider(prov)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Desactivar Provider"
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
