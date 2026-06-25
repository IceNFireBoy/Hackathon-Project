import { useState } from 'react';
import { PageHeader, KpiCard } from '../components/dashboard';
import { Card, Button } from '../components/ui';
import {
  PROCUREMENT_KPIS,
  STORE_DISTRIBUTION,
  COST_BREAKDOWN,
  MOCK_INVOICE,
} from '../mocks';

function StoreDistributionChart() {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-bold text-slate-300 mb-4">Store Distribution</h3>
      <div className="space-y-3">
        {STORE_DISTRIBUTION.map((item) => (
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

function InvoiceModal({ onClose }) {
  const total = MOCK_INVOICE.lineItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div
        className="bg-surface-raised border border-surface-card rounded-card shadow-card max-w-lg w-full max-h-[80vh] overflow-y-auto animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-surface-card">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-black text-accent">Invoice Preview</h2>
              <p className="text-xs text-slate-500 mt-1">Mock PDF — demo only</p>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-accent-bright text-xl">&times;</button>
          </div>
        </div>
        <div className="p-6 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-slate-500">Invoice #</span><p className="font-mono">{MOCK_INVOICE.invoiceNumber}</p></div>
            <div><span className="text-slate-500">Date</span><p>{MOCK_INVOICE.date}</p></div>
            <div className="col-span-2"><span className="text-slate-500">Customer</span><p>{MOCK_INVOICE.customer}</p></div>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-surface-card">
                <th className="text-left py-2">Item</th>
                <th className="text-center py-2">Qty</th>
                <th className="text-right py-2">Price</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_INVOICE.lineItems.map((item, i) => (
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
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceGenerated, setInvoiceGenerated] = useState(false);

  const handleGenerateInvoice = () => {
    setInvoiceGenerated(true);
    setShowInvoice(true);
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <PageHeader
        title="Procurement & Metrics"
        subtitle="Cost estimates and store distribution for your current build"
      >
        <Button size="sm" onClick={handleGenerateInvoice}>
          {invoiceGenerated ? 'View Invoice' : 'Generate PDF Invoice'}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Cost" value={`₱${PROCUREMENT_KPIS.totalCostPHP.toLocaleString()}`} accent="accent" />
        <KpiCard label="Items" value={PROCUREMENT_KPIS.itemCount} accent="bright" />
        <KpiCard label="Avg Lead Time" value={PROCUREMENT_KPIS.avgLeadTimeDays} unit="days" accent="warning" />
        <KpiCard label="Stores Compared" value={PROCUREMENT_KPIS.storesCompared} accent="neutral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StoreDistributionChart />

        <Card className="p-5">
          <h3 className="text-sm font-bold text-slate-300 mb-4">Cost Breakdown</h3>
          <div className="space-y-2">
            {COST_BREAKDOWN.map((item) => (
              <div key={item.category} className="flex justify-between items-center py-2 border-b border-surface-card/50 last:border-0">
                <span className="text-sm text-slate-400">{item.category}</span>
                <span className="text-sm font-mono text-accent-bright">₱{item.cost.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {showInvoice && <InvoiceModal onClose={() => setShowInvoice(false)} />}
    </div>
  );
}
