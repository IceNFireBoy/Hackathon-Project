import { Button, Card, CardRow, ConfidencePill, SectionHeader, SkeletonCard } from './ui';
import { useAnalyzeParts } from '../hooks/useAnalyzeParts';
import { COMMUNITY_STOCK_REPORTS, getStockProbabilityLabel } from '../mocks';

function statusColor(status) {
  if (status.includes('Error') || status.includes('failed')) return 'text-critical';
  if (status.includes('Analyzing') || status.includes('Scanning') || status.includes('Initializing')) return 'text-accent-bright';
  if (status.includes('Mapping') || status.includes('GPS') || status.includes('Recalculating')) return 'text-accent';
  return 'text-slate-400';
}

export function ExtensionHeader({ scanStatus, isAnalyzing }) {
  return (
    <header className="border-b border-surface-card/60 p-3 shrink-0 bg-surface-base z-10">
      <div className="flex items-center space-x-2">
        <img src="/OMNI_CART_LOGO_TRANS.png" alt="Logo" className="w-6 h-6 object-contain" />
        <h1 className="text-lg font-bold tracking-wide text-accent">
          OMNI<span className="text-gray-100">-CART</span>
        </h1>
      </div>
      <div className="flex items-center justify-center gap-2 mt-1">
        {isAnalyzing && (
          <svg className="animate-spin h-3 w-3 text-accent-bright shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        <p className={`text-[11px] animate-pulse truncate max-w-[320px] ${statusColor(scanStatus)}`}>
          {scanStatus}
        </p>
      </div>
    </header>
  );
}

export function ScanSkeleton({ scanStatus }) {
  return (
    <div className="space-y-4 pt-2">
      <div>
        <div className="h-3 w-28 oc-skeleton mb-2 ml-1" />
        <SkeletonCard rows={3} tint="accent" />
      </div>
      <div>
        <div className="h-3 w-32 oc-skeleton mb-2 ml-1 bg-accent/20" />
        <SkeletonCard rows={2} tint="bright" />
      </div>
      <p className="text-xs text-slate-500 text-center animate-pulse pt-2">{scanStatus}</p>
    </div>
  );
}

export function DevSimulateButton({ onResult, onStart, onEnd }) {
  const { analyze } = useAnalyzeParts();

  const handleSimulate = async () => {
    onStart();
    try {
      const result = await analyze({
        sourceType: 'article',
        data: 'You need an Arduino, a servo, and jumper wires.',
      });
      onResult(result);
    } catch {
      // error handled by hook
    } finally {
      onEnd();
    }
  };

  return (
    <Button variant="outline" className="w-full" onClick={handleSimulate}>
      [DEV] Simulate Content Scan
    </Button>
  );
}

export function ReadyCartSection({ items, components, onToggleCheck }) {
  if (items.length === 0) {
    return (
      <section className="w-full">
        <SectionHeader title="Ready for Cart" count={0} variant="accent" />
        <p className="text-xs text-slate-500 pl-1">No high-confidence components detected.</p>
      </section>
    );
  }

  return (
    <section className="w-full">
      <SectionHeader title="Ready for Cart" count={items.length} variant="accent" />
      <Card variant="accent">
        <div className="oc-row-divider">
          {items.map((item) => {
            const originalIndex = components.indexOf(item);
            return (
              <CardRow key={originalIndex}>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => onToggleCheck(originalIndex)}
                  className="w-4 h-4 accent-accent cursor-pointer shrink-0 mr-3"
                />
                {item.quantity > 1 && (
                  <span className="text-[10px] font-bold text-accent-bright bg-surface-base px-1.5 py-0.5 rounded border border-accent/20 shrink-0 mr-2">
                    {item.quantity}x
                  </span>
                )}
                <span className="text-sm font-medium tracking-wide flex-1 text-slate-200 min-w-0 truncate">
                  {item.name}
                </span>
                <ConfidencePill score={item.confidence_score} />
              </CardRow>
            );
          })}
        </div>
      </Card>
    </section>
  );
}

export function UnsureSection({ items, components, onToggleCheck, onNameChange }) {
  if (items.length === 0) {
    return (
      <section className="w-full">
        <SectionHeader title="Unsure Components" count={0} variant="bright" />
        <p className="text-xs text-slate-500 pl-1">All components passed confidence threshold.</p>
      </section>
    );
  }

  return (
    <section className="w-full">
      <SectionHeader title="Unsure Components" count={items.length} variant="bright" />
      <Card variant="bright">
        <div className="oc-row-divider">
          {items.map((item) => {
            const originalIndex = components.indexOf(item);
            return (
              <CardRow key={originalIndex} className="flex-col !items-stretch gap-2">
                <div className="flex items-center w-full min-w-0">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => onToggleCheck(originalIndex)}
                    className="w-4 h-4 accent-accent-bright cursor-pointer shrink-0 mr-3"
                  />
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => onNameChange(originalIndex, e.target.value)}
                    className="bg-surface-base border border-surface-card rounded text-sm w-full min-w-0 px-2 py-1 text-slate-200 focus:border-accent-bright/50 outline-none"
                  />
                  <div className="ml-2 shrink-0">
                    <ConfidencePill score={item.confidence_score} />
                  </div>
                </div>
              </CardRow>
            );
          })}
        </div>
      </Card>
    </section>
  );
}

export function MapPanel({
  mapIsVisible,
  sortMode,
  onFindLocally,
  onSortChange,
  components = [],
}) {
  const componentNames = components.map((component) => component.name.toLowerCase());
  const stockSignals = COMMUNITY_STOCK_REPORTS
    .filter((report) =>
      componentNames.some((name) => {
        const reportPart = report.partName.toLowerCase();
        return name.includes(reportPart) || reportPart.includes(name.split(/\s+/)[0]);
      })
    )
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3);

  return (
    <div className="p-3 pt-2 border-t border-surface-card/60 shrink-0 bg-surface-base z-10 flex flex-col space-y-2">
      <div
        className={`transition-all duration-300 overflow-hidden rounded-lg border border-surface-card bg-surface-raised ${
          mapIsVisible ? 'h-[220px] opacity-100' : 'h-0 opacity-0 border-0'
        }`}
      >
        <iframe
          id="map-sandbox"
          src="sandbox.html"
          width="100%"
          height="100%"
          allow="geolocation"
          title="Local supplier map"
          className="w-full h-full rounded-lg"
        />
      </div>

      {mapIsVisible ? (
        <div className="flex space-x-2">
          <Button
            variant={sortMode === 'trusted' ? 'primary' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => onSortChange('trusted')}
          >
            Most Trusted
          </Button>
          <Button
            variant={sortMode === 'distance' ? 'primary' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => onSortChange('distance')}
          >
            Closest Dist.
          </Button>
        </div>
      ) : (
        <Button className="w-full" size="lg" onClick={() => onFindLocally()}>
          Find Locally
        </Button>
      )}

      {mapIsVisible && stockSignals.length > 0 && (
        <div className="space-y-2">
          <SectionHeader title="Community Stock" count={stockSignals.length} variant="bright" className="mb-1" />
          <div className="grid gap-2">
            {stockSignals.map((signal) => (
              <Card key={signal.id} className="p-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-200 truncate">{signal.storeName}</p>
                    <p className="text-[10px] text-slate-500 truncate">{signal.partName}</p>
                  </div>
                  <span className="text-xs font-black text-accent-bright shrink-0">
                    {Math.round(signal.probability * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <p className="text-[10px] text-slate-400 truncate">{signal.lastSeen} - {signal.reportCount} reports</p>
                  <p className="text-[9px] uppercase tracking-wider text-accent font-bold shrink-0">
                    {getStockProbabilityLabel(signal.probability)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
