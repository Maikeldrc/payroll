import React, { useState } from "react";
import { FileCheck2, ShieldCheck, Upload } from "lucide-react";
import { apiFetch } from "../../lib/apiClient";

export const ImportWizard: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await apiFetch("/api/imports", {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: form,
      });
      const result = await response.json() as { rowsImported?: number; error?: string };
      if (!response.ok) throw new Error(result.error || "upload_failed");
      setFile(null);
      setMessage(`${result.rowsImported || 0} registros fueron importados y auditados por el backend.`);
      onComplete?.();
    } catch {
      setError("Archivo rechazado. Verifique formato, malware scan, columnas, duplicados y tenant scope.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
      <div className="flex items-center gap-2 text-indigo-700"><ShieldCheck className="w-5 h-5" /><span className="font-bold">Importación protegida por backend</span></div>
      <h1 className="mt-2 text-xl font-black text-slate-900">Importar registros autorizados</h1>
      <p className="mt-1 text-slate-500">Sólo CSV y XLSX de hasta 10 MB. El backend valida firma, malware, schema, duplicados y scope antes de escribir.</p>
      <label className="mt-6 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-slate-300 p-8 hover:border-indigo-400">
        <Upload className="mb-3 h-7 w-7 text-indigo-600" />
        <span className="font-bold">Seleccionar CSV o XLSX</span>
        <input className="sr-only" type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => setFile(event.target.files?.[0] || null)} />
      </label>
      {file && <p className="mt-3 flex items-center gap-2"><FileCheck2 className="w-4 h-4 text-emerald-600" />Archivo seleccionado ({Math.ceil(file.size / 1024)} KB)</p>}
      {message && <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-emerald-800">{message}</p>}
      {error && <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-rose-800">{error}</p>}
      <button disabled={!file || busy || (file?.size || 0) > 10 * 1024 * 1024} onClick={() => void upload()} className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white disabled:opacity-50">
        {busy ? "Validando…" : "Validar e importar"}
      </button>
    </section>
  );
};
