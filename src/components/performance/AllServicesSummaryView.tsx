import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  Stethoscope,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  AlertCircle,
  ChevronRight,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { ServiceConfigDefinition, ExtendedCPTCode } from "../../data/serviceCatalogRegistry";
import { MonthlyManagementRecord } from "../../types";

interface AllServicesSummaryViewProps {
  serviceConfigs: ServiceConfigDefinition[];
  records: MonthlyManagementRecord[];
  cptRegistry: ExtendedCPTCode[];
  onSelectService: (serviceCode: string) => void;
  onDrillDown: (title: string, filteredRecords: MonthlyManagementRecord[]) => void;
}

export const AllServicesSummaryView: React.FC<AllServicesSummaryViewProps> = ({
  serviceConfigs,
  records,
  cptRegistry,
  onSelectService,
  onDrillDown,
}) => {
  const activeConfigs = serviceConfigs.filter((s) => s.active);

  // Compute unique patients across records
  const uniqueMrns = new Set(records.map((r) => r.mrn));
  const totalUniquePatients = uniqueMrns.size;

  // Global metrics across all services
  const totalServiceAssignments = records.length;
  const billableRecords = records.filter((r) => r.monthlyBilling > 0 || r.payrollStatus === "Included");
  const totalBillable = billableRecords.length;
  const overallBillableRate = totalServiceAssignments > 0 ? (totalBillable / totalServiceAssignments) * 100 : 0;
  const totalRevenue = records.reduce((sum, r) => sum + (r.monthlyBilling || 0), 0);

  // Service-by-service comparative data
  const serviceSummaryData = activeConfigs.map((sc) => {
    const sRecords = records.filter(
      (r) => r.serviceCode === sc.code || r.codes?.some((c) => sc.applicableCPTCodes.includes(c))
    );

    const sUniquePatients = new Set(sRecords.map((r) => r.mrn)).size;
    const sBillableRecords = sRecords.filter((r) => r.monthlyBilling > 0 || r.payrollStatus === "Included");
    const sBillableCount = sBillableRecords.length;
    const sBillableRate = sRecords.length > 0 ? (sBillableCount / sRecords.length) * 100 : 0;
    const sRevenue = sRecords.reduce((sum, r) => sum + (r.monthlyBilling || 0), 0);
    const sAvgBilling = sBillableCount > 0 ? sRevenue / sBillableCount : 0;
    const sDocEntries = sRecords.reduce((sum, r) => sum + (r.logEntries || 0), 0);
    const sErrorCount = sRecords.reduce((sum, r) => sum + r.validationErrors.length, 0);

    return {
      code: sc.code,
      name: sc.name,
      totalCount: sRecords.length,
      uniqueCount: sUniquePatients,
      billableCount: sBillableCount,
      billableRate: sBillableRate,
      targetRate: sc.targetBillableRate,
      primaryCPT: sc.primaryCPT,
      revenue: sRevenue,
      avgBilling: sAvgBilling,
      docEntries: sDocEntries,
      errorCount: sErrorCount,
      records: sRecords,
      color: sc.colorTheme === "indigo" ? "#4f46e5" : sc.colorTheme === "blue" ? "#2563eb" : sc.colorTheme === "teal" ? "#0d9488" : sc.colorTheme === "amber" ? "#d97706" : sc.colorTheme === "purple" ? "#7c3aed" : sc.colorTheme === "emerald" ? "#059669" : "#0891b2",
    };
  });

  const chartColors = ["#4f46e5", "#2563eb", "#0d9488", "#d97706", "#7c3aed", "#059669", "#0891b2", "#e11d48"];

  return (
    <div className="space-y-8">
      {/* Consolidated High-Level Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Asignaciones de Servicio</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-3xl font-black text-slate-900 block">{totalServiceAssignments}</span>
          <span className="text-xs text-slate-500 mt-1 block">
            En {activeConfigs.length} programas activos
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pacientes Únicos</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <span className="text-3xl font-black text-slate-900 block">{totalUniquePatients}</span>
          <span className="text-xs text-teal-700 font-semibold mt-1 block">
            Sin duplicidad multi-servicio
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Facturables</span>
            <Stethoscope className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-3xl font-black text-emerald-950 block">{totalBillable}</span>
          <span className="text-xs text-emerald-700 font-semibold mt-1 block">
            {overallBillableRate.toFixed(1)}% tasa facturable red
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Revenue Red Total</span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-3xl font-black text-slate-900 block">
            ${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
          <span className="text-xs text-indigo-700 font-semibold mt-1 block">
            Facturación combinada red
          </span>
        </div>

        <div className="bg-indigo-900 text-white p-5 rounded-2xl border border-indigo-800 shadow-md">
          <div className="flex items-center justify-between text-indigo-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Calidad de Datos Red</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-3xl font-black text-amber-300 block">
            {records.reduce((acc, r) => acc + r.validationErrors.length, 0)} hallazgos
          </span>
          <span className="text-xs text-indigo-200 mt-1 block">
            Alertas de auditoría detectadas
          </span>
        </div>
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patients & Billables by Service */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Volumen de Pacientes por Servicio (Total vs Facturables)
              </h3>
              <p className="text-xs text-slate-500">Comparativa directa entre inscritos y facturables cumplimentados.</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceSummaryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="code" tick={{ fontSize: 12, fontWeight: 700 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="totalCount" name="Total Pacientes" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="billableCount" name="Pacientes Facturables" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Service */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-emerald-600" />
                Distribución de Revenue por Servicio ($)
              </h3>
              <p className="text-xs text-slate-500">Aporte financiero relativo por cada programa clínico.</p>
            </div>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceSummaryData}
                  dataKey="revenue"
                  nameKey="code"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {serviceSummaryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Comparative Services Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Matriz Comparativa de Desempeño Multiprograma</h3>
            <p className="text-xs text-slate-500">
              Desglose unificado por programa. Haga clic en cualquier fila para enfocar el panel detallado del servicio.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-y border-slate-200">
              <tr>
                <th className="p-3">Servicio</th>
                <th className="p-3 text-right">Total Pacientes / Epis.</th>
                <th className="p-3 text-right">Pacientes Únicos</th>
                <th className="p-3 text-right">Facturables</th>
                <th className="p-3 text-right">Tasa Facturable (%)</th>
                <th className="p-3 text-center">CPT Principal</th>
                <th className="p-3 text-right">Ingreso Generado</th>
                <th className="p-3 text-right">Rev / Paciente</th>
                <th className="p-3 text-center">Hallazgos Calidad</th>
                <th className="p-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {serviceSummaryData.map((s) => (
                <tr
                  key={s.code}
                  onClick={() => onSelectService(s.code)}
                  className="hover:bg-indigo-50/50 cursor-pointer transition-colors group"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 bg-slate-900 text-white font-bold text-xs rounded-lg flex items-center justify-center">
                        {s.code}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {s.name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900">{s.totalCount}</td>
                  <td className="p-3 text-right text-slate-600">{s.uniqueCount}</td>
                  <td className="p-3 text-right font-bold text-emerald-700">{s.billableCount}</td>
                  <td className="p-3 text-right font-black">
                    <span
                      className={`px-2 py-0.5 rounded-md ${
                        s.billableRate >= s.targetRate
                          ? "bg-emerald-100 text-emerald-800"
                          : s.billableRate >= 50
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {s.billableRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-indigo-700">{s.primaryCPT}</td>
                  <td className="p-3 text-right font-black text-slate-900">
                    ${s.revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right text-slate-700">${s.avgBilling.toFixed(2)}</td>
                  <td className="p-3 text-center">
                    {s.errorCount > 0 ? (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded-full text-[10px]">
                        {s.errorCount} errores
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                        Limpio
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <button className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors flex items-center justify-center mx-auto">
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
