import { useState } from 'react';
import { SidebarNav } from '../components/dashboard';
import IngestionView from '../views/IngestionView';
import AntiFryMatrixView from '../views/AntiFryMatrixView';
import ProcurementMetricsView from '../views/ProcurementMetricsView';
import SavedBuildsView from '../views/SavedBuildsView';
import EcommerceInspirationView from '../views/EcommerceInspirationView';

const VIEW_MAP = {
  ingestion: IngestionView,
  builder: AntiFryMatrixView,
  metrics: ProcurementMetricsView,
  archive: SavedBuildsView,
  commerce: EcommerceInspirationView,
};

export default function DashboardShell({ initialView = 'ingestion' }) {
  const [activeView, setActiveView] = useState(initialView);
  const [mobileOpen, setMobileOpen] = useState(false);

  const ActiveComponent = VIEW_MAP[activeView] || IngestionView;

  return (
    <div className="min-h-screen bg-surface-base flex">
      <SidebarNav
        activeView={activeView}
        onNavigate={setActiveView}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <header className="lg:hidden flex items-center gap-3 p-3 border-b border-surface-card bg-surface-raised">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg bg-surface-card text-slate-300 hover:text-white"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-accent tracking-wider text-sm">OMNI-CART</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <ActiveComponent onNavigate={setActiveView} />
        </main>
      </div>
    </div>
  );
}
