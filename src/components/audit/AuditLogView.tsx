import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, History, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { apiFetch } from "../../lib/apiClient";

interface AuditEvent {
  eventId: string;
  sequence: number;
  timestamp: string;
  actorId: string;
  role: string;
  action: string;
  resourceType: string;
  resourceId: string;
  result: string;
  correlationId: string;
  hash: string;
}

function errorForStatus(status: number): string {
  if (status === 403) return "Su rol no tiene permiso para consultar la cadena de auditoría.";
  if (status === 400) return "La auditoría requiere un único alcance organizacional activo.";
  if (status >= 500) return "El servicio de auditoría no está disponible temporalmente.";
  return "No fue posible consultar la auditoría autorizada.";
}

export const AuditLogView: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/api/audit-events");
      if (!response.ok) {
        setError(errorForStatus(response.status));
        return;
      }
      const payload = await response.json() as { events: AuditEvent[] };
      setEvents(payload.events);
    } catch {
      setError("No se pudo conectar con el backend de auditoría. Verifique el endpoint de Cloud Run.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <section className="space-y-5 pb-12">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-700"><ShieldCheck className="h-5 w-5" /><span className="font-bold">Cadena de auditoría backend</span></div>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div><h1 className="text-xl font-black text-slate-900">Eventos de seguridad</h1><p className="text-sm text-slate-500">Identificadores controlados, correlación y hash encadenado. No se almacenan payloads clínicos.</p></div>
          <button disabled={loading} onClick={() => void load()} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Actualizar</button>
        </div>
      </header>
      {error && <div role="alert" className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800"><span>{error}</span><button onClick={() => void load()} className="font-bold">Reintentar</button></div>}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[1080px] text-left text-xs">
          <thead className="bg-slate-100 text-slate-600"><tr><th className="p-3">Seq.</th><th>Fecha</th><th>Actor/Rol</th><th>Acción</th><th>Recurso</th><th>Resultado</th><th>Correlación</th><th>Integridad</th></tr></thead>
          <tbody>{events.map((event) => <tr key={event.eventId} className="border-t border-slate-100">
            <td className="p-3 font-mono">{event.sequence}</td><td>{new Date(event.timestamp).toLocaleString()}</td><td>{event.actorId}<br/><span className="text-slate-500">{event.role}</span></td>
            <td className="font-semibold">{event.action}</td><td>{event.resourceType}<br/><span className="font-mono text-slate-500">{event.resourceId}</span></td>
            <td><span className={`rounded-full px-2 py-1 font-bold ${event.result === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{event.result}</span></td><td className="font-mono">{event.correlationId}</td><td title={event.hash}><CheckCircle2 className="h-4 w-4 text-emerald-600" /></td>
          </tr>)}</tbody>
        </table>
        {loading && <div className="flex items-center justify-center gap-2 py-10 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Consultando eventos autorizados…</div>}
        {!loading && !error && events.length === 0 && <div className="flex items-center justify-center gap-2 py-10 text-slate-500"><History className="h-4 w-4" /> No hay eventos para el alcance actual.</div>}
      </div>
    </section>
  );
};
