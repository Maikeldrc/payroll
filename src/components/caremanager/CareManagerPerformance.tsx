import React from "react";
import {
  Users,
  Award,
  TrendingUp,
  PhoneCall,
  Activity,
  DollarSign,
  ArrowUpRight,
  UserCheck,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { CareManager } from "../../types";

interface CareManagerPerformanceProps {
  onOpenCareManager: (cm: CareManager) => void;
}

export const CareManagerPerformance: React.FC<CareManagerPerformanceProps> = ({
  onOpenCareManager,
}) => {
  const { careManagers, records, payrollCalculations, globalFilters, targetGoals } = useApp();

  const currentMonth = globalFilters.monthOf || "2026-07";

  const cmPerformanceList = careManagers.map((cm) => {
    const cmRecs = records.filter(
      (r) => r.careManagerId === cm.id && r.monthOf === currentMonth
    );

    const managedCount = cmRecs.length;
    const uniqueCount = new Set(cmRecs.map((r) => r.mrn)).size;
    const commCount = cmRecs.filter((r) => r.latestInteractiveCommunication).length;
    const commRate = managedCount > 0 ? (commCount / managedCount) * 100 : 0;
    const totalLogs = cmRecs.reduce((acc, r) => acc + r.logEntries, 0);
    const avgLogs = managedCount > 0 ? totalLogs / managedCount : 0;
    const totalBilling = cmRecs.reduce((acc, r) => acc + r.monthlyBilling, 0);

    const calc = payrollCalculations.find(
      (p) => p.careManagerId === cm.id && p.monthOf === currentMonth
    );

    const target = targetGoals.find(
      (tg) => tg.careManagerId === cm.id && tg.monthOf === currentMonth
    ) || { minPatients: 75, minInteractiveCommRate: 80, minLogEntriesAvg: 7 };

    const targetScore = Math.min(
      100,
      Math.round(
        ((managedCount / target.minPatients) * 0.4 +
          (commRate / target.minInteractiveCommRate) * 0.4 +
          (avgLogs / target.minLogEntriesAvg) * 0.2) *
          100
      )
    );

    return {
      cm,
      managedCount,
      uniqueCount,
      commRate,
      avgLogs,
      totalBilling,
      netPay: calc?.netPay || 0,
      targetScore,
    };
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 text-[10px] font-bold uppercase tracking-wider">
            Evaluación & Productividad
          </span>
          <h1 className="text-xl font-black text-slate-900 mt-1">Care Manager Scorecards & Ranking</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas de desempeño de la fuerza de Care Managers, tasa de contacto interactivo, facturación generada y cumplimiento de metas.
          </p>
        </div>
      </div>

      {/* Performance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cmPerformanceList.map(({ cm, managedCount, uniqueCount, commRate, avgLogs, totalBilling, netPay, targetScore }) => (
          <div
            key={cm.id}
            onClick={() => onOpenCareManager(cm)}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-4 group"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md group-hover:scale-105 transition-transform">
                  {cm.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                    {cm.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">{cm.role}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Score</span>
                <span className="text-sm font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {targetScore}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Pacientes</span>
                <div className="text-base font-bold text-slate-900">{managedCount} ({uniqueCount} unq)</div>
              </div>

              <div className="p-2 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Com. Interactiva</span>
                <div className={`text-base font-bold ${commRate >= 80 ? "text-emerald-700" : "text-amber-600"}`}>
                  {commRate.toFixed(1)}%
                </div>
              </div>

              <div className="p-2 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Facturación</span>
                <div className="text-base font-bold text-indigo-700">${totalBilling.toFixed(0)}</div>
              </div>

              <div className="p-2 bg-indigo-50 rounded-lg">
                <span className="text-[10px] text-indigo-800 font-bold uppercase">Payroll Net</span>
                <div className="text-base font-bold text-indigo-900">${netPay.toFixed(0)}</div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-semibold group-hover:underline">
              <span>Ver Scorecard Completo</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
