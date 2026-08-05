import React from "react";
import { Calendar, LogOut, ShieldCheck } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import iteraHealthLogo from "../../assets/itera-official-logo.png";

export const Header: React.FC = () => {
  const { currentUserRole, globalFilters, setGlobalFilters } = useApp();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white text-slate-900 shadow-sm">
      <div className="flex w-full items-center justify-between gap-4 px-4 py-2 sm:px-5">
        {/* Left Branding */}
        <div className="flex min-w-0 items-center gap-4">
          <img
            src={iteraHealthLogo}
            alt="ITERA Health"
            className="h-11 w-auto max-w-[190px] shrink-0 object-contain object-left sm:h-12 sm:max-w-[220px]"
          />
          <div className="hidden h-9 w-px bg-slate-200 sm:block" aria-hidden="true" />
          <div className="hidden min-w-0 sm:block">
            <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.13em] text-sky-800">
              Analytics & Payroll Hub
            </span>
            <p className="mt-1 truncate text-xs font-medium text-slate-500">
              Care Management Analytics
            </p>
          </div>
        </div>

        {/* Center/Right Action Buttons & Role Selector */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Month Selector Quick Filter */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500 font-medium">Periodo:</span>
            <select
              value={globalFilters.monthOf}
              onChange={(e) => setGlobalFilters((prev) => ({ ...prev, monthOf: e.target.value }))}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="2026-08">Agosto 2026</option>
              <option value="2026-07">Julio 2026</option>
              <option value="2026-06">Junio 2026</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-slate-700 max-w-[160px] truncate" title={`${user?.email || ""} — ${currentUserRole}`}>
              {currentUserRole}
            </span>
          </div>
          <button onClick={() => void logout()} className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900" title="Cerrar sesión">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
