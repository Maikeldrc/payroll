import React, { useState } from "react";
import { DollarSign, ShieldAlert, CheckCircle, Lock, Edit3, FileSpreadsheet, Plus, AlertTriangle, ArrowRight } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { PayrollCalculation } from "../../types";

export const PayrollCenterTab: React.FC<{ onDrillDownExceptions: () => void }> = ({ onDrillDownExceptions }) => {
  const demoMode = import.meta.env.VITE_DEMO_MODE === "true";
  const { payrollCalculations, records, addAuditLog, globalFilters } = useApp();
  const [selectedCMForAdjustment, setSelectedCMForAdjustment] = useState<PayrollCalculation | null>(null);
  const [adjAmount, setAdjAmount] = useState<string>("");
  const [adjReason, setAdjReason] = useState<string>("");
  const [overallPayrollStatus, setOverallPayrollStatus] = useState<"Draft" | "Under Review" | "Validated" | "Approved">("Under Review");

  const currentMonth = globalFilters.monthOf || "2026-07";
  const monthCalculations = payrollCalculations.filter((c) => c.monthOf === currentMonth);

  // Critical errors count across all records
  const criticalErrors = records.filter((r) => r.monthOf === currentMonth && r.validationErrors.length > 0).length;
  const isBlockedForApproval = criticalErrors > 0;

  const totalNetPay = monthCalculations.reduce((acc, c) => acc + c.netPay, 0);
  const totalBasePay = monthCalculations.reduce((acc, c) => acc + c.baseEarnings, 0);
  const totalBonuses = monthCalculations.reduce((acc, c) => acc + c.bonuses, 0);

  const handleApplyAdjustment = () => {
    if (!selectedCMForAdjustment || !adjAmount || !adjReason.trim()) return;
    const val = parseFloat(adjAmount);
    if (isNaN(val)) return;

    addAuditLog(
      "Manual Adjustment Applied",
      "PayrollCalculation",
      selectedCMForAdjustment.id,
      `Ajuste manual de $${val} aplicado a ${selectedCMForAdjustment.careManagerName}. Razon: "${adjReason.trim()}".`
    );

    setSelectedCMForAdjustment(null);
    setAdjAmount("");
    setAdjReason("");
  };

  const handleApprovePayroll = () => {
    if (isBlockedForApproval) return;

    setOverallPayrollStatus("Approved");
    addAuditLog(
      "Payroll Approved",
      "PayrollCalculation",
      `BATCH-${currentMonth}`,
      `Payroll del periodo ${currentMonth} aprobado formalmente por el usuario. Total Net Payout: $${totalNetPay.toLocaleString("en-US", { minimumFractionDigits: 2 })}.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Status Control */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-indigo-500/30 text-indigo-300 font-bold text-xs rounded-lg uppercase tracking-wider border border-indigo-400/30">
              Módulo de Aprobación de Payroll Auditado
            </span>
            <span className="text-slate-400 text-xs font-mono">Periodo: {currentMonth}</span>
          </div>
          <h3 className="text-xl font-bold text-white">
            Payout Neto Total: ${totalNetPay.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </h3>
        </div>

        {/* Status Workflow Progress */}
        <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl text-xs font-bold border border-slate-700">
          <span className="text-slate-400 px-2">Estatus:</span>
          {["Draft", "Under Review", "Validated", "Approved"].map((st) => (
            <span
              key={st}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                overallPayrollStatus === st
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {st}
            </span>
          ))}
        </div>

        {/* Action Button: Approve Payroll */}
        <div>
          {!demoMode ? (
            <span className="px-5 py-2.5 bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-2">
              <Lock className="w-4 h-4" /> Aprobación gestionada por workflow backend
            </span>
          ) : isBlockedForApproval ? (
            <button
              onClick={onDrillDownExceptions}
              className="px-5 py-2.5 bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md"
            >
              <Lock className="w-4 h-4" />
              <span>Aprobación Bloqueada ({criticalErrors} Errores de Calidad)</span>
            </button>
          ) : (
            <button
              onClick={handleApprovePayroll}
              disabled={overallPayrollStatus === "Approved"}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 ${
                overallPayrollStatus === "Approved"
                  ? "bg-emerald-600 text-white cursor-default"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white"
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{overallPayrollStatus === "Approved" ? "Payroll Aprobado" : "Aprobar Payroll del Mes"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Critical Blocking Warning if errors exist */}
      {isBlockedForApproval && (
        <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl flex items-center justify-between text-xs text-amber-900 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <strong className="text-amber-900 font-bold">REGLA DE GOBERNANZA DE PAYROLL ACTIVA:</strong>
              <p className="text-amber-800">
                No es posible aprobar el payroll mientras existan errores de Data Quality sin resolver ({criticalErrors} registros en conflicto).
              </p>
            </div>
          </div>
          <button
            onClick={onDrillDownExceptions}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg whitespace-nowrap shadow-xs"
          >
            Resolver Errores
          </button>
        </div>
      )}

      {/* Payroll Summary Totals */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-medium">Care Managers Elegibles</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{monthCalculations.length} CMs</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-medium">Base Payroll Accumulated</span>
          <div className="text-xl font-bold text-slate-900 mt-1">${totalBasePay.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-medium">Bonos de Calidad & Volumen</span>
          <div className="text-xl font-bold text-emerald-600 mt-1">${totalBonuses.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-medium">Payout Neto Promedio / CM</span>
          <div className="text-xl font-bold text-indigo-600 mt-1">
            ${(totalNetPay / (monthCalculations.length || 1)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Payroll Detail Table per Care Manager */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800 flex items-center justify-between">
          <span>Desglose de Payout de Payroll por Care Manager</span>
          <span className="text-slate-500 font-normal">Sujeto a auditoría y conciliación de horas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-semibold uppercase text-[10px]">
              <tr>
                <th className="p-3">Care Manager</th>
                <th className="p-3 text-right">Approved Hours</th>
                <th className="p-3 text-right">Tarifa / h</th>
                <th className="p-3 text-right">Base Payroll</th>
                <th className="p-3 text-right">Perf Bonus</th>
                <th className="p-3 text-right">Quality Bonus</th>
                <th className="p-3 text-right">Ajustes Manuales</th>
                <th className="p-3 text-right font-bold">Net Payout Final</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium">
              {monthCalculations.map((c) => {
                const manualAdjSum = c.manualAdjustments?.reduce((acc, a) => acc + a.amount, 0) || 0;
                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{c.careManagerName}</td>
                    <td className="p-3 text-right font-mono text-slate-700">160.0 h</td>
                    <td className="p-3 text-right font-mono text-slate-700">$12.50</td>
                    <td className="p-3 text-right font-mono text-slate-900">${c.baseEarnings.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono text-emerald-600">+${(c.bonuses * 0.6).toFixed(2)}</td>
                    <td className="p-3 text-right font-mono text-emerald-600">+${(c.bonuses * 0.4).toFixed(2)}</td>
                    <td className="p-3 text-right font-mono text-indigo-600 font-bold">
                      {manualAdjSum !== 0 ? (manualAdjSum > 0 ? `+$${manualAdjSum.toFixed(2)}` : `-$${Math.abs(manualAdjSum).toFixed(2)}`) : "$0.00"}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 text-sm">
                      ${c.netPay.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      {demoMode ? <button
                        onClick={() => setSelectedCMForAdjustment(c)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-[11px] border border-slate-300 flex items-center gap-1 mx-auto"
                      >
                        <Edit3 className="w-3 h-3 text-indigo-600" />
                        <span>Ajuste Manual</span>
                      </button> : <span className="text-[10px] font-semibold text-slate-500">Solo lectura</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Adjustment Modal */}
      {demoMode && selectedCMForAdjustment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h4 className="font-bold text-slate-900 text-base">
              Aplicar Ajuste Manual a Payroll — {selectedCMForAdjustment.careManagerName}
            </h4>
            <p className="text-xs text-slate-500">
              Los ajustes se auditan y requieren justificación obligatoria. Ingrese valores positivos para bonos adicionales o negativos para deducciones.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Monto del Ajuste ($ USD):</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="ej. 150.00 o -50.00"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Justificación / Motivo Auditado:</label>
                <textarea
                  rows={3}
                  placeholder="Escriba la razón de la modificación..."
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedCMForAdjustment(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyAdjustment}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md"
              >
                Aplicar y Registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
