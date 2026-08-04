import React from "react";
import { Building2, Stethoscope, Users, DollarSign, Award } from "lucide-react";
import { useApp } from "../../context/AppContext";

export const ProviderPerformanceView: React.FC = () => {
  const { providers, practices, records, globalFilters } = useApp();

  const currentMonth = globalFilters.monthOf || "2026-07";
  const monthRecords = records.filter((r) => r.monthOf === currentMonth);

  const providerStats = providers.map((prov) => {
    const pRecs = monthRecords.filter((r) => r.providerId === prov.id);
    const count = pRecs.length;
    const billing = pRecs.reduce((acc, r) => acc + r.monthlyBilling, 0);

    return {
      prov,
      count,
      billing,
    };
  });

  return (
    <div className="space-y-6 pb-12 text-xs text-slate-700">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 text-[10px] font-bold uppercase tracking-wider">
          Análisis por Provider & Práctica
        </span>
        <h1 className="text-xl font-black text-slate-900 mt-1">Rendimiento por Médicos & Prácticas Médicas</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Consolidación de volumen de pacientes, facturación generada y atribución por médico tratante.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100 uppercase text-[10px] font-semibold text-slate-600 border-b border-slate-200">
            <tr>
              <th className="p-3">NPI</th>
              <th className="p-3">Nombre del Provider</th>
              <th className="p-3">Especialidad</th>
              <th className="p-3">Práctica Asociada</th>
              <th className="p-3 text-center">Pacientes Atribuidos</th>
              <th className="p-3 text-right">Facturación Generada ($)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {providerStats.map(({ prov, count, billing }) => {
              const practice = practices.find((p) => p.id === prov.practiceId);
              return (
                <tr key={prov.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-slate-900">{prov.npi}</td>
                  <td className="p-3 font-bold text-slate-900 text-sm">{prov.name}</td>
                  <td className="p-3 text-slate-600">{prov.specialty}</td>
                  <td className="p-3 text-slate-600">{practice?.name || "Sin Práctica"}</td>
                  <td className="p-3 text-center font-bold text-slate-900 text-sm">{count}</td>
                  <td className="p-3 text-right font-black text-emerald-700 text-sm">
                    ${billing.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
