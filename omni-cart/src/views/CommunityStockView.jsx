import { useMemo, useState } from 'react';
import { PageHeader, KpiCard } from '../components/dashboard';
import { Badge, Button, Card } from '../components/ui';
import { COMMUNITY_STOCK_REPORTS, getStockProbabilityLabel } from '../mocks';

const initialForm = {
  partName: 'Arduino Uno R3',
  storeName: 'Alexan SM North EDSA',
  area: 'Quezon City',
  sourced: 'yes',
  lastSeen: 'today',
  note: '',
};

function probabilityVariant(probability) {
  if (probability >= 0.8) return 'success';
  if (probability >= 0.55) return 'warning';
  return 'neutral';
}

function calculateDemoProbability(report) {
  const base = report.sourced === 'yes' ? 0.68 : 0.28;
  const freshnessBoost = report.lastSeen === 'today' ? 0.16 : report.lastSeen === 'this-week' ? 0.08 : 0.02;
  const storeBoost = /alexan|deeco|makerlab|e-gizmo/i.test(report.storeName) ? 0.08 : 0.03;
  return Math.min(0.96, base + freshnessBoost + storeBoost);
}

export default function CommunityStockView() {
  const [reports, setReports] = useState(COMMUNITY_STOCK_REPORTS);
  const [form, setForm] = useState(initialForm);

  const topReports = useMemo(
    () => [...reports].sort((a, b) => b.probability - a.probability).slice(0, 5),
    [reports]
  );

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const probability = calculateDemoProbability(form);
    setReports((prev) => [
      {
        id: `stock-demo-${Date.now()}`,
        partName: form.partName,
        storeName: form.storeName,
        area: form.area,
        sourced: form.sourced === 'yes',
        lastSeen: form.lastSeen === 'today' ? 'just now' : form.lastSeen === 'this-week' ? 'this week' : 'recently',
        reportCount: 1,
        probability,
        note: form.note || 'Fresh community report from the mock stock form.',
      },
      ...prev,
    ]);
    setForm((prev) => ({ ...prev, note: '' }));
  };

  const successfulReports = reports.filter((report) => report.sourced).length;
  const averageProbability = Math.round(
    (reports.reduce((sum, report) => sum + report.probability, 0) / reports.length) * 100
  );

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <PageHeader
        title="Community Stock Signals"
        subtitle="Mock physical-store reports that feed the extension's local supplier labels"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Store Reports" value={reports.length} accent="accent" />
        <KpiCard label="Successful Sources" value={successfulReports} accent="bright" />
        <KpiCard label="Avg Probability" value={averageProbability} unit="%" accent="neutral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-6">
        <Card className="p-5">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4">
            Report a Physical Store
          </h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Component</span>
              <input
                value={form.partName}
                onChange={(event) => handleChange('partName', event.target.value)}
                className="w-full bg-surface-base border border-surface-card rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-accent/50"
                required
              />
            </label>

            <label className="block">
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Physical Store</span>
              <input
                value={form.storeName}
                onChange={(event) => handleChange('storeName', event.target.value)}
                className="w-full bg-surface-base border border-surface-card rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-accent/50"
                required
              />
            </label>

            <label className="block">
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Area</span>
              <input
                value={form.area}
                onChange={(event) => handleChange('area', event.target.value)}
                className="w-full bg-surface-base border border-surface-card rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-accent/50"
                required
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Did you source it?</span>
                <select
                  value={form.sourced}
                  onChange={(event) => handleChange('sourced', event.target.value)}
                  className="w-full bg-surface-base border border-surface-card rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-accent/50"
                >
                  <option value="yes">Yes, found it</option>
                  <option value="no">No, not available</option>
                </select>
              </label>

              <label className="block">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">When?</span>
                <select
                  value={form.lastSeen}
                  onChange={(event) => handleChange('lastSeen', event.target.value)}
                  className="w-full bg-surface-base border border-surface-card rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-accent/50"
                >
                  <option value="today">Today</option>
                  <option value="this-week">This week</option>
                  <option value="older">Older report</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Optional note</span>
              <textarea
                value={form.note}
                onChange={(event) => handleChange('note', event.target.value)}
                rows={3}
                className="w-full bg-surface-base border border-surface-card rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-accent/50 resize-none"
                placeholder="Shelf label, counter name, substitute part, or stock caveat"
              />
            </label>

            <Button className="w-full" type="submit">
              Add Mock Stock Report
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4">
              Highest Probability Stores
            </h2>
            <div className="space-y-3">
              {topReports.map((report) => (
                <div
                  key={report.id}
                  className="border border-surface-card/70 rounded-lg p-3 bg-surface-raised/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-200 truncate">{report.partName}</p>
                      <p className="text-xs text-slate-500 truncate">{report.storeName} - {report.area}</p>
                    </div>
                    <Badge variant={probabilityVariant(report.probability)}>
                      {Math.round(report.probability * 100)}%
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant={report.sourced ? 'success' : 'neutral'}>
                      {report.sourced ? 'Sourced' : 'Not found'}
                    </Badge>
                    <Badge variant="neutral">{report.lastSeen}</Badge>
                    <Badge variant="neutral">{report.reportCount} reports</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-3 leading-relaxed">{report.note}</p>
                  <p className="text-[10px] text-accent-bright uppercase tracking-wider font-bold mt-2">
                    {getStockProbabilityLabel(report.probability)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
