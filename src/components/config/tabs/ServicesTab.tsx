import React, { useState } from "react";
import {
  Layers,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  CheckCircle2,
  Eye,
  Building2,
  Stethoscope,
  Clock,
  Settings2,
  Sliders,
  FileCode2,
  ShieldAlert,
} from "lucide-react";
import { ServiceCatalogItem, Practice, Provider, ConfigUserRole } from "../../../types";

interface ServicesTabProps {
  services: ServiceCatalogItem[];
  practices: Practice[];
  providers: Provider[];
  userRole: ConfigUserRole;
  onSelectService: (service: ServiceCatalogItem) => void;
  onAddService: () => void;
  onDeactivateService: (service: ServiceCatalogItem) => void;
}

export const ServicesTab: React.FC<ServicesTabProps> = ({
  services,
  practices,
  providers,
  userRole,
  onSelectService,
  onAddService,
  onDeactivateService,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Inactive">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const canEdit = ["System Administrator", "Operations Administrator"].includes(userRole);

  const categories = Array.from(
    new Set(services.map((s) => s.category).filter(Boolean))
  );

  const filteredServices = services.filter((s) => {
    const matchesSearch =
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.fullName && s.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (s.status ? s.status === statusFilter : s.active ? statusFilter === "Active" : statusFilter === "Inactive");

    const matchesCategory = categoryFilter === "ALL" || s.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
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
              placeholder="Buscar Servicio por Código (CCM, RPM...), Nombre o Descripción..."
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

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">Todas las Categorías</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={onAddService}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              + Add Service
            </button>
          )}

          <button className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Services Grid & Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200 text-[10px]">
              <tr>
                <th className="p-3">Código / Programa</th>
                <th className="p-3">Nombre Completo & Descripción</th>
                <th className="p-3">Códigos CPT Asociados</th>
                <th className="p-3">Modelo de Performance</th>
                <th className="p-3">Unidad de Reporte</th>
                <th className="p-3 text-center">Prácticas Habilitadas</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No se encontraron programas de servicios con los filtros especificados.
                  </td>
                </tr>
              ) : (
                filteredServices.map((srv) => {
                  const defaultCpts = srv.defaultCPTCodes || ["99490", "99439"];
                  const activePracticesCount = practices.filter(
                    (p) => !p.enabledServices || p.enabledServices.includes(srv.code)
                  ).length;

                  const panelType =
                    srv.performanceConfig?.panelType || "Time Interval Funnel";

                  return (
                    <tr key={srv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-1.5 bg-indigo-900 text-indigo-300 font-mono text-xs font-black rounded-xl border border-indigo-700 shadow-2xs">
                            {srv.code}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900">{srv.name}</div>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {srv.category || "Clinical Management"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 max-w-xs">
                        <div className="font-semibold text-slate-800 line-clamp-1">
                          {srv.fullName || srv.name}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {srv.description}
                        </p>
                      </td>

                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {defaultCpts.map((cpt) => (
                            <span
                              key={cpt}
                              className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono font-bold text-[10px] rounded border border-slate-200"
                            >
                              {cpt}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 font-bold rounded-lg text-[10px] flex items-center gap-1 w-max">
                          <Sliders className="w-3.5 h-3.5 text-amber-600" />
                          {panelType}
                        </span>
                      </td>

                      <td className="p-3 font-semibold text-slate-700">
                        {srv.reportingUnit || "Patient-Month"}
                      </td>

                      <td className="p-3 text-center">
                        <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold rounded-lg text-[11px] mx-auto w-max block">
                          {activePracticesCount} Prácticas
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            srv.active || srv.status === "Active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {srv.active || srv.status === "Active" ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onSelectService(srv)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5 text-indigo-400" />
                            Configurar
                          </button>

                          {canEdit && (
                            <button
                              onClick={() => onDeactivateService(srv)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Desactivar Servicio"
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
