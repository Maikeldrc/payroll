import React, { useMemo } from "react";
import {
  Users,
  DollarSign,
  TrendingUp,
  Award,
  ShieldAlert,
  PhoneCall,
  Activity,
  UserCheck,
  Building2,
  Stethoscope,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  FileText,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { useApp } from "../../context/AppContext";

interface ExecutiveDashboardProps {
  onOpenPatient: (record: any) => void;
  onOpenCareManager: (cm: any) => void;
  onNavigateTab: (tab: any) => void;
}

const COLORS = ["#4f46e5", "#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#6366f1"];

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onOpenPatient,
  onOpenCareManager,
  onNavigateTab,
}) => {
  const { records, payrollCalculations, careManagers, providers, practices, globalFilters } = useApp();

  const activeMonth = globalFilters.monthOf || "2026-07";

  // Filter records based on global filter
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (globalFilters.monthOf && r.monthOf !== globalFilters.monthOf) return false;
      if (globalFilters.practiceId !== "ALL" && r.practiceId !== globalFilters.practiceId) return false;
      if (globalFilters.providerId !== "ALL" && r.providerId !== globalFilters.providerId) return false;
      if (globalFilters.careManagerId !== "ALL" && r.careManagerId !== globalFilters.careManagerId) return false;
      if (globalFilters.serviceCode !== "ALL" && r.serviceCode !== globalFilters.serviceCode) return false;
      if (globalFilters.eligibility !== "ALL" && r.eligibility !== globalFilters.eligibility) return false;
      if (globalFilters.hmo !== "ALL" && r.hmo !== globalFilters.hmo) return false;
      if (globalFilters.payrollStatus !== "ALL" && r.payrollStatus !== globalFilters.payrollStatus) return false;
      return true;
    });
  }, [records, globalFilters]);

  // Executive KPI Calculations
  const totalPatientsManaged = filteredRecords.length;
  const uniquePatientsCount = useMemo(() => new Set(filteredRecords.map((r) => r.mrn)).size, [filteredRecords]);
  const activeCMCount = useMemo(() => new Set(filteredRecords.map((r) => r.careManagerId)).size, [filteredRecords]);
  const totalBilling = useMemo(() => filteredRecords.reduce((acc, r) => acc + r.monthlyBilling, 0), [filteredRecords]);

  const monthPayrolls = payrollCalculations.filter((c) => c.monthOf === activeMonth);
  const estimatedPayroll = useMemo(() => monthPayrolls.reduce((acc, c) => acc + c.netPay, 0), [monthPayrolls]);
  const billingToPayrollRatio = estimatedPayroll > 0 ? (totalBilling / estimatedPayroll).toFixed(2) : "0.00";

  const eligiblePatientsCount = useMemo(() => filteredRecords.filter((r) => r.eligibility === "Eligible").length, [filteredRecords]);
  const interactiveCommCount = useMemo(() => filteredRecords.filter((r) => r.latestInteractiveCommunication).length, [filteredRecords]);
  const interactiveRate = totalPatientsManaged > 0 ? ((interactiveCommCount / totalPatientsManaged) * 100).toFixed(1) : "0.0";

  const totalLogs = useMemo(() => filteredRecords.reduce((acc, r) => acc + r.logEntries, 0), [filteredRecords]);
  const avgLogs = totalPatientsManaged > 0 ? (totalLogs / totalPatientsManaged).toFixed(1) : "0.0";

  const dataQualityScore = useMemo(() => {
    if (filteredRecords.length === 0) return 100;
    const totalScore = filteredRecords.reduce((acc, r) => acc + r.qualityScore, 0);
    return Math.round(totalScore / filteredRecords.length);
  }, [filteredRecords]);

  // Visualizations Data
  // 1. CM Performance (Billing vs Payroll vs Patients)
  const cmChartData = useMemo(() => {
    return careManagers.map((cm) => {
      const cmRecs = filteredRecords.filter((r) => r.careManagerId === cm.id);
      const billing = cmRecs.reduce((acc, r) => acc + r.monthlyBilling, 0);
      const calc = monthPayrolls.find((c) => c.careManagerId === cm.id);
      return {
        name: cm.name.split(",")[0],
        cmObj: cm,
        patients: cmRecs.length,
        billing: Math.round(billing),
        payroll: calc ? Math.round(calc.netPay) : 0,
      };
    });
  }, [careManagers, filteredRecords, monthPayrolls]);

  // 2. Service Distribution
  const serviceChartData = useMemo(() => {
    const map: Record<string, { count: number; billing: number }> = {};
    filteredRecords.forEach((r) => {
      if (!map[r.serviceCode]) map[r.serviceCode] = { count: 0, billing: 0 };
      map[r.serviceCode].count += 1;
      map[r.serviceCode].billing += r.monthlyBilling;
    });
    return Object.keys(map).map((srv) => ({
      name: srv,
      count: map[srv].count,
      billing: Math.round(map[srv].billing),
    }));
  }, [filteredRecords]);

  // 3. Monthly Trend (June, July, August 2026)
  const monthlyTrendData = useMemo(() => {
    const months = ["2026-06", "2026-07", "2026-08"];
    return months.map((m) => {
      const recs = records.filter((r) => r.monthOf === m);
      const bill = recs.reduce((acc, r) => acc + r.monthlyBilling, 0);
      const pay = payrollCalculations.filter((c) => c.monthOf === m).reduce((acc, c) => acc + c.netPay, 0);
      return {
        month: m === "2026-06" ? "Junio" : m === "2026-07" ? "Julio" : "Agosto",
        pacientes: recs.length,
        billing: Math.round(bill),
        payroll: Math.round(pay),
      };
    });
  }, [records, payrollCalculations]);

  // 4. Eligibility & Insurance Breakdown
  const eligibilityPieData = useMemo(() => {
    const eligible = filteredRecords.filter((r) => r.eligibility === "Eligible").length;
    const ineligible = filteredRecords.filter((r) => r.eligibility === "Ineligible").length;
    const pending = filteredRecords.filter((r) => r.eligibility === "Pending").length;
    return [
      { name: "Eligible", value: eligible, color: "#10b981" },
      { name: "Ineligible", value: ineligible, color: "#f43f5e" },
      { name: "Pending", value: pending, color: "#f59e0b" },
    ];
  }, [filteredRecords]);

  // 5. CPT Distribution
  const cptChartData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      r.codes.forEach((c) => {
        if (c) map[c] = (map[c] || 0) + 1;
      });
    });
    return Object.keys(map)
      .map((cpt) => ({ cpt, count: map[cpt] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [filteredRecords]);

  // Top Flagged Error Records for quick review
  const flaggedRecords = useMemo(() => {
    return filteredRecords
      .filter((r) => r.validationErrors.length > 0 || r.payrollStatus === "Pending Review")
      .slice(0, 5);
  }, [filteredRecords]);

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome & Section Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold uppercase tracking-wider">
              Cuadro de Mando Ejecutivo
            </span>
            <span className="text-xs text-slate-400">Periodo: {activeMonth}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">
            ITERA Care Management Analytics & Payroll Hub
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Consolidación de indicadores operativos, volumen de pacientes, productividad de Care Managers, auditoría de calidad de datos y análisis del payroll mensual.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab("payroll")}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all"
          >
            <DollarSign className="w-4 h-4" />
            <span>Ver Centro de Payroll</span>
          </button>
          <button
            onClick={() => onNavigateTab("quality")}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Auditoría Calidad</span>
          </button>
        </div>
      </div>

      {/* 10 Executive KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* KPI 1: Patients Managed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pacientes Gestionados</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {totalPatientsManaged}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            <strong className="text-slate-800">{uniquePatientsCount}</strong> pacientes únicos
          </p>
        </div>

        {/* KPI 2: Active Care Managers */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Care Managers Activos</span>
            <UserCheck className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {activeCMCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Promedio: <strong className="text-slate-800">{activeCMCount > 0 ? (totalPatientsManaged / activeCMCount).toFixed(0) : 0}</strong> pac/CM
          </p>
        </div>

        {/* KPI 3: Total Monthly Billing */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Facturación Mensual</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            ${totalBilling.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Prom: <strong className="text-slate-800">${totalPatientsManaged > 0 ? (totalBilling / totalPatientsManaged).toFixed(0) : 0}</strong> / paciente
          </p>
        </div>

        {/* KPI 4: Estimated Payroll */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Payroll Estimado</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700 mt-2">
            ${estimatedPayroll.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Ratio Billing/Payroll: <strong className="text-slate-900">{billingToPayrollRatio}x</strong>
          </p>
        </div>

        {/* KPI 5: Interactive Communication Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Com. Interactiva</span>
            <PhoneCall className="w-4 h-4 text-indigo-600" />
          </div>
          <div className={`text-2xl font-black mt-2 ${Number(interactiveRate) >= 80 ? "text-emerald-700" : "text-amber-600"}`}>
            {interactiveRate}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            <strong className="text-slate-800">{interactiveCommCount}</strong> de {totalPatientsManaged} con contacto
          </p>
        </div>

        {/* KPI 6: Average Log Entries */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Promedio Log Entries</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {avgLogs} <span className="text-xs font-normal text-slate-500">logs/pac</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Total: <strong className="text-slate-800">{totalLogs}</strong> actividades
          </p>
        </div>

        {/* KPI 7: Data Quality Score */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Data Quality Score</span>
            <ShieldAlert className="w-4 h-4 text-cyan-600" />
          </div>
          <div className={`text-2xl font-black mt-2 ${dataQualityScore >= 85 ? "text-emerald-700" : "text-amber-600"}`}>
            {dataQualityScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            <strong className="text-slate-800">{filteredRecords.filter((r) => r.validationErrors.length > 0).length}</strong> registros con alertas
          </p>
        </div>

        {/* KPI 8: Eligible Patients */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pacientes Elegibles</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {eligiblePatientsCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Tasa Elegibilidad: <strong className="text-slate-900">{totalPatientsManaged > 0 ? Math.round((eligiblePatientsCount / totalPatientsManaged) * 100) : 0}%</strong>
          </p>
        </div>

        {/* KPI 9: HMO Patients */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pacientes HMO</span>
            <Building2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">
            {filteredRecords.filter((r) => r.hmo === "Yes").length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Requieren verificación previa
          </p>
        </div>

        {/* KPI 10: Multi-Service Patients */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pacientes Multi-Servicio</span>
            <Stethoscope className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {totalPatientsManaged - uniquePatientsCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Combinaciones (e.g. CCM + RPM)
          </p>
        </div>
      </div>

      {/* Main Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Billing vs Payroll per Care Manager Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>Facturación vs Payroll por Care Manager</span>
              </h3>
              <p className="text-xs text-slate-500">Comparativa de ingresos generados vs costo de payroll para el periodo {activeMonth}</p>
            </div>
            <button
              onClick={() => onNavigateTab("care-managers")}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Ver Detalle</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cmChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value: any) => [`$${value.toLocaleString()}`, ""]}
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Bar dataKey="billing" name="Monthly Billing ($)" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="payroll" name="Payroll Calculado ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Eligibility Distribution Pie Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Distribución por Elegibilidad</h3>
          <p className="text-xs text-slate-500 mb-4">Estado de cobertura de seguros</p>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={eligibilityPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {eligibilityPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs font-semibold mt-2">
            {eligibilityPieData.map((e) => (
              <div key={e.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color }}></span>
                <span className="text-slate-700">{e.name}: {e.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Row Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Volumen de Pacientes & Facturación por Servicio</h3>
          <p className="text-xs text-slate-500 mb-4">Análisis de programas (CCM, RPM, PCM, BHI, APCM, etc.)</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceChartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fontWeight: 600 }} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }} />
                <Bar dataKey="count" name="Pacientes" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Multi-Month Trend */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Tendencia Mensual (Junio - Agosto 2026)</h3>
          <p className="text-xs text-slate-500 mb-4">Evolución de billing vs payroll a lo largo del tiempo</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrendData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Line type="monotone" dataKey="billing" name="Monthly Billing ($)" stroke="#4f46e5" strokeWidth={3} dot={{ r: 5 }} />
                <Line type="monotone" dataKey="payroll" name="Payroll ($)" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Flagged Error Records for Executive Action */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Registros que Requieren Revisión o Excepción Documentada</span>
            </h3>
            <p className="text-xs text-slate-500">Muestreo directo de pacientes con observaciones o excluidos del payroll</p>
          </div>
          <button
            onClick={() => onNavigateTab("quality")}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Ir al Centro de Calidad</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-2.5">MRN</th>
                <th className="p-2.5">Paciente</th>
                <th className="p-2.5">Care Manager</th>
                <th className="p-2.5">Servicio</th>
                <th className="p-2.5">Observación / Error</th>
                <th className="p-2.5 text-center">Estado Payroll</th>
                <th className="p-2.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {flaggedRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No hay errores ni observaciones pendientes en este periodo.
                  </td>
                </tr>
              ) : (
                flaggedRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-semibold text-slate-900">{r.mrn}</td>
                    <td className="p-2.5 font-medium text-slate-800">{r.patientName}</td>
                    <td className="p-2.5 text-slate-600">{r.careManagerName}</td>
                    <td className="p-2.5 font-bold text-indigo-600">{r.serviceCode}</td>
                    <td className="p-2.5 text-rose-700 font-medium">
                      {r.validationErrors[0]?.message || r.payrollExclusionReason || "Revisión preventiva"}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.payrollStatus === "Included" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                        {r.payrollStatus}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => onOpenPatient(r)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px]"
                      >
                        Ver Dossier
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
