import React, { useState } from "react";
import { Download, FileSpreadsheet, FileText, ShieldCheck } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { apiFetch } from "../../lib/apiClient";
import { useAuth } from "../../context/AuthContext";
import { roleHasPermission } from "../../../shared/authorization";

const REPORTS = [
  { id: "executive.pdf", label: "Resumen ejecutivo PDF", icon: FileText },
  { id: "patients.xlsx", label: "Registros autorizados Excel", icon: FileSpreadsheet },
  { id: "patients.csv", label: "Registros autorizados CSV", icon: FileSpreadsheet },
] as const;

export const ReportsCenter: React.FC = () => {
  const { globalFilters } = useApp();
  const { claims } = useAuth();
  const [report, setReport] = useState<(typeof REPORTS)[number]["id"]>("executive.pdf");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const availableReports = claims && roleHasPermission(claims.role, "patient:view") ? REPORTS : REPORTS.filter((item) => item.id === "executive.pdf");

  const download = async () => {
    setBusy(true);
    setError(null);
    try {
      const month = encodeURIComponent(globalFilters.monthOf);
      const response = await apiFetch(`/api/reports/${report}?monthOf=${month}`);
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
      setError("El reporte no pudo generarse o no está autorizado para su rol y scope.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-6 pb-12 text-sm text-slate-700">
      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 text-emerald-700"><ShieldCheck className="w-5 h-5" /><span className="font-bold">Generación segura en backend</span></div>
        <h1 className="mt-2 text-xl font-black text-slate-900">Centro de reportes autorizados</h1>
        <p className="mt-1 text-slate-500">Los datos se filtran por rol y tenant; la descarga queda registrada en auditoría.</p>
      </header>
      <div className="grid gap-3 md:grid-cols-3">
        {availableReports.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setReport(id)} className={`rounded-2xl border p-5 text-left ${report === id ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white"}`}>
            <Icon className="mb-3 w-5 h-5 text-indigo-600" /><span className="font-bold">{label}</span>
          </button>
        ))}
      </div>
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800">{error}</p>}
      <button disabled={busy} onClick={() => void download()} className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white disabled:opacity-50 flex items-center gap-2">
        <Download className="w-4 h-4" /> {busy ? "Generando…" : "Generar y descargar"}
      </button>
    </section>
  );
};
