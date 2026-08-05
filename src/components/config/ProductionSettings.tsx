import React, { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Archive, CheckCircle2, Cloud, Database, HardDrive, Loader2, RefreshCw, Save, Settings2, ShieldCheck, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../lib/apiClient";
import { roleHasPermission } from "../../../shared/authorization";

interface StorageConfiguration {
  sharedDrive: string;
  rootFolder: string;
  monthlyFolder: string;
  masterFolder: string;
  masterSpreadsheet: string;
  serviceAccountStatus: string;
  timeZone: string;
  currency: string;
  monthlySheetNamingConvention: string;
}

interface BackupPolicy {
  mode: "manual" | "automatic";
  frequency: "daily" | "weekly";
  backupBeforeCleanup: true;
  lastBackupAt: string | null;
}

interface BackupItem {
  backupId: string;
  trigger: string;
  status: string;
  createdAt: string;
  fileCount: number;
}

interface BackupPayload { policy: BackupPolicy; backups: BackupItem[] }

const CONFIRMATION = "BORRAR DATOS DE PRUEBA";

export const ProductionSettings: React.FC = () => {
  const { claims } = useAuth();
  const canManage = Boolean(claims && roleHasPermission(claims.role, "configuration:manage"));
  const [configuration, setConfiguration] = useState<StorageConfiguration | null>(null);
  const [backups, setBackups] = useState<BackupPayload | null>(null);
  const [mode, setMode] = useState<BackupPolicy["mode"]>("manual");
  const [frequency, setFrequency] = useState<BackupPolicy["frequency"]>("daily");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBusy("load");
    setError(null);
    try {
      const [configurationResponse, backupResponse] = await Promise.all([
        apiFetch("/api/storage/google/configuration"),
        apiFetch("/api/storage/backups"),
      ]);
      if (!configurationResponse.ok || !backupResponse.ok) throw new Error("settings_unavailable");
      const nextConfiguration = await configurationResponse.json() as StorageConfiguration;
      const nextBackups = await backupResponse.json() as BackupPayload;
      setConfiguration(nextConfiguration);
      setBackups(nextBackups);
      setMode(nextBackups.policy.mode);
      setFrequency(nextBackups.policy.frequency);
    } catch {
      setError("No fue posible consultar la configuración productiva. Verifique la conexión con el backend.");
    } finally {
      setBusy(null);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const createBackup = async () => {
    setBusy("backup"); setError(null); setNotice(null);
    try {
      const response = await apiFetch("/api/storage/backups", { method: "POST" });
      if (!response.ok) throw new Error("backup_failed");
      const result = await response.json() as { fileCount: number };
      setNotice(`Respaldo completado correctamente: ${result.fileCount} archivos protegidos.`);
      await load();
    } catch { setError("No fue posible crear el respaldo manual."); setBusy(null); }
  };

  const savePolicy = async () => {
    setBusy("policy"); setError(null); setNotice(null);
    try {
      const response = await apiFetch("/api/storage/backups/policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, frequency }),
      });
      if (!response.ok) throw new Error("policy_failed");
      setNotice("Política de respaldos actualizada.");
      await load();
    } catch { setError("No fue posible guardar la política de respaldos."); setBusy(null); }
  };

  const purgeTestData = async () => {
    if (confirmation !== CONFIRMATION) return;
    setBusy("purge"); setError(null); setNotice(null);
    try {
      const response = await apiFetch("/api/storage/test-data/purge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      if (!response.ok) throw new Error("purge_failed");
      const result = await response.json() as { removedRecords: number; purgedPeriods: string[]; mixedPeriods: string[] };
      setConfirmation("");
      setNotice(`Limpieza terminada: ${result.removedRecords} registros sintéticos eliminados en ${result.purgedPeriods.length} períodos. ${result.mixedPeriods.length ? `${result.mixedPeriods.length} períodos mixtos se conservaron para revisión.` : ""}`);
      await load();
    } catch { setError("La limpieza no pudo completarse. Ningún período mixto se elimina automáticamente."); setBusy(null); }
  };

  return (
    <section className="space-y-6 pb-12 text-sm text-slate-700">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-indigo-700"><Settings2 className="h-5 w-5" /><span className="font-bold">Administración productiva</span></div>
        <h1 className="mt-2 text-2xl font-black text-slate-950">Configuración, Reglas &amp; Respaldo</h1>
        <p className="mt-1 text-slate-500">Controles de almacenamiento, continuidad operativa y transición segura de datos sintéticos a datos reales.</p>
      </header>

      {error && <div role="alert" className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800"><span>{error}</span><button onClick={() => void load()} className="flex items-center gap-2 font-bold"><RefreshCw className="h-4 w-4" /> Reintentar</button></div>}
      {notice && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"><CheckCircle2 className="h-5 w-5" />{notice}</div>}

      <div className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-sky-50 p-3 text-sky-700"><Cloud className="h-6 w-6" /></div><div><h2 className="text-lg font-black text-slate-950">Google Workspace Storage</h2><p className="text-xs text-slate-500">Shared Drive y hojas maestras administradas</p></div></div>
          {busy === "load" && !configuration ? <div className="flex items-center gap-2 py-8 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Consultando configuración…</div> : configuration && (
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["Shared Drive", configuration.sharedDrive], ["Master Spreadsheet", configuration.masterSpreadsheet],
                ["Carpeta mensual", configuration.monthlyFolder], ["Identidad", configuration.serviceAccountStatus],
                ["Zona horaria", configuration.timeZone], ["Moneda", configuration.currency],
              ].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</dt><dd className="mt-1 font-mono text-xs font-semibold text-slate-800">{value}</dd></div>)}
            </dl>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><Archive className="h-6 w-6" /></div><div><h2 className="text-lg font-black text-slate-950">Respaldos de datos</h2><p className="text-xs text-slate-500">Copias independientes dentro del Shared Drive</p></div></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-slate-600">Modalidad<select disabled={!canManage} value={mode} onChange={(event) => setMode(event.target.value as BackupPolicy["mode"])} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="manual">Manual</option><option value="automatic">Automática</option></select></label>
            <label className="text-xs font-bold text-slate-600">Frecuencia<select disabled={!canManage || mode !== "automatic"} value={frequency} onChange={(event) => setFrequency(event.target.value as BackupPolicy["frequency"])} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="daily">Diaria</option><option value="weekly">Semanal</option></select></label>
          </div>
          <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-900"><ShieldCheck className="mr-1 inline h-4 w-4" />Siempre se crea un respaldo obligatorio antes de cualquier limpieza. En modalidad automática, se genera al entrar a Settings cuando vence la frecuencia.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button disabled={!canManage || Boolean(busy)} onClick={() => void savePolicy()} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-slate-700 disabled:opacity-50"><Save className="h-4 w-4" /> Guardar política</button>
            <button disabled={!canManage || Boolean(busy)} onClick={() => void createBackup()} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-bold text-white disabled:opacity-50"><HardDrive className="h-4 w-4" /> Crear respaldo ahora</button>
          </div>
          {backups?.policy.lastBackupAt && <p className="mt-4 text-xs text-slate-500">Último respaldo: <span className="font-semibold text-slate-700">{new Date(backups.policy.lastBackupAt).toLocaleString()}</span></p>}
        </article>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3"><div className="rounded-xl bg-slate-100 p-3 text-slate-700"><Database className="h-6 w-6" /></div><div><h2 className="text-lg font-black text-slate-950">Historial de respaldos</h2><p className="text-xs text-slate-500">Últimas copias registradas por la plataforma</p></div></div>
        <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead className="border-b border-slate-200 text-slate-500"><tr><th className="py-3">Fecha</th><th>Origen</th><th>Estado</th><th>Archivos</th><th>ID de respaldo</th></tr></thead><tbody>{backups?.backups.map((backup) => <tr key={backup.backupId} className="border-b border-slate-100"><td className="py-3">{new Date(backup.createdAt).toLocaleString()}</td><td>{backup.trigger}</td><td><span className={`rounded-full px-2 py-1 font-bold ${backup.status === "complete" ? "bg-emerald-50 text-emerald-700" : backup.status === "failed" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>{backup.status}</span></td><td>{backup.fileCount}</td><td className="font-mono text-slate-500">{backup.backupId}</td></tr>)}</tbody></table>{backups?.backups.length === 0 && <p className="py-6 text-center text-slate-500">Todavía no existen respaldos registrados.</p>}</div>
      </article>

      <article className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 shadow-sm">
        <div className="flex items-center gap-3 text-rose-800"><AlertTriangle className="h-6 w-6" /><div><h2 className="text-lg font-black">Zona de mantenimiento</h2><p className="text-xs">Transición de datos sintéticos a operación real</p></div></div>
        <p className="mt-4 max-w-4xl leading-6 text-slate-700">Elimina únicamente períodos compuestos totalmente por registros identificados como sintéticos. Los períodos que mezclen datos reales y de prueba se conservan completos para revisión manual. Antes de comenzar se crea automáticamente un respaldo.</p>
        <label className="mt-4 block max-w-xl text-xs font-bold text-slate-700">Escriba <code className="rounded bg-white px-1.5 py-0.5 text-rose-700">{CONFIRMATION}</code> para habilitar la acción<input disabled={!canManage} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 w-full rounded-xl border border-rose-200 bg-white px-3 py-2.5 font-mono text-sm" /></label>
        <button disabled={!canManage || confirmation !== CONFIRMATION || Boolean(busy)} onClick={() => void purgeTestData()} className="mt-3 flex items-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-4 w-4" /> {busy === "purge" ? "Creando respaldo y limpiando…" : "Borrar datos de prueba"}</button>
        {!canManage && <p className="mt-3 text-xs font-semibold text-rose-700">Su rol permite consultar la configuración, pero no ejecutar mantenimiento.</p>}
      </article>
    </section>
  );
};
