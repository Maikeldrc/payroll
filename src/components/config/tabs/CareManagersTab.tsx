import React, { useState } from "react";
import {
  Users,
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
  ShieldCheck,
  Building2,
  Stethoscope,
  Layers,
  Tag,
  Calendar,
  DollarSign,
  UserCheck,
  KeyRound,
  FileCheck,
} from "lucide-react";
import { CareManager, Practice, Provider, ConfigUserRole } from "../../../types";

interface CareManagersTabProps {
  careManagers: CareManager[];
  practices: Practice[];
  providers: Provider[];
  userRole: ConfigUserRole;
  onSelectCareManager: (cm: CareManager) => void;
  onAddCareManager: () => void;
  onDeactivateCareManager: (cm: CareManager) => void;
}

export const CareManagersTab: React.FC<CareManagersTabProps> = ({
  careManagers,
  practices,
  providers,
  userRole,
  onSelectCareManager,
  onAddCareManager,
  onDeactivateCareManager,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Inactive">("ALL");
  const [practiceFilter, setPracticeFilter] = useState<string>("ALL");
  const [selectedCMIds, setSelectedCMIds] = useState<string[]>([]);

  const canEdit = ["System Administrator", "Operations Administrator"].includes(userRole);

  const toggleSelectAll = () => {
    if (selectedCMIds.length === filteredCMs.length) {
      setSelectedCMIds([]);
    } else {
      setSelectedCMIds(filteredCMs.map((cm) => cm.id));
    }
  };

  const toggleSelectCM = (id: string) => {
    setSelectedCMIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredCMs = careManagers.filter((cm) => {
    const matchesSearch =
      cm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cm.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cm.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cm.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || (cm.status || "Active") === statusFilter;

    const matchesPractice =
      practiceFilter === "ALL" || cm.practiceIds.includes(practiceFilter);

    return matchesSearch && matchesStatus && matchesPractice;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar Care Manager por Nombre, Email, ID o Alias..."
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

          {/* Practice Filter */}
          <select
            value={practiceFilter}
            onChange={(e) => setPracticeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">Todas las Prácticas</option>
            {practices.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={onAddCareManager}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              + Add Care Manager
            </button>
          )}

          <button className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors">
            <Upload className="w-4 h-4 text-indigo-600" />
            Import Excel
          </button>

          <button className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bulk Action Bar if items selected */}
      {selectedCMIds.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl flex items-center justify-between text-xs font-semibold text-indigo-900 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            <span>{selectedCMIds.length} Care Managers seleccionados para acciones masivas</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold transition-colors">
              Asignar Práctica
            </button>
            <button className="px-3 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-bold transition-colors">
              Desactivar Selección
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200 text-[10px]">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedCMIds.length === filteredCMs.length && filteredCMs.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="p-3">ID / Care Manager</th>
                <th className="p-3">Contacto & Credenciales</th>
                <th className="p-3">Prácticas Asignadas</th>
                <th className="p-3">Providers Asignados</th>
                <th className="p-3">Aliases Detectados</th>
                <th className="p-3 text-center">Perfil Payroll</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCMs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No se encontraron Care Managers con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredCMs.map((cm) => {
                  const assignedPracticesList = practices.filter((p) => cm.practiceIds.includes(p.id));
                  const assignedProvidersList = providers.filter((pr) => cm.providerIds.includes(pr.id));
                  const aliasCount = cm.aliases?.length || 0;

                  return (
                    <tr key={cm.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedCMIds.includes(cm.id)}
                          onChange={() => toggleSelectCM(cm.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center shrink-0">
                            {cm.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              {cm.name}
                              {cm.credentials && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-mono text-[10px] rounded font-bold">
                                  {cm.credentials}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1">
                              <span className="font-mono text-slate-600">{cm.id}</span> • {cm.role}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <p className="font-medium text-slate-800">{cm.email}</p>
                        <p className="text-[11px] text-slate-500">{cm.phone || "Sin teléfono"}</p>
                      </td>

                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {assignedPracticesList.map((p) => (
                            <span
                              key={p.id}
                              className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-medium rounded border border-indigo-100 text-[10px]"
                            >
                              {p.code}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 bg-teal-50 text-teal-800 font-bold rounded text-[11px]">
                            {assignedProvidersList.length} Providers
                          </span>
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-medium rounded text-[10px] flex items-center gap-1 border border-amber-200">
                            <Tag className="w-3 h-3 text-amber-600" />
                            {aliasCount} Variantes
                          </span>
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-medium rounded text-[10px] flex items-center justify-center gap-1 mx-auto w-max">
                          <DollarSign className="w-3 h-3 text-emerald-600" />
                          {cm.payrollProfile?.employmentType || "Hourly Standard"}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            (cm.status || "Active") === "Active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {cm.status || "Active"}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onSelectCareManager(cm)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5 text-indigo-400" />
                            Editar
                          </button>

                          {canEdit && (
                            <button
                              onClick={() => onDeactivateCareManager(cm)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Desactivar Care Manager"
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
