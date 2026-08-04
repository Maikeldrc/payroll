import React, { useState } from "react";
import { Bookmark, Plus, Trash2, Check, X, Eye } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { GlobalFilterState } from "../../types";

export interface SavedViewPreset {
  id: string;
  name: string;
  description: string;
  filters: GlobalFilterState;
  createdAt: string;
}

const DEFAULT_PRESETS: SavedViewPreset[] = [
  {
    id: "PRESET-1",
    name: "Cierre de Mes — Todos los Care Managers",
    description: "Vista estándar para validación mensual de payroll y producción.",
    filters: {
      monthOf: "2026-07",
      monthRange: ["2026-06", "2026-07", "2026-08"],
      organizationId: "ORG-001",
      practiceId: "ALL",
      providerId: "ALL",
      careManagerId: "ALL",
      serviceCode: "ALL",
      insurance: "ALL",
      eligibility: "ALL",
      hmo: "ALL",
      cptCode: "ALL",
      condition: "ALL",
      icd10: "ALL",
      payrollStatus: "ALL",
      qualityStatus: "ALL",
      searchQuery: "",
    },
    createdAt: "2026-07-01",
  },
  {
    id: "PRESET-2",
    name: "Revisión Programa CCM — Solamente Elegibles",
    description: "Filtra pacientes activos de Chronic Care Management con seguro elegible.",
    filters: {
      monthOf: "2026-07",
      monthRange: ["2026-06", "2026-07", "2026-08"],
      organizationId: "ORG-001",
      practiceId: "ALL",
      providerId: "ALL",
      careManagerId: "ALL",
      serviceCode: "CCM",
      insurance: "ALL",
      eligibility: "Eligible",
      hmo: "ALL",
      cptCode: "ALL",
      condition: "ALL",
      icd10: "ALL",
      payrollStatus: "ALL",
      qualityStatus: "ALL",
      searchQuery: "",
    },
    createdAt: "2026-07-10",
  },
  {
    id: "PRESET-3",
    name: "Auditoría RPM — Pacientes <16 Días de Lectura",
    description: "Identifica pacientes RPM que requieren seguimiento para alcanzar la meta de facturación.",
    filters: {
      monthOf: "2026-07",
      monthRange: ["2026-06", "2026-07", "2026-08"],
      organizationId: "ORG-001",
      practiceId: "ALL",
      providerId: "ALL",
      careManagerId: "ALL",
      serviceCode: "RPM",
      insurance: "ALL",
      eligibility: "ALL",
      hmo: "ALL",
      cptCode: "ALL",
      condition: "ALL",
      icd10: "ALL",
      payrollStatus: "ALL",
      qualityStatus: "Has Errors",
      searchQuery: "",
    },
    createdAt: "2026-07-15",
  },
  {
    id: "PRESET-4",
    name: "Filtro Programa PCM — Principal Care Management",
    description: "Pacientes con una condición compleja bajo seguimiento de PCM (CPT 99424/99426).",
    filters: {
      monthOf: "2026-07",
      monthRange: ["2026-06", "2026-07", "2026-08"],
      organizationId: "ORG-001",
      practiceId: "ALL",
      providerId: "ALL",
      careManagerId: "ALL",
      serviceCode: "PCM",
      insurance: "ALL",
      eligibility: "Eligible",
      hmo: "ALL",
      cptCode: "ALL",
      condition: "ALL",
      icd10: "ALL",
      payrollStatus: "ALL",
      qualityStatus: "ALL",
      searchQuery: "",
    },
    createdAt: "2026-07-18",
  },
  {
    id: "PRESET-5",
    name: "Auditoría Behavioral Health (BHI / CoCM)",
    description: "Evaluación de pacientes integrados de salud mental con soporte psicoterapéutico.",
    filters: {
      monthOf: "2026-07",
      monthRange: ["2026-06", "2026-07", "2026-08"],
      organizationId: "ORG-001",
      practiceId: "ALL",
      providerId: "ALL",
      careManagerId: "ALL",
      serviceCode: "BHI",
      insurance: "ALL",
      eligibility: "ALL",
      hmo: "ALL",
      cptCode: "ALL",
      condition: "ALL",
      icd10: "ALL",
      payrollStatus: "ALL",
      qualityStatus: "ALL",
      searchQuery: "",
    },
    createdAt: "2026-07-20",
  },
];

interface SavedViewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPreset: (filters: GlobalFilterState) => void;
}

export const SavedViewsModal: React.FC<SavedViewsModalProps> = ({ isOpen, onClose, onApplyPreset }) => {
  const { globalFilters } = useApp();
  const [presets, setPresets] = useState<SavedViewPreset[]>(DEFAULT_PRESETS);
  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetDesc, setNewPresetDesc] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleSaveCurrentView = () => {
    if (!newPresetName.trim()) return;
    const newPreset: SavedViewPreset = {
      id: `PRESET-${Date.now()}`,
      name: newPresetName.trim(),
      description: newPresetDesc.trim() || "Filtros personalizados guardados por el usuario.",
      filters: { ...globalFilters },
      createdAt: new Date().toISOString().substring(0, 10),
    };
    setPresets([newPreset, ...presets]);
    setNewPresetName("");
    setNewPresetDesc("");
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    setPresets(presets.filter((p) => p.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">Vistas & Filtros Guardados</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Guarde la configuración actual de filtros globales o cargue combinaciones predefinidas para análisis acelerado.
        </p>

        {/* Add New Preset Section */}
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-xl text-xs hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Guardar Configuración Actual como Nueva Vista</span>
          </button>
        ) : (
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3 text-xs">
            <h4 className="font-bold text-slate-900">Guardar Filtros Actuales</h4>
            <input
              type="text"
              placeholder="Nombre de la vista (ej. Mi Equipo Norte)..."
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
            />
            <input
              type="text"
              placeholder="Descripción opcional..."
              value={newPresetDesc}
              onChange={(e) => setNewPresetDesc(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCurrentView}
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold"
              >
                Guardar Vista
              </button>
            </div>
          </div>
        )}

        {/* Presets List */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-300 flex items-center justify-between text-xs transition-colors"
            >
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span>{preset.name}</span>
                  <span className="text-[10px] text-slate-400 font-normal">{preset.createdAt}</span>
                </div>
                <p className="text-slate-500 text-[11px]">{preset.description}</p>
                <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
                  <span className="bg-slate-200/80 px-1.5 py-0.5 rounded text-slate-700 font-medium">
                    Mes: {preset.filters.monthOf}
                  </span>
                  {preset.filters.serviceCode !== "ALL" && (
                    <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-bold">
                      Servicio: {preset.filters.serviceCode}
                    </span>
                  )}
                  {preset.filters.eligibility !== "ALL" && (
                    <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                      Elegibilidad: {preset.filters.eligibility}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => {
                    onApplyPreset(preset.filters);
                    onClose();
                  }}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center gap-1 shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Aplicar</span>
                </button>
                <button
                  onClick={() => handleDelete(preset.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-200/50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
