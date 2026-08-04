import React from "react";
import {
  X,
  UserCheck,
  Award,
  DollarSign,
  TrendingUp,
  Activity,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  Layers,
  FileSpreadsheet,
  Building2,
} from "lucide-react";
import { CareManager } from "../../types";
import { useApp } from "../../context/AppContext";

interface CareManagerDetailModalProps {
  careManager: CareManager | null;
  onClose: () => void;
  onOpenPatient: (patientRecord: any) => void;
}

export const CareManagerDetailModal: React.FC<CareManagerDetailModalProps> = ({
  careManager,
  onClose,
  onOpenPatient,
}) => {
  const { records, payrollCalculations, targetGoals, globalFilters, practices, providers } = useApp();

  if (!careManager) return null;

  const currentMonth = globalFilters.monthOf || "2026-07";

  // Filter records for this Care Manager
  const cmRecords = records.filter(
    (r) => r.careManagerId === careManager.id && r.monthOf === currentMonth
  );

  const managedPatientsCount = cmRecords.length;
  const uniquePatientsCount = new Set(cmRecords.map((r) => r.mrn)).size;
  const commCount = cmRecords.filter((r) => r.latestInteractiveCommunication).length;
  const commRate = managedPatientsCount > 0 ? (commCount / managedPatientsCount) * 100 : 0;
  const totalLogs = cmRecords.reduce((acc, r) => acc + r.logEntries, 0);
  const avgLogs = managedPatientsCount > 0 ? totalLogs / managedPatientsCount : 0;
  const totalBilling = cmRecords.reduce((acc, r) => acc + r.monthlyBilling, 0);

  // Target Goal
  const target = targetGoals.find(
    (tg) => tg.careManagerId === careManager.id && tg.monthOf === currentMonth
  ) || {
    minPatients: 75,
    minInteractiveCommRate: 80,
    minLogEntriesAvg: 7,
    targetBilling: 5500,
    minQualityScore: 85,
  };

  const targetCompliance = Math.min(
    100,
    Math.round(
      ((managedPatientsCount / target.minPatients) * 0.4 +
        (commRate / target.minInteractiveCommRate) * 0.4 +
        (avgLogs / target.minLogEntriesAvg) * 0.2) *
        100
    )
  );

  // Payroll Calculation
  const payroll = payrollCalculations.find(
    (p) => p.careManagerId === careManager.id && p.monthOf === currentMonth
  );

  // MoM Comparison (June 2026)
  const juneRecords = records.filter(
    (r) => r.careManagerId === careManager.id && r.monthOf === "2026-06"
  );
  const juneBilling = juneRecords.reduce((acc, r) => acc + r.monthlyBilling, 0);
  const billingChangePct = juneBilling > 0 ? ((totalBilling - juneBilling) / juneBilling) * 100 : 0;

  // Assigned practices & providers
  const assignedPracNames = practices
    .filter((p) => careManager.practiceIds.includes(p.id))
    .map((p) => p.name);
  const assignedProvNames = providers
    .filter((pr) => careManager.providerIds.includes(pr.id))
    .map((pr) => pr.name);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              {careManager.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{careManager.name}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  {careManager.role}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {careManager.email} • Periodo Analizado: <strong className="text-white">{currentMonth}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-slate-400">Pacientes Gestionados</span>
              <div className="text-xl font-black text-slate-900 mt-1">
                {managedPatientsCount} <span className="text-xs font-semibold text-slate-500">({uniquePatientsCount} únicos)</span>
              </div>
              <span className="text-[11px] text-slate-500">Meta: {target.minPatients} pacientes</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-slate-400">Comunicación Interactiva</span>
              <div className={`text-xl font-black mt-1 ${commRate >= 80 ? "text-emerald-700" : "text-amber-600"}`}>
                {commRate.toFixed(1)}%
              </div>
              <span className="text-[11px] text-slate-500">{commCount} de {managedPatientsCount} pacientes</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-slate-400">Facturación Generada</span>
              <div className="text-xl font-black text-indigo-700 mt-1">
                ${totalBilling.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <span className={`text-[11px] font-medium ${billingChangePct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {billingChangePct >= 0 ? "+" : ""}{billingChangePct.toFixed(1)}% vs mes anterior
              </span>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-indigo-800">Payroll Calculado</span>
              <div className="text-xl font-black text-indigo-900 mt-1">
                ${payroll?.netPay.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
              </div>
              <span className="text-[11px] text-indigo-700 font-medium">Estado: {payroll?.status || "Draft"}</span>
            </div>
          </div>

          {/* Target Progress & Assignments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50">
              <h4 className="font-bold text-slate-900 mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-indigo-600" /> Cumplimiento de Metas Mensuales</span>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">{targetCompliance}%</span>
              </h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span>Pacientes: {managedPatientsCount} / {target.minPatients}</span>
                    <span className="font-semibold">{Math.round((managedPatientsCount / target.minPatients) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full" style={{ width: `${Math.min(100, (managedPatientsCount / target.minPatients) * 100)}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span>Tasa Comunicación: {commRate.toFixed(1)}% / {target.minInteractiveCommRate}%</span>
                    <span className="font-semibold">{Math.round((commRate / target.minInteractiveCommRate) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(100, (commRate / target.minInteractiveCommRate) * 100)}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span>Promedio Log Entries: {avgLogs.toFixed(1)} / {target.minLogEntriesAvg}</span>
                    <span className="font-semibold">{Math.round((avgLogs / target.minLogEntriesAvg) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full" style={{ width: `${Math.min(100, (avgLogs / target.minLogEntriesAvg) * 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border border-slate-200 rounded-xl space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Asignaciones Operativas</span>
              </h4>
              <div>
                <span className="text-slate-500 font-medium">Prácticas Asignadas:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {assignedPracNames.map((n) => (
                    <span key={n} className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-[11px]">{n}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Providers Asociados:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {assignedProvNames.map((n) => (
                    <span key={n} className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-[11px]">{n}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Alias Ortográficos Registrados:</span>
                <p className="text-[11px] text-slate-600 italic mt-0.5">{careManager.aliases.join(", ")}</p>
              </div>
            </div>
          </div>

          {/* Transparent Payroll Breakdown */}
          {payroll && (
            <div className="border border-indigo-200 bg-indigo-50/40 rounded-xl p-4">
              <h4 className="font-bold text-indigo-950 mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-indigo-600" /> Desglose Transparente de Payroll ({currentMonth})
                </span>
                <span className="text-sm font-black text-indigo-900">${payroll.netPay.toFixed(2)}</span>
              </h4>

              <div className="space-y-2 divide-y divide-indigo-100">
                {payroll.breakdownLines.map((line) => (
                  <div key={line.id} className="pt-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-900">{line.ruleName}</span>
                      <p className="text-[11px] text-slate-500">{line.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-600">{line.itemCount} x ${line.unitRate.toFixed(2)}</span>
                      <div className={`font-bold ${line.isDeduction ? "text-rose-600" : "text-emerald-700"}`}>
                        {line.isDeduction ? "-" : "+"}${line.subtotal.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}

                {payroll.manualAdjustments.map((adj) => (
                  <div key={adj.id} className="pt-2 flex items-center justify-between text-xs bg-amber-50/80 p-1.5 rounded">
                    <div>
                      <span className="font-bold text-amber-900">Ajuste Manual: {adj.reason}</span>
                      <p className="text-[10px] text-amber-700">Por {adj.author} le {adj.timestamp}</p>
                    </div>
                    <span className={`font-bold ${adj.amount >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                      {adj.amount >= 0 ? "+" : ""}${adj.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Managed Patients List */}
          <div>
            <h4 className="font-bold text-slate-900 mb-2">Lista de Pacientes Asignados ({cmRecords.length})</h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-2">MRN</th>
                    <th className="p-2">Paciente</th>
                    <th className="p-2">Servicio</th>
                    <th className="p-2">Provider</th>
                    <th className="p-2 text-center">Logs</th>
                    <th className="p-2 text-right">Billing</th>
                    <th className="p-2 text-center">Payroll</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {cmRecords.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => {
                        onClose();
                        onOpenPatient(r);
                      }}
                      className="hover:bg-slate-50 cursor-pointer"
                    >
                      <td className="p-2 font-mono font-semibold text-slate-900">{r.mrn}</td>
                      <td className="p-2 font-medium text-slate-800">{r.patientName}</td>
                      <td className="p-2 font-bold text-indigo-600">{r.serviceCode}</td>
                      <td className="p-2 text-slate-600">{r.providerName}</td>
                      <td className="p-2 text-center font-bold">{r.logEntries}</td>
                      <td className="p-2 text-right font-bold text-emerald-700">${r.monthlyBilling.toFixed(2)}</td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.payrollStatus === "Included" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                          {r.payrollStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
          >
            Cerrar Scorecard
          </button>
        </div>
      </div>
    </div>
  );
};
