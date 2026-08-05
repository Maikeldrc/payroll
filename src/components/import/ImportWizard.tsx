import React, { useMemo, useState } from "react";
import { CheckCircle2, FileCheck2, ShieldCheck, Upload } from "lucide-react";
import { apiFetch } from "../../lib/apiClient";

interface Analysis {
  reportingPeriod: string;
  sourceFileName: string;
  totalRows: number;
  validRows: number;
  warningRows: number;
  rejectedRows: number;
  uniquePatientCandidates: number;
  columnsDetected: string[];
  codeColumnsDetected: string[];
  codesDetected: string[];
  monthOf: { Match: number; Missing: number; Mismatch: number; Invalid: number };
  preview: Array<{ sourceRowNumber: number; provider: string; careManager: string; service: string; status: string; findingTypes: string[] }>;
}

const steps = ["Período", "Archivo", "Análisis", "Calidad", "Confirmación", "Resultado"];

export const ImportWizard: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analysisToken, setAnalysisToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ rowsImported: number; exactDuplicates: number; reviewRows: number; importBatchId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentStep = result ? 6 : analysis ? 5 : file ? 2 : 1;
  const years = useMemo(() => Array.from({ length: 7 }, (_, index) => today.getFullYear() - 3 + index), [today]);

  const formForFile = () => {
    const form = new FormData();
    form.set("month", String(month));
    form.set("year", String(year));
    if (file) form.set("file", file);
    return form;
  };

  const analyze = async () => {
    if (!file) return;
    setBusy(true); setError(null); setResult(null);
    try {
      const response = await apiFetch("/api/imports/analyze", { method: "POST", body: formForFile() });
      const body = await response.json() as { analysis?: Analysis; analysisToken?: string; error?: string };
      if (!response.ok || !body.analysis || !body.analysisToken) throw new Error(body.error || "analysis_failed");
      setAnalysis(body.analysis); setAnalysisToken(body.analysisToken);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "analysis_failed");
    } finally { setBusy(false); }
  };

  const confirm = async () => {
    if (!file || !analysisToken) return;
    setBusy(true); setError(null);
    try {
      const form = formForFile();
      form.set("analysisToken", analysisToken);
      const response = await apiFetch("/api/imports/confirm", { method: "POST", headers: { "Idempotency-Key": crypto.randomUUID() }, body: form });
      const body = await response.json() as { rowsImported?: number; exactDuplicates?: number; reviewRows?: number; importBatchId?: string; error?: string };
      if (!response.ok || !body.importBatchId) throw new Error(body.error || "import_failed");
      setResult({ rowsImported: body.rowsImported || 0, exactDuplicates: body.exactDuplicates || 0, reviewRows: body.reviewRows || 0, importBatchId: body.importBatchId });
      onComplete?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "import_failed");
    } finally { setBusy(false); }
  };

  const selectNewFile = (next: File | null) => { setFile(next); setAnalysis(null); setAnalysisToken(""); setResult(null); setError(null); };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
      <div className="flex items-center gap-2 text-indigo-700"><ShieldCheck className="h-5 w-5" /><span className="font-bold">Importación mensual protegida</span></div>
      <h1 className="mt-2 text-xl font-black text-slate-900">Cargar registros del período</h1>
      <p className="mt-1 text-slate-500">Seleccione únicamente mes, año y archivo. CSV/XLSX, máximo 10 MB.</p>

      <ol className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-6" aria-label="Progreso de importación">
        {steps.map((label, index) => <li key={label} className={`rounded-lg px-2 py-2 text-center text-xs font-bold ${index + 1 <= currentStep ? "bg-indigo-50 text-indigo-700" : "bg-slate-50 text-slate-400"}`}>{index + 1}. {label}</li>)}
      </ol>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="font-bold text-slate-700">Mes
          <select value={month} onChange={(event) => { setMonth(Number(event.target.value)); selectNewFile(file); }} className="mt-1 block w-full rounded-xl border border-slate-300 p-3 font-normal">
            {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Intl.DateTimeFormat("es", { month: "long" }).format(new Date(2024, index, 1))}</option>)}
          </select>
        </label>
        <label className="font-bold text-slate-700">Año
          <select value={year} onChange={(event) => { setYear(Number(event.target.value)); selectNewFile(file); }} className="mt-1 block w-full rounded-xl border border-slate-300 p-3 font-normal">
            {years.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>

      <label className="mt-5 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-slate-300 p-7 hover:border-indigo-400">
        <Upload className="mb-2 h-7 w-7 text-indigo-600" /><span className="font-bold">Seleccionar CSV o XLSX</span>
        <input className="sr-only" type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => selectNewFile(event.target.files?.[0] || null)} />
      </label>
      {file && <p className="mt-3 flex items-center gap-2"><FileCheck2 className="h-4 w-4 text-emerald-600" />{file.name} ({Math.ceil(file.size / 1024)} KB)</p>}

      {analysis && <div className="mt-5 rounded-2xl border border-slate-200 p-4">
        <h2 className="font-black text-slate-900">Análisis de {analysis.reportingPeriod}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
          {[['Filas', analysis.totalRows], ['Válidas', analysis.validRows], ['Advertencias', analysis.warningRows], ['Rechazadas', analysis.rejectedRows], ['Pacientes candidatos', analysis.uniquePatientCandidates]].map(([label, count]) => <div key={String(label)} className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">{label}</div><div className="text-lg font-black">{count}</div></div>)}
        </div>
        <p className="mt-3 text-xs text-slate-500">Month Of: {analysis.monthOf.Match} coincide · {analysis.monthOf.Missing} ausente · {analysis.monthOf.Mismatch} distinto · {analysis.monthOf.Invalid} inválido</p>
        <p className="mt-1 text-xs text-slate-500">Columnas de código: {analysis.codeColumnsDetected.join(", ") || "ninguna"}. Códigos distintos: {analysis.codesDetected.length}.</p>
        {(analysis.rejectedRows > 0 || analysis.warningRows > 0) && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-amber-900">Las filas rechazadas o en revisión se conservan para trazabilidad, pero no se incluyen automáticamente en payroll.</p>}
      </div>}

      {result && <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-emerald-900"><p className="flex items-center gap-2 font-black"><CheckCircle2 className="h-5 w-5" />Importación completada</p><p className="mt-1">{result.rowsImported} filas escritas, {result.exactDuplicates} duplicados exactos omitidos y {result.reviewRows} filas para revisión. Lote: {result.importBatchId}</p></div>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-rose-800">Operación rechazada: {error}</p>}
      {!analysis && !result && <button disabled={!file || busy || (file?.size || 0) > 10 * 1024 * 1024} onClick={() => void analyze()} className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? "Analizando…" : "Analizar archivo"}</button>}
      {analysis && !result && <button disabled={busy} onClick={() => void confirm()} className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? "Importando…" : "Confirmar importación"}</button>}
    </section>
  );
};
