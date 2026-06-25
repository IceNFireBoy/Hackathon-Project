import { useMemo, useState } from 'react';
import { PageHeader, KpiCard } from '../components/dashboard';
import { Card, Button, Badge, SkeletonCard } from '../components/ui';
import { useBuildContext } from '../context/BuildContext';
import { slotsToComponentList } from '../utils/voltageAnalysis';

function ScanningBanner({ loading, error, onRetry }) {
  if (!loading && !error) return null;

  return (
    <div className="mb-6 p-4 rounded-card border border-surface-card bg-surface-raised/60 flex items-center gap-3">
      {loading && (
        <>
          <svg className="animate-spin h-5 w-5 text-accent shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm text-accent-bright">Build 4 scraper scanning Shopee & Lazada listings…</p>
        </>
      )}
      {error && !loading && (
        <>
          <Badge variant="danger">Scan failed</Badge>
          <p className="text-sm text-slate-400 flex-1">{error}</p>
          <Button size="sm" variant="ghost" onClick={onRetry}>Retry</Button>
        </>
      )}
    </div>
  );
}

function StoreDistributionChart({ distribution, loading }) {
  if (loading) {
    return (
      <Card className="p-5">
        <SkeletonCard rows={4} tint="accent" />
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <h3 className="text-sm font-bold text-slate-300 mb-4">Store Distribution</h3>
      <div className="space-y-3">
        {distribution.map((item) => (
          <div key={item.store}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">{item.store}</span>
              <span className="text-slate-300 font-mono">{item.share}%</span>
            </div>
            <div className="h-2 bg-surface-raised rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${item.share}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ScraperResultsTable({ listings, loading }) {
  if (loading) {
    return (
      <Card className="p-5">
        <SkeletonCard rows={5} tint="bright" />
      </Card>
    );
  }

  if (!listings.length) {
    return (
      <Card className="p-5">
        <p className="text-sm text-slate-500">No scraper results yet. Import or scan components first.</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="px-4 py-2 bg-surface-raised/40 border-b border-surface-card/60 grid grid-cols-[1fr_auto_auto_auto] gap-4 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
        <span>Part</span>
        <span>Store</span>
        <span>Stock</span>
        <span className="text-right">Price</span>
      </div>
      <div className="oc-row-divider max-h-72 overflow-y-auto">
        {listings.map((item) => (
          <div
            key={item.id}
            className="px-4 py-3 grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center border-b border-surface-card/40 last:border-0 text-sm"
          >
            <span className="text-slate-200 truncate">{item.partName}</span>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold uppercase tracking-wider text-accent-bright hover:text-accent underline"
            >
              {item.store}
            </a>
            <span className="text-xs text-slate-500">{item.stock}</span>
            <span className="text-accent-bright font-mono text-right">₱{item.pricePHP}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function InvoiceModal({ lineItems, total, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div
        className="bg-surface-raised border border-surface-card rounded-card shadow-card max-w-lg w-full max-h-[80vh] overflow-y-auto animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-surface-card flex justify-between items-start">
          <div>
            <h2 className="text-lg font-black text-accent">Invoice Preview</h2>
            <p className="text-xs text-slate-500 mt-1">Generated from live build + scraper data</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-accent-bright text-xl">&times;</button>
        </div>
        <div className="p-6 space-y-4 text-sm">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-surface-card">
                <th className="text-left py-2">Item</th>
                <th className="text-center py-2">Qty</th>
                <th className="text-right py-2">Price</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, i) => (
                <tr key={i} className="border-b border-surface-card/50">
                  <td className="py-2 text-slate-300">{item.name}</td>
                  <td className="py-2 text-center text-slate-400">{item.qty}</td>
                  <td className="py-2 text-right font-mono text-accent-bright">₱{(item.qty * item.unitPrice).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between pt-2 border-t border-surface-card font-bold">
            <span>Total</span>
            <span className="text-accent text-lg">₱{total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProcurementMetricsView() {
  const {
    buildSlots,
    buildName,
    scrapeListings,
    scrapeDistribution,
    scrapeTotals,
    scrapeLoading,
    scrapeError,
    estimatedTotal,
    refreshScrape,
  } = useBuildContext();

  const [showInvoice, setShowInvoice] = useState(false);

  const components = useMemo(() => slotsToComponentList(buildSlots), [buildSlots]);

  const costBreakdown = useMemo(() => {
    const buckets = {};
    scrapeListings.forEach((item) => {
      const key = item.partName;
      const line = item.pricePHP * item.quantity;
      if (!buckets[key] || line < buckets[key]) buckets[key] = line;
    });
    return Object.entries(buckets).map(([name, cost]) => ({
      category: name,
      cost,
    }));
  }, [scrapeListings]);

  const invoiceLineItems = useMemo(
    () =>
      components.map((c) => ({
        name: c.name,
        qty: c.quantity || 1,
        unitPrice: scrapeListings.find((l) => l.partName === c.name)?.pricePHP || c.price || 0,
      })),
    [components, scrapeListings]
  );

  const kpis = {
    totalCostPHP: estimatedTotal,
    itemCount: scrapeTotals?.itemCount ?? components.length,
    avgLeadTimeDays: scrapeTotals?.avgLeadTimeDays ?? '—',
    storesCompared: scrapeTotals?.storesCompared ?? 0,
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <PageHeader title="Procurement & Metrics" subtitle={buildName}>
        <Button size="sm" onClick={() => setShowInvoice(true)} disabled={scrapeLoading || !components.length}>
          Generate PDF Invoice
        </Button>
      </PageHeader>

      <ScanningBanner loading={scrapeLoading} error={scrapeError} onRetry={refreshScrape} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Cost" value={`₱${kpis.totalCostPHP.toLocaleString()}`} accent="accent" />
        <KpiCard label="Items" value={kpis.itemCount} accent="bright" />
        <KpiCard label="Avg Lead Time" value={kpis.avgLeadTimeDays} unit="days" accent="warning" />
        <KpiCard label="Stores Compared" value={kpis.storesCompared} accent="neutral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <StoreDistributionChart distribution={scrapeDistribution} loading={scrapeLoading} />

        <Card className="p-5">
          <h3 className="text-sm font-bold text-slate-300 mb-4">Cost Breakdown</h3>
          {scrapeLoading ? (
            <SkeletonCard rows={4} tint="accent" />
          ) : (
            <div className="space-y-2">
              {costBreakdown.map((item) => (
                <div key={item.category} className="flex justify-between items-center py-2 border-b border-surface-card/50 last:border-0">
                  <span className="text-sm text-slate-400 truncate pr-4">{item.category}</span>
                  <span className="text-sm font-mono text-accent-bright shrink-0">₱{item.cost.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <ScraperResultsTable listings={scrapeListings} loading={scrapeLoading} />

      {showInvoice && (
        <InvoiceModal
          lineItems={invoiceLineItems}
          total={estimatedTotal}
          onClose={() => setShowInvoice(false)}
        />
      )}
    </div>
  );
}
