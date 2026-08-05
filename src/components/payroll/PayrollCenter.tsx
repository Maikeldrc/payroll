import React, { useState } from "react";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  Lock,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  SlidersHorizontal,
  Layers,
  Award,
  AlertTriangle,
  History,
  Check,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { roleHasPermission } from "../../../shared/authorization";
import { PayrollCalculation, ManualAdjustment } from "../../types";
import { PayrollRuleBuilder } from "./PayrollRuleBuilder";

export const PayrollCenter: React.FC = () => {
  const demoMode = import.meta.env.VITE_DEMO_MODE === "true";
  const { claims } = useAuth();
  const canManagePayroll = Boolean(claims && roleHasPermission(claims.role, "payroll:manage"));
  const {
    payrollCalculations,
    careManagers,
    globalFilters,
    recalculateAllPayroll,
    addManualPayrollAdjustment,
    updatePayrollStatus,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"summary" | "rules">("summary");
  const [selectedCalc, setSelectedCalc] = useState<PayrollCalculation | null>(null);

  // Manual Adjustment Form
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [adjAmount, setAdjAmount] = useState(50);
  const [adjType, setAdjType] = useState<"Bonus" | "Deduction" | "Correction">("Bonus");
  const [adjReason, setAdjReason] = useState("Bono especial por meta alcanzada");

  const currentMonth = globalFilters.monthOf || "2026-07";

  const monthCalcs = payrollCalculations.filter((c) => c.monthOf === currentMonth);

  const totalBase = monthCalcs.reduce((acc, c) => acc + c.baseEarnings, 0);
  const totalBonuses = monthCalcs.reduce((acc, c) => acc + c.bonuses, 0);
  const totalDeductions = monthCalcs.reduce((acc, c) => acc + c.deductions, 0);
  const totalNetPay = monthCalcs.reduce((acc, c) => acc + c.netPay, 0);

  const handleAddAdj = () => {
    if (!selectedCalc) return;
    const finalAmount = adjType === "Deduction" ? -Math.abs(adjAmount) : Math.abs(adjAmount);
    addManualPayrollAdjustment(selectedCalc.id, {
      type: adjType,
      amount: finalAmount,
      reason: adjReason,
      author: "Administrador de Payroll",
    });
    setShowAdjModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Navigation Tabs */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
              Módulo de Nómina & Compensaciones
            </span>
            <span className="text-xs text-slate-500">Periodo: {currentMonth}</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">Centro de Gestión de Payroll de Care Managers</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cálculo transparente con desglose detallado por paciente, bonos por metas, deducciones, ajustes manuales y cierre definitivo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setActiveTab("summary")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "summary" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Cálculo Mensual ({monthCalcs.length})
            </button>
            {demoMode ? <button
              onClick={() => setActiveTab("rules")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "rules" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Reglas Configurables
            </button> : <span className="px-3 py-1.5 text-slate-500">Reglas administradas en backend</span>}
          </div>

          {canManagePayroll && <button
            onClick={() => recalculateAllPayroll(currentMonth)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Recalcular Todo</span>
          </button>}
        </div>
      </div>

      {activeTab === "summary" && (
        <>
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Base Earnings</span>
              <div className="text-xl font-black text-slate-900 mt-1">${totalBase.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <span className="text-[10px] font-bold uppercase text-emerald-600">Total Bonos Generados</span>
              <div className="text-xl font-black text-emerald-700 mt-1">+${totalBonuses.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <span className="text-[10px] font-bold uppercase text-rose-600">Total Deducciones</span>
              <div className="text-xl font-black text-rose-700 mt-1">-${totalDeductions.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
            </div>

            <div className="p-4 bg-indigo-900 text-white border border-indigo-950 rounded-xl shadow-md">
              <span className="text-[10px] font-bold uppercase text-indigo-300">Net Payroll Consolidado</span>
              <div className="text-2xl font-black text-white mt-1">${totalNetPay.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          {/* Payroll List Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Resumen de Compensaciones por Care Manager</h3>
              <span className="text-xs text-slate-500">Exportaciones disponibles en Reportes autorizados</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 uppercase text-[10px] font-semibold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Care Manager</th>
                    <th className="p-3 text-center">Pacientes</th>
                    <th className="p-3 text-right">Base ($)</th>
                    <th className="p-3 text-right">Bonos ($)</th>
                    <th className="p-3 text-right">Deducciones ($)</th>
                    <th className="p-3 text-right">Ajustes ($)</th>
                    <th className="p-3 text-right">Net Pay ($)</th>
                    <th className="p-3 text-center">Versión</th>
                    <th className="p-3 text-center">Estado Workflow</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {monthCalcs.map((calc) => {
                    const cm = careManagers.find((c) => c.id === calc.careManagerId);
                    const manualSum = calc.manualAdjustments.reduce((acc, a) => acc + a.amount, 0);

                    return (
                      <tr key={calc.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <strong className="text-slate-900 text-sm">{calc.careManagerName}</strong>
                          <p className="text-[10px] text-slate-400">{cm?.email}</p>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800">{calc.eligiblePatientsCount}</td>
                        <td className="p-3 text-right font-medium">${calc.baseEarnings.toFixed(2)}</td>
                        <td className="p-3 text-right font-bold text-emerald-600">+${calc.bonuses.toFixed(2)}</td>
                        <td className="p-3 text-right font-bold text-rose-600">-${calc.deductions.toFixed(2)}</td>
                        <td className="p-3 text-right font-bold text-amber-700">
                          {manualSum >= 0 ? "+" : ""}${manualSum.toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-black text-indigo-900 text-sm">
                          ${calc.netPay.toFixed(2)}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-500">v{calc.version}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              calc.status === "Closed"
                                ? "bg-slate-900 text-white"
                                : calc.status === "Approved"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : calc.status === "Ready for Approval"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {calc.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {demoMode ? <>
                            <button
                              onClick={() => {
                                setSelectedCalc(calc);
                                setShowAdjModal(true);
                              }}
                              className="px-2 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded hover:bg-amber-100 font-semibold text-[11px]"
                            >
                              + Ajuste
                            </button>
                            {calc.status === "Draft" && (
                              <button
                                onClick={() => updatePayrollStatus(calc.id, "Ready for Approval")}
                                className="px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-500 font-semibold text-[11px]"
                              >
                                Aprobar
                              </button>
                            )}
                            {calc.status === "Ready for Approval" && (
                              <button
                                onClick={() => updatePayrollStatus(calc.id, "Approved")}
                                className="px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-500 font-semibold text-[11px]"
                              >
                                Autorizar
                              </button>
                            )}
                            {calc.status === "Approved" && (
                              <button
                                onClick={() => updatePayrollStatus(calc.id, "Closed")}
                                className="px-2 py-1 bg-slate-900 text-white rounded hover:bg-slate-800 font-semibold text-[11px]"
                              >
                                Cerrar
                              </button>
                            )}
                            </> : <span className="text-[10px] font-semibold text-slate-500">Workflow backend</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {demoMode && activeTab === "rules" && <PayrollRuleBuilder />}

      {/* Manual Adjustment Modal Drawer */}
      {demoMode && showAdjModal && selectedCalc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-200 pb-2">
              Agregar Ajuste Manual a Payroll
            </h3>

            <p className="text-xs text-slate-600">
              Care Manager: <strong className="text-slate-900">{selectedCalc.careManagerName}</strong> ({currentMonth})
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Ajuste:</label>
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2"
                >
                  <option value="Bonus">Bono Especial (+)</option>
                  <option value="Deduction">Deducción Manual (-)</option>
                  <option value="Correction">Corrección Retributiva</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Monto ($):</label>
                <input
                  type="number"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motivo / Explicación Obligatoria:</label>
                <textarea
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  rows={3}
                  placeholder="Justifique el motivo de este ajuste en el audit trail..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                onClick={() => setShowAdjModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddAdj}
                className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Aplicar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
