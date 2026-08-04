import React from "react";
import { Filter, RotateCcw, Building2, Stethoscope, User, ShieldCheck } from "lucide-react";
import { useApp } from "../../context/AppContext";

interface GlobalFiltersBarProps {
  activeTab?: string;
}

export const GlobalFiltersBar: React.FC<GlobalFiltersBarProps> = ({ activeTab }) => {
  const { globalFilters, setGlobalFilters, resetGlobalFilters, practices, providers, careManagers, services } = useApp();

  const isConfigTab = activeTab === "config";

  const isFiltered =
    globalFilters.practiceId !== "ALL" ||
    globalFilters.providerId !== "ALL" ||
    globalFilters.careManagerId !== "ALL" ||
    globalFilters.serviceCode !== "ALL" ||
    (!isConfigTab && globalFilters.eligibility !== "ALL") ||
    (!isConfigTab && globalFilters.hmo !== "ALL") ||
    (!isConfigTab && globalFilters.payrollStatus !== "ALL") ||
    globalFilters.qualityStatus !== "ALL";

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-2.5 shadow-xs sticky top-0 z-20">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 no-scrollbar flex-1 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold uppercase text-[10px] tracking-wider pr-2 border-r border-slate-200">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isConfigTab ? "Filtros de Estructura Global" : "Filtros Globales"}</span>
          </div>

          {/* Practice */}
          <select
            value={globalFilters.practiceId}
            onChange={(e) => setGlobalFilters((prev) => ({ ...prev, practiceId: e.target.value }))}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          >
            <option value="ALL">Todas las Prácticas</option>
            {practices.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Provider */}
          <select
            value={globalFilters.providerId}
            onChange={(e) => setGlobalFilters((prev) => ({ ...prev, providerId: e.target.value }))}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          >
            <option value="ALL">Todos los Providers</option>
            {providers.map((pr) => (
              <option key={pr.id} value={pr.id}>{pr.name}</option>
            ))}
          </select>

          {/* Care Manager */}
          <select
            value={globalFilters.careManagerId}
            onChange={(e) => setGlobalFilters((prev) => ({ ...prev, careManagerId: e.target.value }))}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          >
            <option value="ALL">Todos los Care Managers</option>
            {careManagers.map((cm) => (
              <option key={cm.id} value={cm.id}>{cm.name}</option>
            ))}
          </select>

          {/* Service */}
          <select
            value={globalFilters.serviceCode}
            onChange={(e) => setGlobalFilters((prev) => ({ ...prev, serviceCode: e.target.value }))}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          >
            <option value="ALL">Todos los Servicios</option>
            {services.map((s) => (
              <option key={s.id} value={s.code}>{s.code} - {s.name}</option>
            ))}
          </select>

          {/* Operational Filters - Hidden in Administrative Master Data Module */}
          {!isConfigTab && (
            <>
              {/* Eligibility */}
              <select
                value={globalFilters.eligibility}
                onChange={(e) => setGlobalFilters((prev) => ({ ...prev, eligibility: e.target.value }))}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              >
                <option value="ALL">Elegibilidad: Toda</option>
                <option value="Eligible">Eligible</option>
                <option value="Ineligible">Ineligible</option>
                <option value="Pending">Pending</option>
              </select>

              {/* HMO */}
              <select
                value={globalFilters.hmo}
                onChange={(e) => setGlobalFilters((prev) => ({ ...prev, hmo: e.target.value }))}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              >
                <option value="ALL">HMO: Todos</option>
                <option value="Yes">Solo HMO (Yes)</option>
                <option value="No">No HMO</option>
              </select>

              {/* Payroll Status */}
              <select
                value={globalFilters.payrollStatus}
                onChange={(e) => setGlobalFilters((prev) => ({ ...prev, payrollStatus: e.target.value }))}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              >
                <option value="ALL">Estado Payroll: Todos</option>
                <option value="Included">Included in Payroll</option>
                <option value="Excluded">Excluded from Payroll</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Manual Exception">Manual Exception</option>
              </select>
            </>
          )}
        </div>

        {/* Clear Filters */}
        {isFiltered && (
          <button
            onClick={resetGlobalFilters}
            className="px-2.5 py-1 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg font-medium flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpiar Filtros</span>
          </button>
        )}
      </div>
    </div>
  );
};
