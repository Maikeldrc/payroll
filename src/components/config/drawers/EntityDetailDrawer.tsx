import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Building2,
  Users,
  Stethoscope,
  Layers,
  FileCode2,
  Tag,
  History,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  AlertCircle,
  Clock,
  UserCheck,
  KeyRound,
  FileSpreadsheet,
} from "lucide-react";
import {
  Organization,
  Practice,
  CareManager,
  Provider,
  ServiceCatalogItem,
  CPTCode,
  ServiceICD10CodeSet,
  CatalogImportTemplate,
  AuditLogEntry,
  ConfigUserRole,
} from "../../../types";

interface EntityDetailDrawerProps {
  isOpen: boolean;
  entity: any | null;
  entityType:
    | "Organization"
    | "Practice"
    | "CareManager"
    | "Provider"
    | "Service"
    | "CPT"
    | "ICD10CodeSet"
    | "ImportTemplate"
    | null;
  userRole: ConfigUserRole;
  auditLogs: AuditLogEntry[];
  practices: Practice[];
  providers: Provider[];
  careManagers: CareManager[];
  services: ServiceCatalogItem[];
  onClose: () => void;
  onSave: (updatedEntity: any, entityType: string) => void;
}

export const EntityDetailDrawer: React.FC<EntityDetailDrawerProps> = ({
  isOpen,
  entity,
  entityType,
  userRole,
  auditLogs,
  practices,
  providers,
  careManagers,
  services,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<
    "profile" | "relationships" | "aliases" | "rules" | "audit"
  >("profile");

  const [formData, setFormData] = useState<any>({});
  const [aliasInput, setAliasInput] = useState("");
  const [isSavedToast, setIsSavedToast] = useState(false);

  useEffect(() => {
    if (entity) {
      setFormData({ ...entity });
    }
    setActiveTab("profile");
  }, [entity]);

  if (!isOpen || !entity || !entityType) return null;

  const canEdit = [
    "System Administrator",
    "Operations Administrator",
    "Billing Administrator",
    "Clinical Administrator",
  ].includes(userRole);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleAddAlias = () => {
    if (!aliasInput.trim()) return;
    const currentAliases = formData.aliases || [];
    setFormData((prev: any) => ({
      ...prev,
      aliases: [...currentAliases, aliasInput.trim()],
    }));
    setAliasInput("");
  };

  const handleRemoveAlias = (index: number) => {
    const currentAliases = formData.aliases || [];
    setFormData((prev: any) => ({
      ...prev,
      aliases: currentAliases.filter((_: any, i: number) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, entityType);
    setIsSavedToast(true);
    setTimeout(() => {
      setIsSavedToast(false);
      onClose();
    }, 1200);
  };

  // Filter audit logs for this specific entity
  const entityAuditLogs = auditLogs.filter(
    (log) => log.entityId === entity.id || log.entityId === entity.code
  );

  const getEntityTitle = () => {
    switch (entityType) {
      case "Organization":
        return `Organización: ${formData.name || "Nueva Organización"}`;
      case "Practice":
        return `Práctica: ${formData.name || "Nueva Práctica"}`;
      case "CareManager":
        return `Care Manager: ${formData.name || "Nuevo Care Manager"}`;
      case "Provider":
        return `Provider: ${formData.name || "Nuevo Provider"}`;
      case "Service":
        return `Programa de Servicio: ${formData.code} - ${formData.name}`;
      case "CPT":
        return `Código CPT / HCPCS: ${formData.code}`;
      case "ICD10CodeSet":
        return `Diagnósticos: ${formData.name}`;
      case "ImportTemplate":
        return `Plantilla: ${formData.name}`;
      default:
        return "Detalle de Registro Maestro";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="bg-slate-900 text-white p-6 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-300 font-bold text-[10px] rounded uppercase tracking-wider border border-indigo-400/30">
                {entityType}
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold text-[10px] rounded border border-emerald-500/30">
                {formData.status || "Active"}
              </span>
            </div>
            <h2 className="text-xl font-black">{getEntityTitle()}</h2>
            <p className="text-xs text-slate-400 mt-1 font-mono">ID: {formData.id || formData.code}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Drawer Nav Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 flex items-center gap-2 overflow-x-auto text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab("profile")}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "profile"
                ? "border-indigo-600 text-indigo-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Perfil General
          </button>

          <button
            onClick={() => setActiveTab("relationships")}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "relationships"
                ? "border-indigo-600 text-indigo-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            Asociaciones & Estructura
          </button>

          {(entityType === "CareManager" || entityType === "Provider" || entityType === "Practice") && (
            <button
              onClick={() => setActiveTab("aliases")}
              className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === "aliases"
                  ? "border-indigo-600 text-indigo-600 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Tag className="w-4 h-4" />
              Aliases Ortográficos ({(formData.aliases || []).length})
            </button>
          )}

          <button
            onClick={() => setActiveTab("audit")}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "audit"
                ? "border-indigo-600 text-indigo-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <History className="w-4 h-4" />
            Historial de Cambios ({entityAuditLogs.length})
          </button>
        </div>

        {/* Drawer Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
          {/* TAB 1: Profile */}
          {activeTab === "profile" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Código / ID Identificador</label>
                  <input
                    type="text"
                    value={formData.code || formData.id || ""}
                    onChange={(e) => handleInputChange("code", e.target.value)}
                    disabled={!canEdit}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Nombre Display / Legal</label>
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    disabled={!canEdit}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Entity Specific Fields */}
              {entityType === "CareManager" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Credenciales Clínicas (RN, BSN...)</label>
                      <input
                        type="text"
                        value={formData.credentials || ""}
                        onChange={(e) => handleInputChange("credentials", e.target.value)}
                        disabled={!canEdit}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Correo Electrónico Corporativo</label>
                      <input
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        disabled={!canEdit}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Rol Operativo</label>
                      <input
                        type="text"
                        value={formData.role || "Lead Care Manager"}
                        onChange={(e) => handleInputChange("role", e.target.value)}
                        disabled={!canEdit}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Estado de Empleo</label>
                      <select
                        value={formData.employmentStatus || "Full-Time"}
                        onChange={(e) => handleInputChange("employmentStatus", e.target.value)}
                        disabled={!canEdit}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                      >
                        <option value="Full-Time">Full-Time (Tiempo Completo)</option>
                        <option value="Part-Time">Part-Time (Medio Tiempo)</option>
                        <option value="Contractor">Contratista Externo</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {entityType === "Provider" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">NPI (National Provider Identifier)</label>
                      <input
                        type="text"
                        value={formData.npi || ""}
                        onChange={(e) => handleInputChange("npi", e.target.value)}
                        disabled={!canEdit}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Especialidad Médica</label>
                      <input
                        type="text"
                        value={formData.specialty || ""}
                        onChange={(e) => handleInputChange("specialty", e.target.value)}
                        disabled={!canEdit}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                      />
                    </div>
                  </div>
                </>
              )}

              {entityType === "Service" && (
                <>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Categoría del Programa</label>
                    <input
                      type="text"
                      value={formData.category || "Chronic Care Management"}
                      onChange={(e) => handleInputChange("category", e.target.value)}
                      disabled={!canEdit}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Descripción Completa del Programa</label>
                    <textarea
                      value={formData.description || ""}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      disabled={!canEdit}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Unidad de Reporte Operativo</label>
                      <select
                        value={formData.reportingUnit || "Patient-Month"}
                        onChange={(e) => handleInputChange("reportingUnit", e.target.value)}
                        disabled={!canEdit}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                      >
                        <option value="Patient-Month">Patient-Month (Mensual por Paciente)</option>
                        <option value="Episode">Episode (Episodio de Atención)</option>
                        <option value="Encounter">Encounter (Encuentro Clínico)</option>
                        <option value="Device Period">Device Period (Lecturas de Dispositivo)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Modelo Panel de Performance</label>
                      <select
                        value={formData.performanceConfig?.panelType || "Time Interval Funnel"}
                        onChange={(e) =>
                          setFormData((prev: any) => ({
                            ...prev,
                            performanceConfig: {
                              ...(prev.performanceConfig || {}),
                              panelType: e.target.value,
                            },
                          }))
                        }
                        disabled={!canEdit}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                      >
                        <option value="Time Interval Funnel">Time Interval Funnel</option>
                        <option value="Device Data Funnel">Device Data Funnel</option>
                        <option value="Episode Milestone Funnel">Episode Milestone Funnel</option>
                        <option value="Eligibility-to-Billing Funnel">Eligibility-to-Billing Funnel</option>
                        <option value="Simple KPI Panel">Simple KPI Panel</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {entityType === "CPT" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Sistema de Código</label>
                      <select
                        value={formData.codeSystem || "CPT"}
                        onChange={(e) => handleInputChange("codeSystem", e.target.value)}
                        disabled={!canEdit}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                      >
                        <option value="CPT">CPT Category I</option>
                        <option value="HCPCS Level II">HCPCS Level II (G-Codes)</option>
                        <option value="Custom Internal Code">Custom Internal Code</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Tarifa Estándar ($ USD)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.standardRate || 0}
                        onChange={(e) => handleInputChange("standardRate", parseFloat(e.target.value))}
                        disabled={!canEdit}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Descripción Larga CPT</label>
                    <textarea
                      value={formData.longDescription || formData.description || ""}
                      onChange={(e) => handleInputChange("longDescription", e.target.value)}
                      disabled={!canEdit}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900"
                    />
                  </div>
                </>
              )}

              {/* Status & Effective Dates */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Estado de Registro</label>
                  <select
                    value={formData.status || "Active"}
                    onChange={(e) => handleInputChange("status", e.target.value)}
                    disabled={!canEdit}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
                  >
                    <option value="Active">Activo (Active)</option>
                    <option value="Inactive">Inactivo (Inactive)</option>
                    <option value="Archived">Archivado (Archived)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Fecha de Vigencia (Effective Date)</label>
                  <input
                    type="date"
                    value={formData.effectiveDate || new Date().toISOString().split("T")[0]}
                    onChange={(e) => handleInputChange("effectiveDate", e.target.value)}
                    disabled={!canEdit}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Relationships */}
          {activeTab === "relationships" && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-indigo-900">
                <h4 className="font-bold text-sm flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Estructura de Relaciones y Asociaciones Múltiples
                </h4>
                <p className="text-xs text-indigo-700 mt-1">
                  Gestione las asignaciones de este registro con prácticas, proveedores y servicios corporativos.
                </p>
              </div>

              {entityType === "CareManager" && (
                <div className="space-y-3">
                  <label className="block font-bold text-slate-900">Prácticas Asignadas:</label>
                  <div className="grid grid-cols-1 gap-2">
                    {practices.map((p) => {
                      const isAssigned = (formData.practiceIds || []).includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                            isAssigned ? "bg-indigo-50 border-indigo-300" : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div>
                            <span className="font-bold text-slate-900">{p.name}</span>
                            <span className="ml-2 font-mono text-xs text-slate-500">({p.code})</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            onChange={(e) => {
                              const current = formData.practiceIds || [];
                              const updated = e.target.checked
                                ? [...current, p.id]
                                : current.filter((id: string) => id !== p.id);
                              handleInputChange("practiceIds", updated);
                            }}
                            disabled={!canEdit}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Aliases */}
          {activeTab === "aliases" && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900">
                <h4 className="font-bold text-sm flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-amber-600" />
                  Mapeo de Variantes Ortográficas (Aliases)
                </h4>
                <p className="text-xs text-amber-700 mt-1">
                  Defina variaciones de nombres como figuran en los archivos Excel importados (ej: "M. Fernandez RN", "Fernandez, Maria").
                </p>
              </div>

              {canEdit && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Escriba una variante de nombre..."
                    value={aliasInput}
                    onChange={(e) => setAliasInput(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={handleAddAlias}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    + Agregar Alias
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {(formData.aliases || []).map((alias: string, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                  >
                    <span className="font-mono font-bold text-slate-900 text-xs">"{alias}"</span>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAlias(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Audit History */}
          {activeTab === "audit" && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-indigo-600" />
                  Registro de Auditoría Inmutable
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Trazabilidad completa de modificaciones, usuarios, fechas y motivos.
                </p>
              </div>

              {entityAuditLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No hay entradas de auditoría previas para este registro.
                </div>
              ) : (
                <div className="space-y-3">
                  {entityAuditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <span className="font-bold text-slate-900">{log.user} ({log.userRole})</span>
                        <span className="font-mono">{log.timestamp}</span>
                      </div>
                      <p className="font-bold text-indigo-700">{log.action}</p>
                      <p className="text-slate-700">{log.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Toast Notification */}
          {isSavedToast && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ¡Registro maestro guardado con éxito en los catálogos corporativos!
            </div>
          )}

          {/* Drawer Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors"
            >
              Cancelar
            </button>
            {canEdit && (
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                Guardar Cambios
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
