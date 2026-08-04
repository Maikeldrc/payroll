import React from "react";
import { Stethoscope, DollarSign, Users, Activity, Layers, BarChart3 } from "lucide-react";
import { useApp } from "../../context/AppContext";

export const ServiceAnalyticsView: React.FC = () => {
  const { records, services, globalFilters } = useApp();

  const currentMonth = globalFilters.monthOf || "2026-07";
  const monthRecords = records.filter((r) => r.monthOf === currentMonth);

  const serviceBreakdown = services.map((srv) => {
    const srvRecs = monthRecords.filter((r) => r.serviceCode === srv.code);
    const count = srvRecs.length;
    const billing = srvRecs.reduce((acc, r) => acc + r.monthlyBilling, 0);
    const commCount = srvRecs.filter((r) => r.latestInteractiveCommunication).length;
    const commRate = count > 0 ? (commCount / count) * 100 : 0;

    return {
      srv,
      count,
      billing,
      commRate,
    };
  });

  return (
    <div className="space-y-6 pb-12 text-xs text-slate-700">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200 text-[10px] font-bold uppercase tracking-wider">
          Análisis por Programa de Servicio
        </span>
        <h1 className="text-xl font-black text-slate-900 mt-1">Análisis Detallado de Programas de Care Management</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Rendimiento y distribución de pacientes entre CCM, RPM, PCM, BHI, APCM y servicios combinados.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {serviceBreakdown.map(({ srv, count, billing, commRate }) => (
          <div key={srv.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="font-extrabold text-base text-indigo-700">{srv.code}</span>
                <h3 className="font-bold text-slate-900 text-xs">{srv.name}</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono font-bold text-[10px]">
                {srv.defaultCPTCodes.join(", ")}
              </span>
            </div>

            <p className="text-slate-500 text-[11px] line-clamp-2">{srv.description}</p>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Pacientes</span>
                <div className="text-base font-black text-slate-900">{count}</div>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Facturación</span>
                <div className="text-base font-black text-emerald-700">${billing.toLocaleString()}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
