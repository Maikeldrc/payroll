import React, { useState } from "react";
import {
  Building2,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  Users,
  Stethoscope,
  Layers,
  MapPin,
  Phone,
  Mail,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShieldAlert,
} from "lucide-react";
import { Organization, Practice, CareManager, Provider, ConfigUserRole } from "../../../types";

interface OrganizationsPracticesTabProps {
  organizations: Organization[];
  practices: Practice[];
  careManagers: CareManager[];
  providers: Provider[];
  userRole: ConfigUserRole;
  onSelectEntity: (entity: Organization | Practice, type: "Organization" | "Practice") => void;
  onAddOrganization: () => void;
  onAddPractice: () => void;
  onDeactivateEntity: (entity: Organization | Practice, type: "Organization" | "Practice") => void;
}

export const OrganizationsPracticesTab: React.FC<OrganizationsPracticesTabProps> = ({
  organizations,
  practices,
  careManagers,
  providers,
  userRole,
  onSelectEntity,
  onAddOrganization,
  onAddPractice,
  onDeactivateEntity,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Inactive">("ALL");
  const [viewMode, setViewMode] = useState<"hierarchy" | "table">("hierarchy");
  const [expandedOrgs, setExpandedOrgs] = useState<Record<string, boolean>>({
    "ORG-001": true,
  });

  const canEdit = ["System Administrator", "Operations Administrator"].includes(userRole);

  const toggleExpand = (orgId: string) => {
    setExpandedOrgs((prev) => ({ ...prev, [orgId]: !prev[orgId] }));
  };

  // Filtered lists
  const filteredOrgs = organizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || (org.status || "Active") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPractices = practices.filter((prac) => {
    const matchesSearch =
      prac.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prac.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || (prac.status || "Active") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Local Filter & Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por Nombre, Código o ID..."
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

          {/* View Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 font-semibold text-xs">
            <button
              onClick={() => setViewMode("hierarchy")}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === "hierarchy" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-500"
              }`}
            >
              Jerarquía Org
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === "table" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-500"
              }`}
            >
              Tabla Plana
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <button
                onClick={onAddOrganization}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4 text-indigo-600" />
                + Organization
              </button>

              <button
                onClick={onAddPractice}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                + Practice
              </button>
            </>
          )}

          <button className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hierarchy View */}
      {viewMode === "hierarchy" ? (
        <div className="space-y-4">
          {filteredOrgs.map((org) => {
            const orgPractices = practices.filter(
              (p) => p.organizationId === org.id || !p.organizationId
            );
            const isExpanded = expandedOrgs[org.id] !== false;

            return (
              <div
                key={org.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
              >
                {/* Organization Header Row */}
                <div
                  onClick={() => toggleExpand(org.id)}
                  className="bg-slate-900 text-white p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button className="p-1 text-slate-400 hover:text-white">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/30 text-indigo-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-base">{org.name}</span>
                        <span className="px-2 py-0.5 bg-indigo-900 text-indigo-300 font-mono text-[10px] font-bold rounded border border-indigo-700">
                          {org.code}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold text-[10px] rounded border border-emerald-500/30">
                          {org.type || "MSO / Network"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {orgPractices.length} Prácticas asociadas • ID: {org.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEntity(org, "Organization");
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Detalle & Config
                    </button>
                  </div>
                </div>

                {/* Sub-practices Tree list */}
                {isExpanded && (
                  <div className="p-4 space-y-3 bg-slate-50/50">
                    {orgPractices.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        No hay prácticas configuradas para esta organización.
                      </div>
                    ) : (
                      orgPractices.map((prac) => {
                        const assignedProvCount = providers.filter(
                          (p) => p.practiceId === prac.id || (p.practiceAffiliations?.some(pa => pa.practiceId === prac.id))
                        ).length;

                        const assignedCmCount = careManagers.filter(
                          (cm) => cm.practiceIds.includes(prac.id)
                        ).length;

                        const enabledServicesList = prac.enabledServices || ["CCM", "RPM", "PCM", "BHI", "APCM", "TCM", "RTM", "CoCM"];

                        return (
                          <div
                            key={prac.id}
                            className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-slate-100 text-slate-700 rounded-lg mt-0.5">
                                <Building2 className="w-4 h-4 text-indigo-600" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-slate-900 text-sm">{prac.name}</h4>
                                  <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                                    {prac.code}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      (prac.status || "Active") === "Active"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-rose-100 text-rose-800"
                                    }`}
                                  >
                                    {prac.status || "Active"}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  {prac.address || "Dirección no registrada"}
                                </p>

                                {/* Interactive Count Chips */}
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-lg font-bold text-[11px] flex items-center gap-1">
                                    <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                                    {assignedProvCount} Providers
                                  </span>
                                  <span className="px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg font-bold text-[11px] flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5 text-teal-600" />
                                    {assignedCmCount} Care Managers
                                  </span>
                                  <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg font-bold text-[11px] flex items-center gap-1">
                                    <Layers className="w-3.5 h-3.5 text-amber-600" />
                                    {enabledServicesList.length} Servicios ({enabledServicesList.join(", ")})
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Practice Row Actions */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onSelectEntity(prac, "Practice")}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5 text-indigo-400" />
                                Gestionar
                              </button>

                              {canEdit && (
                                <button
                                  onClick={() => onDeactivateEntity(prac, "Practice")}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Desactivar Práctica"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Flat Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200 text-[10px]">
              <tr>
                <th className="p-3">Código / ID</th>
                <th className="p-3">Nombre de la Práctica</th>
                <th className="p-3">Organización Parent</th>
                <th className="p-3">Ubicación</th>
                <th className="p-3 text-center">Providers</th>
                <th className="p-3 text-center">Care Managers</th>
                <th className="p-3 text-center">Servicios</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPractices.map((prac) => {
                const parentOrgName = organizations.find((o) => o.id === prac.organizationId)?.name || "N/A";
                const provCount = providers.filter((p) => p.practiceId === prac.id).length;
                const cmCount = careManagers.filter((cm) => cm.practiceIds.includes(prac.id)).length;

                return (
                  <tr key={prac.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-900">{prac.code}</td>
                    <td className="p-3 font-bold text-slate-900">{prac.name}</td>
                    <td className="p-3 text-slate-600">{parentOrgName}</td>
                    <td className="p-3 text-slate-500">{prac.address || "-"}</td>
                    <td className="p-3 text-center font-bold text-indigo-700">{provCount}</td>
                    <td className="p-3 text-center font-bold text-teal-700">{cmCount}</td>
                    <td className="p-3 text-center font-mono text-slate-700">
                      {(prac.enabledServices || ["CCM", "RPM", "PCM", "BHI"]).join(", ")}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {prac.status || "Active"}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => onSelectEntity(prac, "Practice")}
                        className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
