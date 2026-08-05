import React, { useMemo, useState } from "react";
import { Download, FileSpreadsheet, FileText, ShieldCheck, UsersRound } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { apiFetch } from "../../lib/apiClient";
import { useAuth } from "../../context/AuthContext";
import { roleHasPermission } from "../../../shared/authorization";

type ReportDefinition = {
  id: "executive.pdf" | "care-managers.pdf" | "master.xlsx" | "patients.csv";
  label: string;
  description: string;
  icon: typeof FileText;
  accent: "indigo" | "violet" | "emerald" | "sky";
  requiresPatient?: boolean;
  requiresPerformance?: boolean;
  requiresPayroll?: boolean;
};

const REPORTS: ReportDefinition[] = [
  {
    id: "executive.pdf",
    label: "Reporte Ejecutivo PDF",
    description: "Consolidado con KPIs globales, volumen por servicio y métricas clave de payroll.",
    icon: FileText,
    accent: "indigo",
  },
  {
    id: "care-managers.pdf",
    label: "Scorecards Care Managers PDF",
    description: "Evaluación de desempeño, pacientes gestionados y bonificaciones por Care Manager.",
    icon: UsersRound,
    accent: "violet",
    requiresPerformance: true,
    requiresPayroll: true,
  },
  {
    id: "master.xlsx",
    label: "Excel Libro Master Multi-Pestaña",
    description: "Archivo XLSX consolidado con pestañas separadas de Pacientes, Payroll y Reglas.",
    icon: FileSpreadsheet,
    accent: "emerald",
    requiresPatient: true,
    requiresPayroll: true,
  },
  {
    id: "patients.csv",
    label: "Archivo Tabular CSV",
    description: "Registros autorizados del período, listos para conciliación y análisis tabular.",
    icon: FileSpreadsheet,
    accent: "sky",
    requiresPatient: true,
  },
];

const selectedStyles: Record<ReportDefinition["accent"], string> = {
  indigo: "border-indigo-500 bg-indigo-50/80 ring-2 ring-indigo-100",
  violet: "border-violet-500 bg-violet-50/80 ring-2 ring-violet-100",
  emerald: "border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-100",
  sky: "border-sky-500 bg-sky-50/80 ring-2 ring-sky-100",
};

const iconStyles: Record<ReportDefinition["accent"], string> = {
  indigo: "text-indigo-600",
  violet: "text-violet-600",
  emerald: "text-emerald-600",
  sky: "text-sky-600",
};

export const ReportsCenter: React.FC = () => {
  const { globalFilters } = useApp();
  const { claims } = useAuth();
  const availableReports = useMemo(() => REPORTS.filter((item) => {
    if (!claims) return false;
    if (item.requiresPatient && !roleHasPermission(claims.role, "patient:view")) return false;
    if (item.requiresPerformance && !roleHasPermission(claims.role, "performance:view")) return false;
    if (item.requiresPayroll && !roleHasPermission(claims.role, "payroll:view")) return false;
    return true;
  }), [claims]);
  const [report, setReport] = useState<ReportDefinition["id"]>("executive.pdf");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedReport = availableReports.find((item) => item.id === report) ?? availableReports[0];

  const download = async () => {
    if (!selectedReport) return;
    setBusy(true);
    setError(null);
    try {
      const month = encodeURIComponent(globalFilters.monthOf);
      const response = await apiFetch(`/api/reports/${selectedReport.id}?monthOf=${month}`);
      if (!response.ok) throw new Error("Report denied");
      const disposition = response.headers.get("Content-Disposition") || "";
      const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || `itera-report-${globalFilters.monthOf}`;
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setError("El reporte no pudo generarse o no está autorizado para su rol y alcance.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-7 pb-12 text-sm text-slate-700">
      <header className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-800">
          Exportación &amp; Reportes Oficiales
        </div>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Centro de Reportes Corporativos (PDF / Excel / CSV)</h1>
        <p className="mt-1 text-slate-500">Generación instantánea de reportes ejecutivos, comprobantes de pago, auditorías de facturación y archivos tabulares.</p>
      </header>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {availableReports.map(({ id, label, description, icon: Icon, accent }) => (
          <button
            key={id}
            type="button"
            onClick={() => { setReport(id); setError(null); }}
            aria-pressed={selectedReport?.id === id}
            className={`min-h-40 rounded-2xl border bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${selectedReport?.id === id ? selectedStyles[accent] : "border-slate-200"}`}
          >
            <Icon className={`mb-4 h-8 w-8 ${iconStyles[accent]}`} strokeWidth={2.2} />
            <span className="block text-base font-black text-slate-950">{label}</span>
            <span className="mt-2 block leading-5 text-slate-500">{description}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="font-bold text-slate-900">Generación segura en backend</p>
            <p className="text-xs text-slate-500">Filtrado por rol y tenant, con registro automático de auditoría.</p>
          </div>
        </div>
        <button disabled={busy || !selectedReport} onClick={() => void download()} className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50">
          <Download className="h-4 w-4" /> {busy ? "Generando…" : `Generar ${selectedReport?.label ?? "reporte"}`}
        </button>
      </div>
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800">{error}</p>}
    </section>
  );
};
