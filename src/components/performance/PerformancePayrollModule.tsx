import React, { useState } from "react";
import {
  BarChart2,
  Stethoscope,
  Users,
  Clock,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  FileText,
  BookOpen,
  Bookmark,
  ChevronRight,
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import { CareManager, GlobalFilterState } from "../../types";

import { ExecutiveSummaryTab } from "./ExecutiveSummaryTab";
import { ServicePerformanceTab } from "./ServicePerformanceTab";
import { CareManagerComparisonTab } from "./CareManagerComparisonTab";
import { ProductivityHoursTab } from "./ProductivityHoursTab";
import { PayrollCenterTab } from "./PayrollCenterTab";
import { RevenueAnalysisTab } from "./RevenueAnalysisTab";
import { DataQualityExceptionsTab } from "./DataQualityExceptionsTab";
import { PatientLevelDetailTab } from "./PatientLevelDetailTab";

import { MetricDictionaryModal } from "./MetricDictionaryModal";
import { SavedViewsModal } from "./SavedViewsModal";
import { CareManagerScorecardDrawer } from "./CareManagerScorecardDrawer";

export type ModuleSubTab =
  | "exec-summary"
  | "service-performance"
  | "cm-comparison"
  | "productivity-hours"
  | "payroll-center"
  | "revenue-analysis"
  | "quality-exceptions"
  | "patient-detail";

export const PerformancePayrollModule: React.FC = () => {
  const { records, setGlobalFilters, globalFilters } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<ModuleSubTab>("exec-summary");

  // Modals state
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [isSavedViewsOpen, setIsSavedViewsOpen] = useState(false);

  // Scorecard Drawer state
  const [selectedCMForScorecard, setSelectedCMForScorecard] = useState<CareManager | null>(null);

  // Patient Detail Filter State for Drill-Downs
  const [patientDetailPreFilter, setPatientDetailPreFilter] = useState<{
    serviceCode?: string;
    billableOnly?: boolean;
    minDays?: number;
    cmId?: string;
    search?: string;
    qualityErrorOnly?: boolean;
  }>({});

  const currentMonth = globalFilters.monthOf || "2026-07";
  const errorCount = records.filter((r) => r.monthOf === currentMonth && r.validationErrors.length > 0).length;

  const handleDrillDownToPatients = (filter: typeof patientDetailPreFilter) => {
    setPatientDetailPreFilter(filter);
    setActiveSubTab("patient-detail");
  };

  const handleApplySavedPreset = (presetFilters: GlobalFilterState) => {
    setGlobalFilters(presetFilters);
  };

  return (
    <div className="space-y-6">
      {/* Module Title Header & Quick Actions Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-lg uppercase tracking-wider">
              Enterprise Performance & Payroll Engine
            </span>
            <span className="text-xs text-slate-400 font-mono">v3.2 Audit Grade</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Care Manager Performance & Payroll Report
          </h1>
          <p className="text-xs text-slate-500">
            Análisis consolidado de productividad, embudos por servicio, conciliación de horas, payroll y revenue atribuido.
          </p>
        </div>

        {/* Global Toolbar Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsDictionaryOpen(true)}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Diccionario de Métricas</span>
          </button>

          <button
            onClick={() => setIsSavedViewsOpen(true)}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Bookmark className="w-4 h-4 text-indigo-600" />
            <span>Vistas Guardadas</span>
          </button>

        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 shadow-xs flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
        {[
          { id: "exec-summary", label: "Executive Summary", icon: BarChart2 },
          { id: "service-performance", label: "Service Performance", icon: Stethoscope },
          { id: "cm-comparison", label: "Care Manager Comparison", icon: Users },
          { id: "productivity-hours", label: "Productivity & Hours", icon: Clock },
          { id: "payroll-center", label: "Payroll", icon: DollarSign },
          { id: "revenue-analysis", label: "Revenue Analysis", icon: TrendingUp },
          { id: "quality-exceptions", label: "Data Quality & Exceptions", icon: AlertTriangle, badge: errorCount },
          { id: "patient-detail", label: "Patient-Level Detail", icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as ModuleSubTab)}
              className={`py-2.5 px-3.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? "bg-amber-400 text-slate-900" : "bg-amber-100 text-amber-800 border border-amber-300"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sub-Tab View Rendering */}
      <div>
        {activeSubTab === "exec-summary" && (
          <ExecutiveSummaryTab
            onDrillDown={handleDrillDownToPatients}
            onOpenMetricDictionary={() => setIsDictionaryOpen(true)}
          />
        )}

        {activeSubTab === "service-performance" && (
          <ServicePerformanceTab onDrillDown={handleDrillDownToPatients} />
        )}

        {activeSubTab === "cm-comparison" && (
          <CareManagerComparisonTab
            onSelectCareManager={(cm) => setSelectedCMForScorecard(cm)}
            onDrillDown={handleDrillDownToPatients}
          />
        )}

        {activeSubTab === "productivity-hours" && (
          <ProductivityHoursTab onDrillDown={handleDrillDownToPatients} />
        )}

        {activeSubTab === "payroll-center" && (
          <PayrollCenterTab onDrillDownExceptions={() => setActiveSubTab("quality-exceptions")} />
        )}

        {activeSubTab === "revenue-analysis" && (
          <RevenueAnalysisTab onDrillDown={handleDrillDownToPatients} />
        )}

        {activeSubTab === "quality-exceptions" && (
          <DataQualityExceptionsTab
            onDrillDownPatient={(mrn) => handleDrillDownToPatients({ search: mrn })}
          />
        )}

        {activeSubTab === "patient-detail" && (
          <PatientLevelDetailTab preFilter={patientDetailPreFilter} />
        )}
      </div>

      {/* Modals & Drawers */}
      <MetricDictionaryModal isOpen={isDictionaryOpen} onClose={() => setIsDictionaryOpen(false)} />

      <SavedViewsModal
        isOpen={isSavedViewsOpen}
        onClose={() => setIsSavedViewsOpen(false)}
        onApplyPreset={handleApplySavedPreset}
      />


      <CareManagerScorecardDrawer
        careManager={selectedCMForScorecard}
        onClose={() => setSelectedCMForScorecard(null)}
        onDrillDownPatients={(filter) => {
          setSelectedCMForScorecard(null);
          handleDrillDownToPatients(filter);
        }}
      />
    </div>
  );
};
