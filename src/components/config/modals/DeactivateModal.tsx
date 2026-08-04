import React, { useState } from "react";
import { AlertTriangle, X, Calendar, FileText, CheckCircle2 } from "lucide-react";

interface DeactivateModalProps {
  isOpen: boolean;
  entityName: string;
  entityType: string;
  onClose: () => void;
  onConfirm: (effectiveDate: string, reason: string) => void;
}

export const DeactivateModal: React.FC<DeactivateModalProps> = ({
  isOpen,
  entityName,
  entityType,
  onClose,
  onConfirm,
}) => {
  const [effectiveDate, setEffectiveDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [reason, setReason] = useState<string>("Contract Termination / Expiration");
  const [customNotes, setCustomNotes] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = customNotes ? `${reason}: ${customNotes}` : reason;
    onConfirm(effectiveDate, finalReason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-rose-50 border-b border-rose-100 p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                Desactivación de Registro
              </span>
              <h3 className="text-base font-black text-slate-900">Desactivar {entityType}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-slate-500 font-medium">Registro seleccionado:</p>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{entityName}</p>
            <p className="text-[11px] text-amber-700 mt-1 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              El registro pasará a estado Inactivo. No se eliminará del historial auditable ni de reportes previos.
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Fecha de Vigencia de Desactivación (Effective Date) <span className="text-rose-600">*</span>
            </label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              Motivo Corporativo de Desactivación <span className="text-rose-600">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            >
              <option value="Contract Termination / Expiration">Fin o Expiración de Contrato</option>
              <option value="Role Change / Transfer">Cambio de Rol o Traslado Operativo</option>
              <option value="Replaced by new Master Record">Reemplazado por Nuevo Código/Registro Maestro</option>
              <option value="Duplicate Consolidation">Consolidación de Registros Duplicados</option>
              <option value="Clinical Scope Deprecation">Depreciación de Cobertura Clínica</option>
              <option value="Administrative Invalidation">Inactivación Administrativa</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">
              Notas Adicionales de Auditoría (Opcional)
            </label>
            <textarea
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              rows={2}
              placeholder="Ej: Aprobado en reunión de operaciones el 01/08/2026..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirmar Desactivación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
