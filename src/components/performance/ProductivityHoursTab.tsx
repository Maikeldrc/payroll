import React, { useState } from "react";
import { Clock, AlertTriangle, CheckCircle, TrendingUp, Filter, Users, ShieldAlert, FileText, ChevronRight } from "lucide-react";
import { useApp } from "../../context/AppContext";

interface ProductivityHoursTabProps {
  onDrillDown: (filter: { cmId?: string; search?: string }) => void;
}

export const ProductivityHoursTab: React.FC<ProductivityHoursTabProps> = ({ onDrillDown }) => {
  const { careManagers, records, globalFilters } = useApp();
  const [adjustmentFactor, setAdjustmentFactor] = useState<number>(1.20);

  const currentMonth = globalFilters.monthOf || "2026-07";

  // Compute hours per CM
  const cmHoursList = careManagers.map((cm) => {
    const cmRecs = records.filter((r) => r.careManagerId === cm.id && r.monthOf === currentMonth);
    const documented = Number((cmRecs.reduce((acc, r) => acc + r.logEntries * 0.4, 0)).toFixed(1));
    const adjusted = Number((documented * adjustmentFactor).toFixed(1));
    const declared = 160; // 160h standard contract
    const utilization = Math.round((adjusted / declared) * 100);

    const isUnderDoc = utilization < 65;
    const isOverDecl = utilization > 125;

    return {
      cm,
      documented,
      adjusted,
      declared,
      utilization,
      isUnderDoc,
      isOverDecl,
      patientCount: cmRecs.length,
    };
  });

  const totalDoc = Number((cmHoursList.reduce((acc, h) => acc + h.documented, 0)).toFixed(1));
  const totalAdj = Number((totalDoc * adjustmentFactor).toFixed(1));
  const totalDecl = cmHoursList.reduce((acc, h) => acc + h.declared, 0);
  const teamUtilization = Math.round((totalAdj / totalDecl) * 100);

  const countUnderDoc = cmHoursList.filter((h) => h.isUnderDoc).length;
  const countOverDecl = cmHoursList.filter((h) => h.isOverDecl).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Adjustment Factor Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Módulo de Productividad, Horas & Utilización Laboral</h3>
          </div>
          <p className="text-xs text-slate-500">
            Compara horas documentadas en logs clínicos vs horas declaradas en nómina. Factor multiplicador para tiempo indirecto.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold">
          <span className="text-slate-600">Factor de Ajuste Tiempo Indirecto:</span>
          {[1.0, 1.15, 1.2, 1.25].map((factor) => (
            <button
              key={factor}
              onClick={() => setAdjustmentFactor(factor)}
              className={`px-3 py-1.5 rounded-lg transition-all font-bold ${
                adjustmentFactor === factor
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              ×{factor.toFixed(2)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-medium">Total Documented</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{totalDoc} h</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-medium">Adjusted Hours</span>
          <div className="text-xl font-bold text-indigo-600 mt-1">{totalAdj} h</div>
          <span className="text-[10px] text-indigo-800 font-bold">Factor ×{adjustmentFactor.toFixed(2)}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-medium">Declared Hours</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{totalDecl} h</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-medium">Team Utilization</span>
          <div className="text-xl font-bold text-emerald-600 mt-1">{teamUtilization}%</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-medium">Under-documentation</span>
          <div className="text-xl font-bold text-amber-600 mt-1">{countUnderDoc} CMs</div>
          <span className="text-[10px] text-amber-700 font-bold">&lt;65% utilización</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-medium">Over-declaration</span>
          <div className="text-xl font-bold text-rose-600 mt-1">{countOverDecl} CMs</div>
          <span className="text-[10px] text-rose-700 font-bold">&gt;125% utilización</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-medium">Quality Audit</span>
          <div className="text-xl font-bold text-emerald-600 mt-1">98.2%</div>
        </div>
      </div>

      {/* Activity Distribution Breakdown */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
        <h4 className="font-bold text-slate-900 text-sm">Distribución Estimada de Horas por Tipo de Actividad</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
            <div className="font-bold text-indigo-900">Interacción Directa con Paciente</div>
            <div className="text-lg font-bold text-indigo-700 mt-1">52% (915 h)</div>
            <span className="text-[10px] text-slate-500">Llamadas telefónicas y consultas</span>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="font-bold text-blue-900">Documentación Clínica en EMR</div>
            <div className="text-lg font-bold text-blue-700 mt-1">28% (492 h)</div>
            <span className="text-[10px] text-slate-500">Notas de progreso y care plans</span>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="font-bold text-emerald-900">Coordinación de Cuidados</div>
            <div className="text-lg font-bold text-emerald-700 mt-1">12% (211 h)</div>
            <span className="text-[10px] text-slate-500">Gestión de especialistas y recetas</span>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="font-bold text-amber-900">Revisión de Datos Fisiológicos</div>
            <div className="text-lg font-bold text-amber-700 mt-1">8% (141 h)</div>
            <span className="text-[10px] text-slate-500">Monitoreo lecturas RPM</span>
          </div>
        </div>
      </div>

      {/* Care Manager Hours Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 bg-slate-900 text-white font-bold text-xs flex items-center justify-between">
          <span>Detalle de Horas por Care Manager ({cmHoursList.length} Integrantes)</span>
          <span className="text-slate-400 font-mono text-[11px]">Periodo: {currentMonth}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Care Manager</th>
                <th className="p-3 text-right">Pacientes Asignados</th>
                <th className="p-3 text-right">Horas Documentadas</th>
                <th className="p-3 text-right">Horas Ajustadas (×{adjustmentFactor.toFixed(2)})</th>
                <th className="p-3 text-right">Horas Declaradas</th>
                <th className="p-3 text-right">Utilización</th>
                <th className="p-3 text-center">Inconsistencia / Alerta</th>
                <th className="p-3 text-center">Acción</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium">
              {cmHoursList.map((row) => (
                <tr key={row.cm.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-slate-900">{row.cm.name}</td>
                  <td className="p-3 text-right text-slate-600">{row.patientCount} pts</td>
                  <td className="p-3 text-right font-mono text-slate-700">{row.documented} h</td>
                  <td className="p-3 text-right font-mono font-bold text-indigo-600">{row.adjusted} h</td>
                  <td className="p-3 text-right font-mono text-slate-700">{row.declared} h</td>
                  <td className="p-3 text-right">
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        row.utilization >= 85 && row.utilization <= 110
                          ? "bg-emerald-100 text-emerald-800"
                          : row.utilization < 65
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {row.utilization}%
                    </span>
                  </td>

                  <td className="p-3 text-center">
                    {row.isUnderDoc && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full">
                        <AlertTriangle className="w-3 h-3" /> Bajo Registro (&lt;65%)
                      </span>
                    )}
                    {row.isOverDecl && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-900 rounded-full">
                        <AlertTriangle className="w-3 h-3" /> Sobre-Declarado (&gt;125%)
                      </span>
                    )}
                    {!row.isUnderDoc && !row.isOverDecl && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Normal
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-center">
                    <button
                      onClick={() => onDrillDown({ cmId: row.cm.id })}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[11px]"
                    >
                      Ver Logs Pacientes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
