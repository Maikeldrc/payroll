import React, { useState } from "react";
import { DollarSign, TrendingUp, BarChart, Sliders, AlertCircle, ArrowUpRight, ChevronRight, Layers } from "lucide-react";
import { useApp } from "../../context/AppContext";

export const RevenueAnalysisTab: React.FC<{ onDrillDown: (filter: { serviceCode?: string }) => void }> = ({ onDrillDown }) => {
  const { records, payrollCalculations, globalFilters } = useApp();
  const [conversionBoost, setConversionBoost] = useState<number>(5); // Default +5% simulation

  const currentMonth = globalFilters.monthOf || "2026-07";
  const monthRecords = records.filter((r) => r.monthOf === currentMonth);

  const directRevenue = monthRecords.reduce((acc, r) => acc + r.monthlyBilling, 0);
  const attributedSavings = directRevenue * 0.18; // 18% estimated shared savings
  const ancillaryRevenue = directRevenue * 0.10; // 10% AWV/specialist referrals
  const totalAttributedRevenue = directRevenue + attributedSavings + ancillaryRevenue;

  const finalPayroll = payrollCalculations.length > 0
    ? payrollCalculations.reduce((acc, c) => acc + c.netPay, 0)
    : 24750;

  const payrollToDirectRatio = directRevenue > 0 ? (finalPayroll / directRevenue) * 100 : 0;
  const payrollToAttributedRatio = totalAttributedRevenue > 0 ? (finalPayroll / totalAttributedRevenue) * 100 : 0;
  const revenueAfterPayroll = totalAttributedRevenue - finalPayroll;

  const uniqueActivePatients = new Set(monthRecords.map((r) => r.mrn)).size || 1;
  const uniqueBillablePatients = new Set(monthRecords.filter((r) => r.monthlyBilling > 0).map((r) => r.mrn)).size || 1;

  const avgRevPerActive = (directRevenue / uniqueActivePatients).toFixed(2);
  const avgRevPerBillable = (directRevenue / uniqueBillablePatients).toFixed(2);

  const totalDocHours = monthRecords.reduce((acc, r) => acc + r.logEntries * 0.4, 0) || 1;
  const revPerDocHour = (directRevenue / totalDocHours).toFixed(2);
  const revPerCM = (directRevenue / 11).toFixed(2);

  // Projection simulation
  const projectedExtraRevenue = directRevenue * (conversionBoost / 100);
  const newProjectedDirectRevenue = directRevenue + projectedExtraRevenue;

  return (
    <div className="space-y-6">
      {/* Disclaimer Warning Banner Requirement #10 */}
      <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-900 shadow-xs">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="font-bold text-amber-900 text-sm">Aclaración de Gobernanza Financiera:</strong>
          <p className="text-amber-800 leading-relaxed">
            El indicador <strong>"Revenue after Payroll"</strong> ($
            {revenueAfterPayroll.toLocaleString("en-US", { minimumFractionDigits: 2 })}) representa el margen financiero disponible tras deducir el costo directo de nómina de los Care Managers. <strong>NO representa la utilidad neta final del programa</strong>, ya que no deduce costos indirectos de infraestructura, licencias de software EMR/RPM, supervisión médica u otros gastos administrativos.
          </p>
        </div>
      </div>

      {/* Main Revenue KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-medium">Direct CPT Revenue</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            ${directRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-medium">Attributed Revenue Total</span>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            ${totalAttributedRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-medium">Payroll / Direct Revenue</span>
          <div className="text-xl font-bold text-indigo-600 mt-1">{payrollToDirectRatio.toFixed(1)}%</div>
          <span className="text-[10px] text-slate-400">Meta: 30% - 40%</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-medium">Payroll / Attributed Rev</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{payrollToAttributedRatio.toFixed(1)}%</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-medium">Revenue after Payroll</span>
          <div className="text-xl font-bold text-emerald-700 mt-1">
            ${revenueAfterPayroll.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-medium">Revenue / Doc Hour</span>
          <div className="text-xl font-bold text-indigo-700 mt-1">${revPerDocHour} / h</div>
        </div>
      </div>

      {/* Revenue Breakdown by Service & Averages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Service Revenue Composition */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
          <h4 className="font-bold text-slate-900 text-sm flex items-center justify-between">
            <span>Composición del Revenue Directo por Servicio</span>
            <span className="text-slate-400 font-normal">Mes: {currentMonth}</span>
          </h4>

          <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
            {(() => {
              const serviceMap = monthRecords.reduce((acc, r) => {
                const code = r.serviceCode || "CCM";
                acc[code] = (acc[code] || 0) + r.monthlyBilling;
                return acc;
              }, {} as Record<string, number>);

              const entries = Object.entries(serviceMap).sort((a, b) => b[1] - a[1]);

              if (entries.length === 0) {
                return <p className="text-slate-400 italic">No hay registros de facturación en el mes.</p>;
              }

              return entries.map(([code, rev]) => {
                const pct = directRevenue > 0 ? ((rev / directRevenue) * 100).toFixed(1) : "0.0";
                const count = monthRecords.filter((r) => r.serviceCode === code).length;
                return (
                  <div
                    key={code}
                    onClick={() => onDrillDown({ serviceCode: code })}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-indigo-50/60 hover:border-indigo-300 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{code}</span>
                      <p className="text-[11px] text-slate-500">{count} registros en este mes</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-indigo-900 text-sm">
                        ${rev.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-indigo-700 font-bold">{pct}% del Revenue Directo</span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Financial Averages */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
          <h4 className="font-bold text-slate-900 text-sm">Promedios Financieros de Rendimiento</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500">Revenue / Active Patient</span>
              <div className="text-lg font-bold text-slate-900 mt-1">${avgRevPerActive}</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500">Revenue / Billable Patient</span>
              <div className="text-lg font-bold text-emerald-700 mt-1">${avgRevPerBillable}</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500">Revenue / Care Manager</span>
              <div className="text-lg font-bold text-indigo-700 mt-1">${revPerCM}</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500">Ingreso Atribuido / CM</span>
              <div className="text-lg font-bold text-slate-900 mt-1">
                ${(totalAttributedRevenue / 11).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Projection Simulator */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h4 className="font-bold text-white text-base">Simulador Interactivo de Proyección de Revenue</h4>
          </div>
          <span className="text-xs text-indigo-300 font-mono">Modelo predictivo de incremento en conversión billable</span>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
          <div className="space-y-2 flex-1 w-full">
            <div className="flex justify-between font-bold">
              <span>Incremento Simulado en Tasa de Conversión:</span>
              <span className="text-indigo-400 text-sm">+{conversionBoost}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={conversionBoost}
              onChange={(e) => setConversionBoost(parseInt(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-6 min-w-[320px] justify-between">
            <div>
              <span className="text-slate-400">Ingreso Adicional Estimado:</span>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">
                +${projectedExtraRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })} / mes
              </div>
            </div>
            <div>
              <span className="text-slate-400">Nuevo Revenue Proyectado:</span>
              <div className="text-lg font-bold text-white mt-0.5">
                ${newProjectedDirectRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
