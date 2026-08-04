import React from "react";
import {
  X,
  User,
  Stethoscope,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  FileText,
  DollarSign,
  Activity,
  PhoneCall,
  Shield,
  MapPin,
} from "lucide-react";
import { MonthlyManagementRecord } from "../../types";
import { useApp } from "../../context/AppContext";

interface PatientDetailModalProps {
  record: MonthlyManagementRecord | null;
  onClose: () => void;
}

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({ record, onClose }) => {
  const { records, toggleRecordPayrollStatus } = useApp();

  if (!record) return null;

  // Find all historical months for this patient (by MRN)
  const patientHistory = records
    .filter((r) => r.mrn === record.mrn)
    .sort((a, b) => b.monthOf.localeCompare(a.monthOf));

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-bold text-base">
              {record.firstName?.[0] || "P"}{record.lastName?.[0] || "T"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{record.patientName}</h2>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  MRN: {record.mrn}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {record.sex === "M" ? "Masculino" : "Femenino"} • DOB: {record.dob} • Periodo: {record.monthOf}
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

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Status Banners */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Estado de Elegibilidad</span>
                <div className="flex items-center gap-1.5 mt-1">
                  {record.eligibility === "Eligible" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span className="font-bold text-slate-900">{record.eligibility}</span>
                </div>
              </div>
              {record.hmo === "Yes" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  Plan HMO
                </span>
              )}
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Estado en Payroll</span>
                <div className="mt-1">
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      record.payrollStatus === "Included"
                        ? "bg-emerald-100 text-emerald-800"
                        : record.payrollStatus === "Excluded"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {record.payrollStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Quality Score</span>
                <div className="text-base font-extrabold text-slate-900 mt-0.5">
                  {record.qualityScore} / 100
                </div>
              </div>
            </div>
          </div>

          {/* Service & Provider Details */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-indigo-900 font-semibold mb-2">
                <Stethoscope className="w-4 h-4 text-indigo-600" />
                <span>Servicio & Coordinación</span>
              </div>
              <div className="space-y-1">
                <p><span className="text-slate-500">Servicio:</span> <strong className="text-slate-900">{record.serviceCode}</strong></p>
                <p><span className="text-slate-500">Care Manager:</span> <strong className="text-slate-900">{record.careManagerName}</strong></p>
                <p><span className="text-slate-500">Provider:</span> <strong className="text-slate-900">{record.providerName}</strong></p>
                <p><span className="text-slate-500">Práctica:</span> <strong className="text-slate-900">{record.practiceName}</strong></p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-indigo-900 font-semibold mb-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <span>Actividad & Facturación</span>
              </div>
              <div className="space-y-1">
                <p><span className="text-slate-500">Log Entries Registrados:</span> <strong className="text-slate-900">{record.logEntries}</strong></p>
                <p><span className="text-slate-500">Facturación Mensual:</span> <strong className="text-emerald-700">${record.monthlyBilling.toFixed(2)}</strong></p>
                <p><span className="text-slate-500">Última Comunicación Interactiva:</span> <strong className="text-slate-900">{record.latestInteractiveCommunication || "Sin registro"}</strong></p>
                <p><span className="text-slate-500">Última Modificación:</span> <span className="text-slate-700">{record.lastModificationTime}</span></p>
              </div>
            </div>
          </div>

          {/* Codes & Diagnostics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-slate-200 rounded-xl">
              <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Códigos CPT Facturados</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {record.codes.map((c) => (
                  <span key={c} className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md font-mono font-semibold">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 border border-slate-200 rounded-xl">
              <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>Condiciones & ICD-10</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {record.icd10s.map((icd) => (
                  <span key={icd} className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-md font-mono font-semibold">
                    {icd}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Condiciones: {record.conditions.join(", ") || "No especificadas"}
              </p>
            </div>
          </div>

          {/* Insurance & Address */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h4 className="font-semibold text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <span>Seguro & Datos Demográficos</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <p><span className="text-slate-500">Seguro Primario:</span> {record.primaryInsuranceName} ({record.primaryPolicyNumber || "Póliza no ingresada"})</p>
              {record.secondaryInsuranceName && (
                <p><span className="text-slate-500">Seguro Secundario:</span> {record.secondaryInsuranceName} ({record.secondaryPolicyNumber})</p>
              )}
              <p className="md:col-span-2"><span className="text-slate-500">Dirección:</span> {record.address || "Dirección no registrada"}</p>
            </div>
          </div>

          {/* Validation Errors list if any */}
          {record.validationErrors.length > 0 && (
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2">
              <h4 className="font-semibold text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Advertencias & Errores de Validación ({record.validationErrors.length})</span>
              </h4>
              <div className="space-y-1.5">
                {record.validationErrors.map((err) => (
                  <div key={err.id} className="p-2 bg-white rounded border border-rose-100 text-[11px]">
                    <span className="font-bold text-rose-800">[{err.severity}]</span> {err.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Multi-month Historical Timeline */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Historial Multimes del Paciente</h4>
            <div className="space-y-2">
              {patientHistory.map((h) => (
                <div key={h.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{h.monthOf}</span> • {h.serviceCode} • Care Manager: {h.careManagerName}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600 font-medium">Logs: {h.logEntries}</span>
                    <span className="text-emerald-700 font-bold">${h.monthlyBilling.toFixed(2)}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${h.payrollStatus === "Included" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                      {h.payrollStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Cambiar estado payroll:</span>
            <button
              onClick={() => toggleRecordPayrollStatus(record.id, "Included", "Aprobación manual")}
              className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-500"
            >
              Incluir
            </button>
            <button
              onClick={() => toggleRecordPayrollStatus(record.id, "Excluded", "Exclusión manual")}
              className="px-2.5 py-1 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-500"
            >
              Excluir
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
