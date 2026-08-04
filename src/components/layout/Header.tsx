import React from "react";
import { Calendar, LogOut, ShieldCheck } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";

export const Header: React.FC = () => {
  const { currentUserRole, globalFilters, setGlobalFilters } = useApp();
  const { user, logout } = useAuth();

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-[1700px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-indigo-700 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/20">
            I
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">ITERA CARE</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-widest">
                Analytics & Payroll Hub
              </span>
            </div>
            <p className="text-xs text-slate-400 font-normal hidden sm:block">
              ITERA HEALTH Platform • Care Management Analytics
            </p>
          </div>
        </div>

        {/* Center/Right Action Buttons & Role Selector */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Month Selector Quick Filter */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium">Periodo:</span>
            <select
              value={globalFilters.monthOf}
              onChange={(e) => setGlobalFilters((prev) => ({ ...prev, monthOf: e.target.value }))}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="2026-08" className="bg-slate-900 text-white">Agosto 2026</option>
              <option value="2026-07" className="bg-slate-900 text-white">Julio 2026</option>
              <option value="2026-06" className="bg-slate-900 text-white">Junio 2026</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-200 max-w-[160px] truncate" title={`${user?.email || ""} — ${currentUserRole}`}>
              {currentUserRole}
            </span>
          </div>
          <button onClick={() => void logout()} className="p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white" title="Cerrar sesión">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
