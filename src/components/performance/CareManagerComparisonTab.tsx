import React, { useState, useMemo } from "react";
import { Search, ArrowUpDown, SlidersHorizontal, Download, Eye, Layers, ChevronRight, UserCheck, ShieldAlert, FileSpreadsheet } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { CareManager, MonthlyManagementRecord } from "../../types";

interface CareManagerComparisonTabProps {
  onSelectCareManager: (cm: CareManager) => void;
  onDrillDown: (filter: { cmId?: string; serviceCode?: string }) => void;
}

export const CareManagerComparisonTab: React.FC<CareManagerComparisonTabProps> = ({
  onSelectCareManager,
  onDrillDown,
}) => {
  const { careManagers, records, payrollCalculations, globalFilters } = useApp();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<string>("uniqueActive");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [benchmarkMode, setBenchmarkMode] = useState<"none" | "team_avg" | "target" | "mom">("none");
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  const currentMonth = globalFilters.monthOf || "2026-07";

  // Visible columns configuration
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({
    cm: true,
    supervisor: true,
    uniqueActive: true,
    uniqueBillable: true,
    ccmTotal: true,
    ccmBillable: true,
    ccmRate: true,
    ccm2nd: true,
    ccm3rd: true,
    rpmTotal: true,
    rpmBillable: true,
    rpmRate: true,
    rpm16Days: true,
    rpm16Rate: true,
    rpm2to15Days: true,
    docHours: true,
    adjDocHours: true,
    declaredHours: true,
    utilization: true,
    finalPayroll: true,
    directRevenue: true,
    totalRevenue: true,
    payrollRatio: true,
    revPerWorkHour: true,
    perfScore: true,
    qualityScore: true,
    payrollStatus: true,
  });

  // Calculate row metrics for each Care Manager
  const cmRows = useMemo(() => {
    return careManagers.map((cm) => {
      const cmRecs = records.filter((r) => r.careManagerId === cm.id && r.monthOf === currentMonth);
      const cmPayroll = payrollCalculations.find((c) => c.careManagerId === cm.id && c.monthOf === currentMonth);

      const uniqueActive = new Set(cmRecs.map((r) => r.mrn)).size;
      const uniqueBillable = new Set(cmRecs.filter((r) => r.monthlyBilling > 0 && r.eligibility === "Eligible").map((r) => r.mrn)).size;

      const ccmRecs = cmRecs.filter((r) => r.serviceCode === "CCM");
      const ccmTotal = ccmRecs.length;
      const ccmBillable = ccmRecs.filter((r) => r.monthlyBilling > 0 && r.eligibility === "Eligible").length;
      const ccmRate = ccmTotal > 0 ? (ccmBillable / ccmTotal) * 100 : 0;
      const ccm2nd = Math.round(ccmBillable * 0.38);
      const ccm3rd = Math.round(ccm2nd * 0.28);

      const rpmRecs = cmRecs.filter((r) => r.serviceCode === "RPM");
      const rpmTotal = rpmRecs.length;
      const rpmBillable = rpmRecs.filter((r) => r.monthlyBilling > 0 && r.eligibility === "Eligible").length;
      const rpmRate = rpmTotal > 0 ? (rpmBillable / rpmTotal) * 100 : 0;
      const rpm16Days = rpmRecs.filter((r) => r.logEntries >= 16).length;
      const rpm16Rate = rpmTotal > 0 ? (rpm16Days / rpmTotal) * 100 : 0;
      const rpm2to15Days = rpmRecs.filter((r) => r.logEntries >= 2 && r.logEntries < 16).length;

      const docHours = Number((cmRecs.reduce((acc, r) => acc + r.logEntries * 0.4, 0)).toFixed(1));
      const adjDocHours = Number((docHours * 1.20).toFixed(1));
      const declaredHours = 160;
      const utilization = Math.round((adjDocHours / declaredHours) * 100);

      const directRevenue = cmRecs.reduce((acc, r) => acc + r.monthlyBilling, 0);
      const totalRevenue = directRevenue * 1.28;
      const finalPayroll = cmPayroll?.netPay || 2250;
      const payrollRatio = directRevenue > 0 ? (finalPayroll / directRevenue) * 100 : 0;
      const revPerWorkHour = Number((totalRevenue / declaredHours).toFixed(2));

      const errors = cmRecs.reduce((acc, r) => acc + r.validationErrors.length, 0);
      const qualityScore = Math.max(60, 100 - errors * 12);
      const overallBillableRate = cmRecs.length > 0 ? (uniqueBillable / cmRecs.length) * 100 : 0;
      const perfScore = Math.min(100, Math.round((overallBillableRate + utilization + qualityScore) / 3));

      return {
        cm,
        supervisor: "M. Supervisor",
        uniqueActive,
        uniqueBillable,
        ccmTotal,
        ccmBillable,
        ccmRate,
        ccm2nd,
        ccm3rd,
        rpmTotal,
        rpmBillable,
        rpmRate,
        rpm16Days,
        rpm16Rate,
        rpm2to15Days,
        docHours,
        adjDocHours,
        declaredHours,
        utilization,
        finalPayroll,
        directRevenue,
        totalRevenue,
        payrollRatio,
        revPerWorkHour,
        perfScore,
        qualityScore,
        payrollStatus: cmPayroll?.status || "Ready for Approval",
      };
    });
  }, [careManagers, records, payrollCalculations, currentMonth]);

  // Filter & Sort
  const filteredRows = useMemo(() => {
    let result = cmRows.filter(
      (r) =>
        r.cm.name.toLowerCase().includes(search.toLowerCase()) ||
        r.cm.role.toLowerCase().includes(search.toLowerCase())
    );

    result.sort((a, b) => {
      let valA = (a as any)[sortField];
      let valB = (b as any)[sortField];
      if (typeof valA === "string") {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? valA - valB : valB - valA;
    });

    return result;
  }, [cmRows, search, sortField, sortAsc]);

  // Helper for conditional highlighting
  const getBadgeColor = (val: number, target: number, warn: number) => {
    if (val >= target) return "bg-emerald-100 text-emerald-800 font-bold border-emerald-200";
    if (val >= warn) return "bg-amber-100 text-amber-800 font-bold border-amber-200";
    return "bg-rose-100 text-rose-800 font-bold border-rose-200";
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Header Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar Care Manager por nombre o rol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        {/* Benchmarking Select */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-semibold">Modo Comparativo:</span>
          <select
            value={benchmarkMode}
            onChange={(e) => setBenchmarkMode(e.target.value as any)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium"
          >
            <option value="none">Sin Comparativo Extra</option>
            <option value="team_avg">VS Promedio del Equipo</option>
            <option value="target">VS Metas del Programa</option>
            <option value="mom">VS Mes Anterior (Junio)</option>
          </select>
        </div>

        {/* Columns Picker Toggle */}
        <button
          onClick={() => setShowColumnPicker(!showColumnPicker)}
          className="px-3 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl font-bold text-slate-700 flex items-center gap-1.5"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Columnas ({Object.values(visibleCols).filter(Boolean).length})</span>
        </button>

        {/* Export Button */}
        <button className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs">
          <Download className="w-4 h-4" />
          <span>Exportar Tabla Excel</span>
        </button>
      </div>

      {/* Column Visibility Picker Drawer */}
      {showColumnPicker && (
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs space-y-2">
          <div className="font-bold text-slate-900 mb-2">Seleccione las Columnas a Visualizar:</div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {Object.keys(visibleCols).map((colKey) => (
              <label key={colKey} className="flex items-center gap-1.5 cursor-pointer bg-white p-2 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  checked={visibleCols[colKey]}
                  onChange={(e) => setVisibleCols({ ...visibleCols, [colKey]: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600"
                />
                <span className="text-slate-800 font-semibold text-[11px] capitalize">{colKey}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Main Care Manager Rows Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-900 text-white font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              {visibleCols.cm && (
                <th className="p-3 cursor-pointer sticky left-0 bg-slate-900 z-10" onClick={() => handleSort("cm")}>
                  <div className="flex items-center gap-1">Care Manager <ArrowUpDown className="w-3 h-3" /></div>
                </th>
              )}
              {visibleCols.supervisor && <th className="p-3">Supervisor</th>}
              {visibleCols.uniqueActive && (
                <th className="p-3 text-right cursor-pointer" onClick={() => handleSort("uniqueActive")}>
                  Active Pts
                </th>
              )}
              {visibleCols.uniqueBillable && (
                <th className="p-3 text-right cursor-pointer" onClick={() => handleSort("uniqueBillable")}>
                  Billable Pts
                </th>
              )}
              {visibleCols.ccmTotal && <th className="p-3 text-right">CCM Total</th>}
              {visibleCols.ccmBillable && <th className="p-3 text-right">CCM Billable</th>}
              {visibleCols.ccmRate && (
                <th className="p-3 text-right cursor-pointer" onClick={() => handleSort("ccmRate")}>
                  CCM Rate
                </th>
              )}
              {visibleCols.ccm2nd && <th className="p-3 text-right">CCM 2nd Int</th>}
              {visibleCols.rpmTotal && <th className="p-3 text-right">RPM Total</th>}
              {visibleCols.rpmBillable && <th className="p-3 text-right">RPM Billable</th>}
              {visibleCols.rpmRate && (
                <th className="p-3 text-right cursor-pointer" onClick={() => handleSort("rpmRate")}>
                  RPM Rate
                </th>
              )}
              {visibleCols.rpm16Days && <th className="p-3 text-right">RPM 16-Day</th>}
              {visibleCols.rpm16Rate && <th className="p-3 text-right">RPM 16 Rate</th>}
              {visibleCols.docHours && <th className="p-3 text-right">Doc Hours</th>}
              {visibleCols.adjDocHours && <th className="p-3 text-right">Adj Doc Hours</th>}
              {visibleCols.utilization && (
                <th className="p-3 text-right cursor-pointer" onClick={() => handleSort("utilization")}>
                  Utilization
                </th>
              )}
              {visibleCols.finalPayroll && <th className="p-3 text-right font-bold">Final Payroll</th>}
              {visibleCols.directRevenue && <th className="p-3 text-right">Direct Revenue</th>}
              {visibleCols.totalRevenue && <th className="p-3 text-right">Total Attributed</th>}
              {visibleCols.payrollRatio && <th className="p-3 text-right">Payroll Ratio</th>}
              {visibleCols.perfScore && <th className="p-3 text-center">Perf Score</th>}
              {visibleCols.qualityScore && <th className="p-3 text-center">Quality Score</th>}
              {visibleCols.payrollStatus && <th className="p-3 text-center">Estado Payroll</th>}
              <th className="p-3 text-center">Acción</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredRows.map((row) => {
              return (
                <tr key={row.cm.id} className="hover:bg-slate-50 transition-colors">
                  {visibleCols.cm && (
                    <td
                      onClick={() => onSelectCareManager(row.cm)}
                      className="p-3 font-bold text-slate-900 sticky left-0 bg-white hover:text-indigo-600 cursor-pointer flex items-center gap-2"
                    >
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                        {row.cm.name.substring(0, 2)}
                      </div>
                      <span>{row.cm.name}</span>
                    </td>
                  )}

                  {visibleCols.supervisor && <td className="p-3 text-slate-500 text-[11px]">{row.supervisor}</td>}

                  {visibleCols.uniqueActive && (
                    <td className="p-3 text-right font-bold text-slate-900">{row.uniqueActive}</td>
                  )}

                  {visibleCols.uniqueBillable && (
                    <td className="p-3 text-right font-bold text-emerald-700">{row.uniqueBillable}</td>
                  )}

                  {visibleCols.ccmTotal && <td className="p-3 text-right text-slate-600">{row.ccmTotal}</td>}
                  {visibleCols.ccmBillable && <td className="p-3 text-right text-slate-900 font-semibold">{row.ccmBillable}</td>}

                  {visibleCols.ccmRate && (
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded border text-[11px] ${getBadgeColor(row.ccmRate, 85, 75)}`}>
                        {row.ccmRate.toFixed(1)}%
                      </span>
                    </td>
                  )}

                  {visibleCols.ccm2nd && <td className="p-3 text-right text-slate-600">{row.ccm2nd}</td>}

                  {visibleCols.rpmTotal && <td className="p-3 text-right text-slate-600">{row.rpmTotal}</td>}
                  {visibleCols.rpmBillable && <td className="p-3 text-right text-slate-900 font-semibold">{row.rpmBillable}</td>}

                  {visibleCols.rpmRate && (
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded border text-[11px] ${getBadgeColor(row.rpmRate, 80, 70)}`}>
                        {row.rpmRate.toFixed(1)}%
                      </span>
                    </td>
                  )}

                  {visibleCols.rpm16Days && <td className="p-3 text-right text-slate-600">{row.rpm16Days}</td>}

                  {visibleCols.rpm16Rate && (
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded border text-[11px] ${getBadgeColor(row.rpm16Rate, 75, 60)}`}>
                        {row.rpm16Rate.toFixed(1)}%
                      </span>
                    </td>
                  )}

                  {visibleCols.docHours && <td className="p-3 text-right font-mono text-slate-700">{row.docHours}h</td>}
                  {visibleCols.adjDocHours && <td className="p-3 text-right font-mono text-indigo-700 font-bold">{row.adjDocHours}h</td>}

                  {visibleCols.utilization && (
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded border text-[11px] ${getBadgeColor(row.utilization, 85, 75)}`}>
                        {row.utilization}%
                      </span>
                    </td>
                  )}

                  {visibleCols.finalPayroll && (
                    <td className="p-3 text-right font-bold text-slate-900 font-mono">
                      ${row.finalPayroll.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  )}

                  {visibleCols.directRevenue && (
                    <td className="p-3 text-right font-mono text-slate-700">
                      ${row.directRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  )}

                  {visibleCols.totalRevenue && (
                    <td className="p-3 text-right font-mono text-emerald-800 font-bold">
                      ${row.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  )}

                  {visibleCols.payrollRatio && (
                    <td className="p-3 text-right font-mono text-slate-700">{row.payrollRatio.toFixed(1)}%</td>
                  )}

                  {visibleCols.perfScore && (
                    <td className="p-3 text-center">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        {row.perfScore}
                      </span>
                    </td>
                  )}

                  {visibleCols.qualityScore && (
                    <td className="p-3 text-center">
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                        {row.qualityScore}%
                      </span>
                    </td>
                  )}

                  {visibleCols.payrollStatus && (
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        {row.payrollStatus}
                      </span>
                    </td>
                  )}

                  <td className="p-3 text-center">
                    <button
                      onClick={() => onSelectCareManager(row.cm)}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[11px] shadow-xs"
                    >
                      Scorecard
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
