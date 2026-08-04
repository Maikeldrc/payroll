import React, { useState } from "react";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Download,
  Upload,
  Edit,
  Trash2,
  CheckCircle2,
  Copy,
  Play,
  FileCode2,
  Check,
  Settings,
} from "lucide-react";
import { CatalogImportTemplate, ConfigUserRole } from "../../../types";

interface ImportTemplatesTabProps {
  templates: CatalogImportTemplate[];
  userRole: ConfigUserRole;
  onSelectTemplate: (template: CatalogImportTemplate) => void;
  onAddTemplate: () => void;
  onDuplicateTemplate: (template: CatalogImportTemplate) => void;
}

export const ImportTemplatesTab: React.FC<ImportTemplatesTabProps> = ({
  templates,
  userRole,
  onSelectTemplate,
  onAddTemplate,
  onDuplicateTemplate,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const canEdit = ["System Administrator", "Operations Administrator"].includes(userRole);

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.fileType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Local Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar plantilla de importación Excel/CSV..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={onAddTemplate}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              + Nueva Plantilla de Importación
            </button>
          )}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-800 font-mono text-xs font-bold rounded-lg border border-indigo-200 flex items-center gap-1">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                  {tpl.fileType}
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                  {tpl.status}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-base">{tpl.name}</h3>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                Columnas Esperadas: {tpl.expectedColumns.length} | Formato Fecha: {tpl.dateFormat}
              </p>

              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px] text-slate-700">
                <p>
                  <span className="font-bold text-slate-900">Mapeo de Alías:</span> {tpl.aliasRules}
                </p>
                <p>
                  <span className="font-bold text-slate-900">Regla Duplicados:</span> {tpl.duplicateDetectionRule}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">Modificado: {tpl.lastModified}</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onDuplicateTemplate(tpl)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  title="Duplicar Plantilla"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onSelectTemplate(tpl)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5 text-indigo-400" />
                  Editar Reglas
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
