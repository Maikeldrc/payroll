import React, { useState } from "react";
import { AppProvider } from "./context/AppContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginScreen } from "./components/auth/LoginScreen";
import { Header } from "./components/layout/Header";
import { Sidebar, NavTab } from "./components/layout/Sidebar";
import { GlobalFiltersBar } from "./components/layout/GlobalFiltersBar";
import { ExecutiveDashboard } from "./components/dashboard/ExecutiveDashboard";
import { SecureExecutiveSummary } from "./components/dashboard/SecureExecutiveSummary";
import { roleHasPermission } from "../shared/authorization";
import { PerformancePayrollModule } from "./components/performance/PerformancePayrollModule";
import { CareManagerPerformance } from "./components/caremanager/CareManagerPerformance";
import { PayrollCenter } from "./components/payroll/PayrollCenter";
import { DataQualityCenter } from "./components/quality/DataQualityCenter";
import { ReportsCenter } from "./components/reports/ReportsCenter";
import { ImportWizard } from "./components/import/ImportWizard";
import { ServiceAnalyticsView } from "./components/analytics/ServiceAnalyticsView";
import { ProviderPerformanceView } from "./components/analytics/ProviderPerformanceView";
import { ConfigurationView } from "./components/config/ConfigurationView";
import { AuditLogView } from "./components/audit/AuditLogView";
import { PatientDetailModal } from "./components/patient/PatientDetailModal";
import { CareManagerDetailModal } from "./components/caremanager/CareManagerDetailModal";
import { MonthlyManagementRecord, CareManager } from "./types";

const MainContent: React.FC = () => {
  const { claims } = useAuth();
  const demoMode = import.meta.env.VITE_DEMO_MODE === "true";
  const [activeTab, setActiveTab] = useState<NavTab>(() => claims?.role === "Executive Viewer" ? "dashboard" : "performance-payroll");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Modals & Drawers state
  const [selectedPatient, setSelectedPatient] = useState<MonthlyManagementRecord | null>(null);
  const [selectedCareManager, setSelectedCareManager] = useState<CareManager | null>(null);
  const canViewPatientData = Boolean(claims && roleHasPermission(claims.role, "patient:view"));
  const canViewOperationalPerformance = Boolean(claims && canViewPatientData && roleHasPermission(claims.role, "performance:view"));

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <Header />

      {/* Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />

        {/* Right Content Area */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          {/* Global Filters */}
          <GlobalFiltersBar activeTab={activeTab} />

          <div className="p-4 sm:p-6 max-w-[1700px] w-full mx-auto flex-1">
            {activeTab === "performance-payroll" && (demoMode || canViewPatientData) && <PerformancePayrollModule />}
            {activeTab === "performance-payroll" && !demoMode && !canViewPatientData && <SecureExecutiveSummary />}

            {activeTab === "dashboard" && !demoMode && !canViewOperationalPerformance && <SecureExecutiveSummary />}
            {activeTab === "dashboard" && demoMode && claims?.role === "Executive Viewer" && <SecureExecutiveSummary />}

            {activeTab === "dashboard" && (canViewOperationalPerformance || (demoMode && claims?.role !== "Executive Viewer")) && (
              <ExecutiveDashboard
                onOpenPatient={(rec) => setSelectedPatient(rec)}
                onOpenCareManager={(cm) => setSelectedCareManager(cm)}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === "care-managers" && (demoMode || canViewPatientData) && (
              <CareManagerPerformance
                onOpenCareManager={(cm) => setSelectedCareManager(cm)}
              />
            )}

            {activeTab === "care-managers" && !demoMode && !canViewPatientData && <SecureExecutiveSummary />}

            {activeTab === "payroll" && <PayrollCenter />}

            {activeTab === "providers" && (demoMode || canViewPatientData) && <ProviderPerformanceView />}
            {activeTab === "providers" && !demoMode && !canViewPatientData && <SecureExecutiveSummary />}

            {activeTab === "services" && (demoMode || canViewPatientData) && <ServiceAnalyticsView />}
            {activeTab === "services" && !demoMode && !canViewPatientData && <SecureExecutiveSummary />}

            {activeTab === "quality" && (demoMode || canViewPatientData) && (
              <DataQualityCenter
                onOpenPatient={(rec) => setSelectedPatient(rec)}
              />
            )}
            {activeTab === "quality" && !demoMode && !canViewPatientData && <SecureExecutiveSummary />}

            {activeTab === "import" && <ImportWizard onComplete={() => setActiveTab("dashboard")} />}

            {activeTab === "reports" && <ReportsCenter />}

            {activeTab === "config" && demoMode && <ConfigurationView />}
            {activeTab === "config" && !demoMode && <section className="rounded-2xl border border-amber-300 bg-amber-50 p-6"><h2 className="font-bold text-amber-950">Configuración protegida</h2><p className="mt-2 text-sm text-amber-900">La administración productiva se realiza mediante APIs y workflows autorizados; no se permiten cambios locales.</p></section>}

            {activeTab === "audit" && <AuditLogView />}
          </div>
        </main>
      </div>

      {/* Modals & Drawers */}
      <PatientDetailModal
        record={selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />

      <CareManagerDetailModal
        careManager={selectedCareManager}
        onClose={() => setSelectedCareManager(null)}
        onOpenPatient={(rec) => setSelectedPatient(rec)}
      />

    </div>
  );
};

const AuthenticatedApplication: React.FC = () => {
  const { user, claims, loading } = useAuth();
  if (loading) {
    return <main className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">Validando acceso seguro…</main>;
  }
  if (!user || !claims) return <LoginScreen />;
  return (
    <AppProvider key={user.uid} authenticatedRole={claims.role} authenticatedActor={user.uid}>
      <MainContent />
    </AppProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApplication />
    </AuthProvider>
  );
}
