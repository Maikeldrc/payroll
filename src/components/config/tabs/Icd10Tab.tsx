import React, { useState } from "react";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  CheckCircle2,
  BookOpen,
  FolderTree,
  Check,
  Tag,
  AlertTriangle,
  Layers,
  ChevronRight,
} from "lucide-react";
import { ICD10Code, ServiceICD10CodeSet, ConfigUserRole } from "../../../types";

interface Icd10TabProps {
  icd10Codes: ICD10Code[];
  serviceCodeSets: ServiceICD10CodeSet[];
  userRole: ConfigUserRole;
  onSelectCodeSet: (codeSet: ServiceICD10CodeSet) => void;
  onAddCodeSet: () => void;
  onDeactivateCodeSet: (codeSet: ServiceICD10CodeSet) => void;
}

export const Icd10Tab: React.FC<Icd10TabProps> = ({
  icd10Codes,
  serviceCodeSets,
  userRole,
  onSelectCodeSet,
  onAddCodeSet,
  onDeactivateCodeSet,
}) => {
  const [subView, setSubView] = useState<"codeSets" | "referenceLibrary">("codeSets");
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState<string>("ALL");

  const canEdit = ["System Administrator", "Clinical Administrator"].includes(userRole);

  const filteredCodeSets = serviceCodeSets.filter((cs) => {
    const matchesSearch =
      cs.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cs.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cs.serviceCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesService = serviceFilter === "ALL" || cs.serviceCode === serviceFilter;

    return matchesSearch && matchesService;
  });

  const filteredReferenceCodes = icd10Codes.filter((icd) => {
    return (
      icd.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      icd.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      icd.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Sub-view Switcher & Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center font-bold text-xs">
            <button
              onClick={() => setSubView("codeSets")}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                subView === "codeSets"
                  ? "bg-white text-indigo-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <FolderTree className="w-4 h-4 text-indigo-600" />
              Service Code Sets (Sets por Servicio)
            </button>
            <button
              onClick={() => setSubView("referenceLibrary")}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                subView === "referenceLibrary"
                  ? "bg-white text-indigo-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <BookOpen className="w-4 h-4 text-teal-600" />
              ICD-10 Reference Library
            </button>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 flex-1 md:flex-initial">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={
                subView === "codeSets"
                  ? "Buscar Code Set (CCM, RPM, Diabetes...)"
                  : "Buscar Código ICD-10 (E11.9, I10...)"
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {subView === "codeSets" && canEdit && (
            <button
              onClick={onAddCodeSet}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              + Create Code Set
            </button>
          )}

          <button className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors shrink-0">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* VIEW 1: Service Code Sets */}
      {subView === "codeSets" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCodeSets.map((cs) => {
            return (
              <div
                key={cs.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-1 bg-indigo-900 text-indigo-300 font-mono text-xs font-black rounded-lg">
                      {cs.serviceCode}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                      {cs.status} • v{cs.version}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">{cs.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cs.description}</p>

                  <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold">
                      <span>Códigos Incluidos ({cs.includedCodes.length}):</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {cs.includedCodes.map((code) => (
                        <span
                          key={code}
                          className="px-2 py-0.5 bg-white text-indigo-900 font-mono font-bold text-[10px] rounded border border-slate-200"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Vigencia: {cs.effectiveDate}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectCodeSet(cs)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5 text-indigo-400" />
                      Editar Set
                    </button>

                    {canEdit && (
                      <button
                        onClick={() => onDeactivateCodeSet(cs)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VIEW 2: ICD-10 Reference Library Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="p-3">Código ICD-10</th>
                  <th className="p-3">Descripción Clínica CMS</th>
                  <th className="p-3">Categoría Diagnóstica</th>
                  <th className="p-3 text-center">Facturable</th>
                  <th className="p-3 text-center">Año CMS</th>
                  <th className="p-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReferenceCodes.map((icd) => (
                  <tr key={icd.code} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                        {icd.code}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{icd.description}</td>
                    <td className="p-3 text-slate-600">{icd.category}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                        Sí (Billable)
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono text-slate-600">{icd.effectiveYear || "2026"}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
