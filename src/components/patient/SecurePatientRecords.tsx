import React from "react";
import { ShieldCheck } from "lucide-react";
import { useApp } from "../../context/AppContext";

export const SecurePatientRecords: React.FC = () => {
  const { records } = useApp();
  return <section className="space-y-4">
    <header><div className="flex items-center gap-2 text-emerald-700"><ShieldCheck className="h-5 w-5"/><span className="font-bold">Registros filtrados por backend</span></div><h1 className="mt-1 text-xl font-black text-slate-900">Pacientes autorizados</h1></header>
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="w-full text-left text-xs"><thead className="bg-slate-100"><tr><th className="p-3">MRN</th><th>Paciente</th><th>Práctica</th><th>Proveedor</th><th>Care Manager</th><th>Servicio</th><th>Elegibilidad</th></tr></thead>
      <tbody>{records.map((record) => <tr key={record.id} className="border-t border-slate-100"><td className="p-3 font-mono">{record.mrn}</td><td className="font-semibold">{record.patientName}</td><td>{record.practiceId}</td><td>{record.providerName}</td><td>{record.careManagerName}</td><td>{record.serviceCode}</td><td>{record.eligibility}</td></tr>)}</tbody></table></div>
  </section>;
};
