const NAV_ITEMS = [
  { id: 'ingestion', label: 'Ingestion Zone' },
  { id: 'builder', label: "Anti-Fry Matrix" },
  { id: 'metrics', label: 'Procurement' },
  { id: 'stock', label: 'Stock Signals' },
  { id: 'archive', label: 'Saved Builds' },
  { id: 'commerce', label: 'E-Commerce Aggregator' },
];

export function KpiCard({ label, value, unit, accent = 'accent' }) {
  const accentClasses = {
    accent: 'text-accent border-accent/20',
    bright: 'text-accent-bright border-accent-bright/20',
    warning: 'text-accent border-accent/20',
    neutral: 'text-slate-300 border-surface-card/40',
  };

  return (
    <div className={`oc-card p-5 border ${accentClasses[accent] || accentClasses.accent}`}>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">{label}</p>
      <p className={`text-2xl font-black ${(accentClasses[accent] || accentClasses.accent).split(' ')[0]}`}>
        {value}
        {unit && <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>}
      </p>
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-black tracking-wide text-slate-100">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function SidebarNav({ activeView, onNavigate, mobileOpen, onMobileClose, footer }) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-50 bg-surface-raised border-r border-surface-card flex flex-col w-64 transition-transform duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="border-b border-surface-card">
          <div className="flex items-center space-x-3 px-4 py-6">
            <img src="/OMNI_CART_LOGO_TRANS.png" alt="Omni-Cart Logo" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="text-xl font-bold tracking-wider text-accent">
                OMNI<span className="text-gray-100">-CART</span>
              </h1>
              <p className="text-xs text-gray-500 uppercase tracking-widest">Maker Procurement</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onMobileClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors relative
                  ${isActive
                    ? 'text-accent-bright bg-accent-muted border-l-2 border-accent'
                    : 'text-slate-400 hover:text-accent hover:bg-surface-card/30 border-l-2 border-transparent'
                  }`}
              >
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-surface-card text-[10px] text-slate-600">
          {footer || 'Prototype Demo · v0.1'}
        </div>
      </aside>
    </>
  );
}

export { NAV_ITEMS };
