import React, { useEffect } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  DollarSign,
  Building2,
  Stethoscope,
  ShieldAlert,
  FolderInput,
  FileSpreadsheet,
  Settings,
  History,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { roleHasPermission, type Permission } from "../../../shared/authorization";

export type NavTab =
  | "performance-payroll"
  | "dashboard"
  | "care-managers"
  | "payroll"
  | "providers"
  | "services"
  | "quality"
  | "import"
  | "reports"
  | "config"
  | "audit";

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
}) => {
  const { records, payrollCalculations } = useApp();
  const { claims } = useAuth();

  const totalErrors = records.reduce((acc, r) => acc + r.validationErrors.length, 0);
  const pendingPayroll = payrollCalculations.filter((c) => c.status !== "Approved" && c.status !== "Closed").length;

  const navItems = [
    {
      id: "performance-payroll" as NavTab,
      label: "Performance & Payroll",
      icon: BarChart3,
      badge: null,
      permission: "performance:view" as Permission,
    },
    {
      id: "dashboard" as NavTab,
      label: "Executive Overview",
      icon: LayoutDashboard,
      badge: null,
      permission: "dashboard:view" as Permission,
    },
    {
      id: "care-managers" as NavTab,
      label: "Care Manager Performance",
      icon: Users,
      badge: null,
      permission: "performance:view" as Permission,
    },
    {
      id: "payroll" as NavTab,
      label: "Payroll Center",
      icon: DollarSign,
      badge: pendingPayroll > 0 ? `${pendingPayroll}` : null,
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      permission: "payroll:view" as Permission,
    },
    {
      id: "providers" as NavTab,
      label: "Provider & Practice",
      icon: Building2,
      badge: null,
      permission: "performance:view" as Permission,
    },
    {
      id: "services" as NavTab,
      label: "Service Analytics",
      icon: Stethoscope,
      badge: null,
      permission: "performance:view" as Permission,
    },
    {
      id: "quality" as NavTab,
      label: "Data Quality Center",
      icon: ShieldAlert,
      badge: totalErrors > 0 ? `${totalErrors}` : null,
      badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
      permission: "quality:view" as Permission,
    },
    {
      id: "import" as NavTab,
      label: "Import Center",
      icon: FolderInput,
      badge: null,
      permission: "import:create" as Permission,
    },
    {
      id: "reports" as NavTab,
      label: "Reports Center",
      icon: FileSpreadsheet,
      badge: null,
      permission: "report:download" as Permission,
    },
    {
      id: "config" as NavTab,
      label: "Configuración & Reglas",
      icon: Settings,
      badge: null,
      permission: "configuration:view" as Permission,
    },
    {
      id: "audit" as NavTab,
      label: "Auditoría & Logs",
      icon: History,
      badge: null,
      permission: "audit:view" as Permission,
    },
  ];

  const permittedNavItems = claims ? navItems.filter((item) => roleHasPermission(claims.role, item.permission)) : [];

  useEffect(() => {
    if (permittedNavItems.length > 0 && !permittedNavItems.some((item) => item.id === activeTab)) {
      setActiveTab(permittedNavItems[0].id);
    }
  }, [activeTab, permittedNavItems, setActiveTab]);

  return (
    <aside
      className={`bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300 flex flex-col justify-between z-30 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="py-4">
        {/* Toggle Collapse */}
        <div className="px-3 pb-3 border-b border-slate-800/80 flex items-center justify-between">
          {!collapsed && (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2">
              Navegación Principal
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-auto"
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="mt-3 px-2 space-y-1">
          {permittedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}

                {!collapsed && item.badge && (
                  <span
                    className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                      item.badgeColor || "bg-indigo-100 text-indigo-700 border-indigo-200"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <span>Versión 3.2.0</span>
            <span className="text-emerald-400 font-semibold">• En Línea</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">ITERA Care Management Hub</p>
        </div>
      )}
    </aside>
  );
};
