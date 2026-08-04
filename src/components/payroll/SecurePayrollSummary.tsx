import React, { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { apiFetch } from "../../lib/apiClient";

interface PayrollRow { id: string; careManagerName: string; baseEarnings: number; bonuses: number; deductions: number; netPay: number; status: string; calculationVersion: number; integrityVerified: boolean }

export const SecurePayrollSummary: React.FC = () => {
  const { globalFilters } = useApp();
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => { let active = true; void apiFetch(`/api/payroll?monthOf=${encodeURIComponent(globalFilters.monthOf)}`).then(async (response) => {
    if (!response.ok) throw new Error("denied"); const payload = await response.json() as { rows: PayrollRow[] }; if (active) setRows(payload.rows);
  }).catch(() => { if (active) setError(true); }); return () => { active = false; }; }, [globalFilters.monthOf]);
  if (error) return <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-800">Payroll no disponible o fuera de scope.</p>;
  return <section className="space-y-4"><header><div className="flex items-center gap-2 text-emerald-700"><ShieldCheck className="h-5 w-5"/><span className="font-bold">Payroll backend-scoped</span></div><h1 className="mt-1 text-xl font-black">Resumen de payroll</h1></header>
    <div className="overflow-x-auto rounded-2xl border bg-white"><table className="w-full text-left text-xs"><thead className="bg-slate-100"><tr><th className="p-3">Care Manager</th><th>Base</th><th>Bonos</th><th>Deducciones</th><th>Neto</th><th>Estado</th><th>Integridad</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t"><td className="p-3 font-semibold">{row.careManagerName}</td><td>${row.baseEarnings.toFixed(2)}</td><td>${row.bonuses.toFixed(2)}</td><td>${row.deductions.toFixed(2)}</td><td>${row.netPay.toFixed(2)}</td><td>{row.status}</td><td>{row.integrityVerified ? `v${row.calculationVersion}` : "No verificada"}</td></tr>)}</tbody></table></div>
  </section>;
};
