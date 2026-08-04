import React, { useEffect, useState } from "react";
import { DollarSign, ShieldCheck, Stethoscope, Users } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { apiFetch } from "../../lib/apiClient";

interface Summary {
  monthOf: string;
  patients: number;
  billablePatients: number;
  totalBilling: number;
  services: Array<{ serviceCode: string; count: number }>;
}

export const SecureExecutiveSummary: React.FC = () => {
  const { globalFilters } = useApp();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setError(false);
    void apiFetch(`/api/dashboard/summary?monthOf=${encodeURIComponent(globalFilters.monthOf)}`).then(async (response) => {
      if (!response.ok) throw new Error("denied");
      const data = await response.json() as Summary;
      if (active) setSummary(data);
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [globalFilters.monthOf]);

  if (error) return <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-800">No fue posible cargar el resumen autorizado.</p>;
  if (!summary) return <p className="text-sm text-slate-500">Cargando agregaciones autorizadas…</p>;
  const cards = [
    { label: "Pacientes autorizados", value: summary.patients.toLocaleString(), icon: Users },
    { label: "Pacientes facturables", value: summary.billablePatients.toLocaleString(), icon: ShieldCheck },
    { label: "Facturación autorizada", value: `$${summary.totalBilling.toLocaleString()}`, icon: DollarSign },
    { label: "Servicios", value: summary.services.length.toLocaleString(), icon: Stethoscope },
  ];
  return <section className="space-y-5">
    <header><h1 className="text-2xl font-black text-slate-900">Executive Overview</h1><p className="text-sm text-slate-500">Agregaciones calculadas en backend; no se descargaron registros de pacientes.</p></header>
    <div className="grid gap-4 md:grid-cols-4">{cards.map(({ label, value, icon: Icon }) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><Icon className="h-5 w-5 text-indigo-600"/><p className="mt-3 text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-900">{value}</p></article>)}</div>
  </section>;
};
