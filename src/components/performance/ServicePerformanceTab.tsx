import React, { useState } from "react";
import {
  Stethoscope,
  Sliders,
  Filter,
  Layers,
  Sparkles,
  Info,
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Users,
  Building2,
  ChevronRight,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { ServicePerformancePanel } from "./ServicePerformancePanel";
import { AllServicesSummaryView } from "./AllServicesSummaryView";
import { ServiceConfigModal } from "./ServiceConfigModal";
import { MonthlyManagementRecord } from "../../types";

interface ServicePerformanceTabProps {
  onDrillDown?: (filter: { serviceCode?: string; minDays?: number; search?: string; billableOnly?: boolean }) => void;
}

export const ServicePerformanceTab: React.FC<ServicePerformanceTabProps> = ({ onDrillDown }) => {
  const { records, serviceConfigs, extendedCPTCodes, globalFilters } = useApp();
  const [selectedServiceCode, setSelectedServiceCode] = useState<string>("ALL");
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [drillDownModal, setDrillDownModal] = useState<{
    isOpen: boolean;
    title: string;
    records: MonthlyManagementRecord[];
  }>({
    isOpen: false,
    title: "",
    records: [],
  });

  const currentMonth = globalFilters.monthOf || "2026-07";
  const monthRecords = records.filter((r) => r.monthOf === currentMonth);

  // Active catalog services
  const activeServices = serviceConfigs.filter((s) => s.active);

  // Visible panels based on filter selection
  const visibleServices =
    selectedServiceCode === "ALL"
      ? activeServices
      : activeServices.filter((s) => s.code === selectedServiceCode);

  const handleOpenDrillDown = (title: string, filteredRecords: MonthlyManagementRecord[]) => {
    setDrillDownModal({
      isOpen: true,
      title,
      records: filteredRecords,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Section Description */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 font-bold rounded-lg text-xs">
              MÓDULO DE DESEMPEÑO MULTISERVICIO
            </span>
            <span className="text-xs text-slate-400 font-mono">Periodo: {currentMonth}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Service Performance</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Análisis de desempeño, conversión billable, utilización de CPT codes y cumplimiento de requisitos por servicio.
          </p>
        </div>

        {/* Action Button: Administrative Configuration */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-sm transition-all hover:shadow-md"
          >
            <Sliders className="w-4 h-4 text-indigo-400" />
            Configure Services & Metrics
          </button>
        </div>
      </div>

      {/* Service Selector Bar (Tabs / Chips / Segmented Control) */}
      <div className="bg-slate-900 p-2 rounded-2xl shadow-md text-white flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setSelectedServiceCode("ALL")}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition-all shrink-0 flex items-center gap-2 ${
            selectedServiceCode === "ALL"
              ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400/40"
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <Layers className="w-4 h-4" />
          All Services ({monthRecords.length} Regs)
        </button>

        <div className="h-4 w-px bg-slate-700 mx-1 shrink-0" />

        {activeServices.map((sc) => {
          const count = monthRecords.filter(
            (r) => r.serviceCode === sc.code || r.codes?.includes(sc.primaryCPT)
          ).length;

          return (
            <button
              key={sc.code}
              onClick={() => setSelectedServiceCode(sc.code)}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all shrink-0 flex items-center gap-2 ${
                selectedServiceCode === sc.code
                  ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400/40"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span>{sc.code}</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Summary view if ALL services selected */}
      {selectedServiceCode === "ALL" && (
        <AllServicesSummaryView
          serviceConfigs={serviceConfigs}
          records={monthRecords}
          cptRegistry={extendedCPTCodes}
          onSelectService={(code) => setSelectedServiceCode(code)}
          onDrillDown={handleOpenDrillDown}
        />
      )}

      {/* Dynamic Service Panels */}
      <div className="space-y-8">
        {visibleServices.map((serviceConfig, index) => {
          const panelNum = `5.${index + 1}`;
          return (
            <ServicePerformancePanel
              key={serviceConfig.id}
              panelNumber={panelNum}
              serviceConfig={serviceConfig}
              records={monthRecords}
              cptRegistry={extendedCPTCodes}
              onDrillDown={handleOpenDrillDown}
            />
          );
        })}
      </div>

      {/* Configuration Modal */}
      <ServiceConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />

      {/* Drill-Down Patient Detail Drawer/Modal */}
      {drillDownModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">
                  Detalle Auditable de Registros
                </span>
                <h3 className="text-lg font-bold">{drillDownModal.title}</h3>
              </div>
              <button
                onClick={() => setDrillDownModal({ isOpen: false, title: "", records: [] })}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                <span>
                  Total registros encontrados: <strong>{drillDownModal.records.length}</strong>
                </span>
                <span>Periodo: {currentMonth}</span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase">
                    <tr>
                      <th className="p-3">MRN / Paciente</th>
                      <th className="p-3">Práctica / Proveedor</th>
                      <th className="p-3">Care Manager</th>
                      <th className="p-3 text-center">Códigos CPT</th>
                      <th className="p-3 text-right">Facturación ($)</th>
                      <th className="p-3 text-center">Elegibilidad</th>
                      <th className="p-3 text-center">Payroll</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {drillDownModal.records.slice(0, 50).map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{r.patientName}</p>
                          <p className="text-[11px] text-indigo-600 font-mono font-bold">{r.mrn}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-slate-800">{r.practiceName}</p>
                          <p className="text-[11px] text-slate-500">{r.providerName}</p>
                        </td>
                        <td className="p-3 text-slate-700 font-medium">{r.careManagerName}</td>
                        <td className="p-3 text-center font-mono font-bold text-slate-800">
                          {r.codes?.join(", ") || r.code1 || "-"}
                        </td>
                        <td className="p-3 text-right font-black text-slate-900">
                          ${(r.monthlyBilling || 0).toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.eligibility === "Eligible"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {r.eligibility}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                              r.payrollStatus === "Included"
                                ? "bg-emerald-100 text-emerald-800"
                                : r.payrollStatus === "Pending Review"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {r.payrollStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
              <span>Mostrando hasta 50 registros para auditoría rápida.</span>
              <button
                onClick={() => setDrillDownModal({ isOpen: false, title: "", records: [] })}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
