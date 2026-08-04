import React, { useEffect, useState } from "react";
import { History, ShieldCheck } from "lucide-react";
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

export const AuditLogView: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void apiFetch("/api/audit-events").then(async (response) => {
      if (!response.ok) throw new Error("denied");
      const payload = await response.json() as { events: AuditEvent[] };
      if (active) setEvents(payload.events);
    }).catch(() => { if (active) setError("No fue posible consultar la auditoría autorizada."); });
    return () => { active = false; };
  }, []);

  return (
    <section className="space-y-5 pb-12">
      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 text-emerald-700"><ShieldCheck className="w-5 h-5" /><span className="font-bold">Cadena de auditoría backend</span></div>
        <h1 className="mt-2 text-xl font-black text-slate-900">Eventos de seguridad</h1>
        <p className="text-sm text-slate-500">Identificadores controlados, correlación y hash encadenado. No se almacenan payloads clínicos.</p>
      </header>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-rose-800">{error}</p>}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 text-slate-600"><tr><th className="p-3">Seq.</th><th>Fecha</th><th>Actor/Rol</th><th>Acción</th><th>Recurso</th><th>Resultado</th><th>Correlación</th><th>Integridad</th></tr></thead>
          <tbody>{events.map((event) => <tr key={event.eventId} className="border-t border-slate-100">
            <td className="p-3 font-mono">{event.sequence}</td><td>{event.timestamp}</td><td>{event.actorId}<br/><span className="text-slate-500">{event.role}</span></td>
            <td className="font-semibold">{event.action}</td><td>{event.resourceType}<br/><span className="font-mono text-slate-500">{event.resourceId}</span></td>
            <td>{event.result}</td><td className="font-mono">{event.correlationId}</td><td title={event.hash}><History className="w-4 h-4 text-emerald-600" /></td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>
  );
};
