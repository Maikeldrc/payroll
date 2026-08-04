import React, { useState } from "react";
import {
  X,
  Check,
  Plus,
  Edit2,
  Sliders,
  Stethoscope,
  Code,
  ShieldCheck,
  AlertTriangle,
  FileCode,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import {
  ServiceConfigDefinition,
  ExtendedCPTCode,
  BillingModel,
  FunnelVisualizationType,
} from "../../data/serviceCatalogRegistry";

interface ServiceConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ServiceConfigModal: React.FC<ServiceConfigModalProps> = ({ isOpen, onClose }) => {
  const { serviceConfigs, extendedCPTCodes, updateServiceConfig, toggleServiceActive, updateExtendedCPTCode } = useApp();
  const [activeTab, setActiveTab] = useState<"services" | "cpt" | "rules">("services");
  const [selectedServiceId, setSelectedServiceId] = useState<string>(serviceConfigs[0]?.id || "");
  const [editingService, setEditingService] = useState<ServiceConfigDefinition | null>(null);
  const [editingCPT, setEditingCPT] = useState<ExtendedCPTCode | null>(null);

  if (!isOpen) return null;

  const currentService = editingService || serviceConfigs.find((s) => s.id === selectedServiceId) || serviceConfigs[0];

  const handleSaveService = () => {
    if (editingService) {
      updateServiceConfig(editingService);
      setEditingService(null);
    }
  };

  const handleSaveCPT = () => {
    if (editingCPT) {
      updateExtendedCPTCode(editingCPT);
      setEditingCPT(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Configuración de Servicios y Registro CPT</h2>
              <p className="text-xs text-slate-400">
                Catálogo dinámico de programas Medicare, reglas de facturación, códigos CPT y umbrales operacionales.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab("services")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
              activeTab === "services"
                ? "border-indigo-600 text-indigo-600 bg-white shadow-xs"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            Catálogo de Servicios ({serviceConfigs.length})
          </button>
          <button
            onClick={() => setActiveTab("rules")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
              activeTab === "rules"
                ? "border-indigo-600 text-indigo-600 bg-white shadow-xs"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Reglas y Denominadores
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {activeTab === "services" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Service List Sidebar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Programas Registrados</h3>
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                    {serviceConfigs.filter((s) => s.active).length} Activos
                  </span>
                </div>
                <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                  {serviceConfigs.map((sc) => (
                    <div
                      key={sc.id}
                      onClick={() => {
                        setSelectedServiceId(sc.id);
                        setEditingService(null);
                      }}
                      className={`w-full p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                        selectedServiceId === sc.id && !editingService
                          ? "border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500/20"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            sc.active ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {sc.code}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-tight">{sc.name}</p>
                          <p className="text-xs text-slate-500">{sc.applicableCPTCodes.join(", ")}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleServiceActive(sc.code);
                        }}
                        className={`px-2 py-1 text-xs font-semibold rounded-md border ${
                          sc.active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {sc.active ? "Activo" : "Inactivo"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detail & Edit Panel */}
              <div className="md:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
                {currentService && (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 font-bold rounded-lg text-xs">
                            {currentService.code}
                          </span>
                          <h3 className="text-lg font-bold text-slate-900">{currentService.name}</h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{currentService.description}</p>
                      </div>
                      {!editingService ? (
                        <button
                          onClick={() => setEditingService({ ...currentService })}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Editar Parámetros
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingService(null)}
                            className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleSaveService}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Guardar Cambios
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Form / Configuration details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Nombre del Servicio</label>
                        <input
                          type="text"
                          disabled={!editingService}
                          value={editingService ? editingService.name : currentService.name}
                          onChange={(e) =>
                            editingService && setEditingService({ ...editingService, name: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50 text-slate-900 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Modelo de Facturación</label>
                        <select
                          disabled={!editingService}
                          value={editingService ? editingService.billingModel : currentService.billingModel}
                          onChange={(e) =>
                            editingService &&
                            setEditingService({
                              ...editingService,
                              billingModel: e.target.value as BillingModel,
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50 text-slate-900 font-medium"
                        >
                          <option value="clinical_staff">Clinical Staff Time Model</option>
                          <option value="physician_qhp">Physician / QHP Model</option>
                          <option value="hybrid">Hybrid (Device + Mgmt Time)</option>
                          <option value="episode_based">Episode-Based (TCM Discharges)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Tipo de Embudo Principal</label>
                        <select
                          disabled={!editingService}
                          value={editingService ? editingService.funnelType : currentService.funnelType}
                          onChange={(e) =>
                            editingService &&
                            setEditingService({
                              ...editingService,
                              funnelType: e.target.value as FunnelVisualizationType,
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50 text-slate-900 font-medium"
                        >
                          <option value="time_interval">Time Interval Funnel (CCM / PCM / BHI)</option>
                          <option value="device_data">Device Data Funnel (RPM / RTM)</option>
                          <option value="episode_milestone">Episode Milestone Funnel (TCM)</option>
                          <option value="eligibility_billing">Eligibility-to-Billing (APCM)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Código CPT Principal</label>
                        <input
                          type="text"
                          disabled={!editingService}
                          value={editingService ? editingService.primaryCPT : currentService.primaryCPT}
                          onChange={(e) =>
                            editingService && setEditingService({ ...editingService, primaryCPT: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50 text-slate-900 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Meta Tasa Facturable (%)</label>
                        <input
                          type="number"
                          disabled={!editingService}
                          value={editingService ? editingService.targetBillableRate : currentService.targetBillableRate}
                          onChange={(e) =>
                            editingService &&
                            setEditingService({
                              ...editingService,
                              targetBillableRate: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50 text-slate-900 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Umbral Alerta Advertencia (%)</label>
                        <input
                          type="number"
                          disabled={!editingService}
                          value={editingService ? editingService.warningThreshold : currentService.warningThreshold}
                          onChange={(e) =>
                            editingService &&
                            setEditingService({
                              ...editingService,
                              warningThreshold: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50 text-slate-900 font-medium"
                        />
                      </div>
                    </div>

                    {/* Funnel Stages List */}
                    <div className="pt-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                        Etapas Configurada para el Embudo ({currentService.funnelStages.length} Etapas)
                      </h4>
                      <div className="space-y-2">
                        {currentService.funnelStages.map((stg) => (
                          <div
                            key={stg.id}
                            className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-md bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
                                {stg.stageNumber}
                              </span>
                              <div>
                                <p className="text-xs font-bold text-slate-900">{stg.title}</p>
                                <p className="text-[11px] text-slate-500">{stg.description}</p>
                              </div>
                            </div>
                            {stg.cptCode && (
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[11px] font-mono font-bold rounded">
                                CPT {stg.cptCode}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === "cpt" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Registro General de CPT Codes (CMS 2026)</h3>
                  <p className="text-xs text-slate-500">
                    Definición oficial de tarifas base, unidades de add-on, profesional calificado y requerimiento de minutos.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase">
                    <tr>
                      <th className="p-3">Código CPT</th>
                      <th className="p-3">Servicio</th>
                      <th className="p-3">Categoría</th>
                      <th className="p-3">Minutos Requeridos</th>
                      <th className="p-3">Tipo Profesional</th>
                      <th className="p-3 text-right">Tarifa Estándar ($)</th>
                      <th className="p-3 text-center">Estado</th>
                      <th className="p-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {extendedCPTCodes.map((cpt) => (
                      <tr key={cpt.code} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-mono font-bold text-indigo-700">{cpt.code}</td>
                        <td className="p-3 font-bold text-slate-800">{cpt.serviceCode}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                              cpt.billingCategory === "Base"
                                ? "bg-indigo-100 text-indigo-800"
                                : cpt.billingCategory === "Add-On"
                                ? "bg-teal-100 text-teal-800"
                                : cpt.billingCategory === "Episode"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {cpt.billingCategory}
                          </span>
                        </td>
                        <td className="p-3 text-slate-700">{cpt.timeRequirementMinutes} min</td>
                        <td className="p-3 text-slate-700">{cpt.applicableProfessionalType}</td>
                        <td className="p-3 text-right font-semibold text-slate-900">${cpt.standardRate.toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              cpt.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {cpt.active ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setEditingCPT({ ...cpt })}
                            className="p-1 text-slate-500 hover:text-indigo-600 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {editingCPT && (
                <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-indigo-900">Editar Código CPT: {editingCPT.code}</h4>
                    <button
                      onClick={() => setEditingCPT(null)}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      Cancelar
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Descripción</label>
                      <input
                        type="text"
                        value={editingCPT.description}
                        onChange={(e) => setEditingCPT({ ...editingCPT, description: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Tarifa Estándar ($)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={editingCPT.standardRate}
                        onChange={(e) =>
                          setEditingCPT({ ...editingCPT, standardRate: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Minutos Requeridos</label>
                      <input
                        type="number"
                        value={editingCPT.timeRequirementMinutes}
                        onChange={(e) =>
                          setEditingCPT({ ...editingCPT, timeRequirementMinutes: parseInt(e.target.value) || 0 })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSaveCPT}
                      className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-xs"
                    >
                      Guardar CPT
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "rules" && (
            <div className="space-y-4 text-xs text-slate-700">
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-600" />
                  Políticas de Denominadores y Criterios Auditales
                </h3>
                <p className="text-slate-600">
                  Todas las métricas y porcentajes en el módulo Service Performance calculan explícitamente su denominador para prevenir distorsiones de datos en auditorías regulatorias:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="font-bold text-slate-900 block mb-1">Total Patients / Episodes</span>
                    <p className="text-slate-500">
                      Calcula la tasa respecto al número total de pacientes asignados al programa en el mes o episodios identificados.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="font-bold text-slate-900 block mb-1">Conversión Etapa Anterior</span>
                    <p className="text-slate-500">
                      Calcula el porcentaje de retención/transición en comparación directa con los pacientes que lograron la etapa previa.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="font-bold text-slate-900 block mb-1">Patients Eligible</span>
                    <p className="text-slate-500">
                      Filtra únicamente aquellos pacientes que cumplen criterios de elegibilidad de seguro e historial clínico de riesgo.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="font-bold text-slate-900 block mb-1">TCM Episode Milestone Rule</span>
                    <p className="text-slate-500">
                      TCM no acumula minutos mensuales. Mide el cumplimiento de hitos: Contacto ≤ 2 días hábiles y Visita presencial ≤ 7 o 14 días.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Los cambios aplicados en este modal se actualizan inmediatamente en el contexto global de la plataforma.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Cerrar Modal
          </button>
        </div>
      </div>
    </div>
  );
};
