import React, { useState } from "react";
import { Plus, Trash2, Edit } from "lucide-react";
import { PayrollRule } from "../../types";
import { useApp } from "../../context/AppContext";

export const PayrollRuleBuilder: React.FC = () => {
  const { payrollRules, updatePayrollRule, addPayrollRule, deletePayrollRule } = useApp();

  const [editingRule, setEditingRule] = useState<PayrollRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const newEmptyRule: PayrollRule = {
    id: `RULE-${Date.now()}`,
    name: "Nueva Regla de Payroll",
    description: "Descripción de la regla de compensación",
    ruleType: "flat_rate_per_patient",
    baseCalculation: "flat",
    amountOrPercent: 25.0,
    conditions: [],
    startDate: "2026-06",
    priority: 1,
    active: true,
    applicableServices: ["CCM"],
    applicableCareManagers: [],
    applicablePractices: [],
  };

  const handleSave = (rule: PayrollRule) => {
    if (payrollRules.some((r) => r.id === rule.id)) {
      updatePayrollRule(rule);
    } else {
      addPayrollRule(rule);
    }
    setEditingRule(null);
    setIsCreating(false);
  };

  return (
    <div className="space-y-6 text-xs text-slate-700">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Constructor de Reglas de Payroll Configurables</h3>
          <p className="text-slate-500">Defina reglas tarifarias por paciente, bonos por metas o deducciones por incumplimiento.</p>
        </div>
        <button
          onClick={() => {
            setEditingRule({ ...newEmptyRule });
            setIsCreating(true);
          }}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Nueva Regla</span>
        </button>
      </div>

      {/* Rules List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {payrollRules.map((rule) => (
          <div key={rule.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  {rule.ruleType}
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">{rule.name}</h4>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingRule(rule)}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deletePayrollRule(rule.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-slate-600">{rule.description}</p>

            <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <div><span className="text-slate-400">Tarifa / Monto:</span> <strong className="text-slate-900">${rule.amountOrPercent.toFixed(2)}</strong></div>
              <div><span className="text-slate-400">Servicios:</span> <strong className="text-slate-900">{rule.applicableServices.join(", ") || "Todos"}</strong></div>
              <div><span className="text-slate-400">Prioridad:</span> <strong className="text-slate-900">P{rule.priority}</strong></div>
              <div><span className="text-slate-400">Estado:</span> <strong className="text-slate-900">{rule.active ? "Activa" : "Inactiva"}</strong></div>
            </div>
          </div>
        ))}
      </div>

      {/* Rule Editor Drawer/Modal */}
      {editingRule && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-200 pb-2">
              {isCreating ? "Crear Nueva Regla de Payroll" : "Editar Regla de Payroll"}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nombre de la Regla:</label>
                <input
                  type="text"
                  value={editingRule.name}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Descripción:</label>
                <textarea
                  value={editingRule.description}
                  onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tipo de Regla:</label>
                  <select
                    value={editingRule.ruleType}
                    onChange={(e) => setEditingRule({ ...editingRule, ruleType: e.target.value as any })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                  >
                    <option value="flat_rate_per_patient">Tarifa Plana por Paciente</option>
                    <option value="service_rate">Tarifa Específica por Programa</option>
                    <option value="log_entries_bonus">Bono por Entradas de Log</option>
                    <option value="interactive_comm_bonus">Bono por Comunicación Interactiva</option>
                    <option value="volume_bonus">Bono por Volumen Elevado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tarifa / Monto ($):</label>
                  <input
                    type="number"
                    value={editingRule.amountOrPercent}
                    onChange={(e) => setEditingRule({ ...editingRule, amountOrPercent: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingRule.active}
                    onChange={(e) => setEditingRule({ ...editingRule, active: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span>Regla Activa</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                onClick={() => setEditingRule(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSave(editingRule)}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Guardar Regla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
