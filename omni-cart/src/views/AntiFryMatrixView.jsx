import { useState, useMemo } from 'react';
import { PageHeader } from '../components/dashboard';
import { Card, CardRow, Button, Badge, Tooltip } from '../components/ui';
import { useBuildContext } from '../context/BuildContext';
import { getSlotCategories } from '../utils/voltageAnalysis';

function StoreLink({ store, url }) {
  if (!store || !url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[10px] font-bold uppercase tracking-wider text-accent-bright hover:text-accent underline"
      onClick={(e) => e.stopPropagation()}
    >
      {store}
    </a>
  );
}

function CompatibilityBanner({ conflict, conflictResolved, ingestedFromScan }) {
  if (conflictResolved || !conflict) {
    return (
      <div className="sticky top-0 z-20 mb-6 p-4 rounded-card border border-accent/40 bg-accent-muted flex items-center gap-3">
        <div>
          <p className="text-sm font-bold text-accent-bright">Compatibility Verified</p>
          <p className="text-xs text-slate-400">All voltage levels are compatible. Build is ready for procurement.</p>
        </div>
        {ingestedFromScan && <Badge variant="gold" className="ml-auto">Ingested</Badge>}
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-20 mb-6 p-4 rounded-card border border-accent/30 bg-accent-muted flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-accent">Compatibility Issue</p>
        <p className="text-xs text-slate-300 mt-1">{conflict.message}</p>
      </div>
      <Badge variant="warning">Voltage Mismatch</Badge>
    </div>
  );
}

function ConflictResolutionPanel({ conflict, onResolve }) {
  const { alternative, physicsExplanation, reason } = conflict;

  return (
    <Card variant="bright" className="mb-6">
      <div className="p-4 border-b border-surface-card/60 bg-accent-muted/50">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-accent">Anti-Fry Resolution Required</h3>
          <Tooltip content={physicsExplanation}>
            <button type="button" className="text-xs text-slate-400 underline hover:text-accent-bright">Why?</button>
          </Tooltip>
        </div>
        {reason && (
          <div className="mt-3 p-3 rounded-lg border border-accent/40 bg-surface-base/60 flex gap-3">
            <span className="text-accent-bright text-lg leading-none shrink-0" aria-hidden>⚡</span>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-accent-bright font-bold mb-1">Tutor</p>
              <p className="text-xs text-slate-200 leading-relaxed">{reason}</p>
            </div>
          </div>
        )}
        <p className="text-xs text-slate-500 mt-3 leading-relaxed">{physicsExplanation}</p>
      </div>
      <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Suggested Alternative</p>
          <p className="text-sm font-medium text-slate-200">{alternative.name}</p>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{alternative.specs}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-black text-accent-bright">₱{alternative.price}</p>
          <Button size="sm" className="mt-2" onClick={() => onResolve(alternative)}>
            Use Logic Level Shifter
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function AntiFryMatrixView() {
  const {
    buildSlots,
    buildName,
    conflictResolved,
    ingestedFromScan,
    voltageConflict,
    resolveConflict,
    estimatedTotal,
    scrapeLoading,
  } = useBuildContext();

  const slotCategories = useMemo(() => getSlotCategories(buildSlots), [buildSlots]);
  const [activeCategory, setActiveCategory] = useState(null);

  const activeSlotId =
    activeCategory ||
    slotCategories[0]?.slotId ||
    Object.keys(buildSlots)[0];

  const hasConflict = Boolean(voltageConflict) && !conflictResolved;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <PageHeader title="Anti-Fry Builder's Matrix" subtitle={buildName} />

      <CompatibilityBanner
        conflict={voltageConflict}
        conflictResolved={conflictResolved}
        ingestedFromScan={ingestedFromScan}
      />

      {hasConflict && (
        <ConflictResolutionPanel conflict={voltageConflict} onResolve={resolveConflict} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4">
        <Card className="h-fit">
          <div className="p-2">
            {slotCategories.map(({ slotId, label }) => (
              <button
                key={slotId}
                type="button"
                onClick={() => setActiveCategory(slotId)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5
                  ${activeSlotId === slotId
                    ? 'bg-accent-muted text-accent-bright border-l-2 border-accent'
                    : 'text-slate-400 hover:bg-surface-card/40 hover:text-accent border-l-2 border-transparent'
                  }`}
              >
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <div className="px-4 py-2 bg-surface-raised/40 border-b border-surface-card/60 grid grid-cols-[1fr_auto_auto_auto] gap-4 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
            <span>Component</span>
            <span className="hidden sm:inline">Vendor</span>
            <span>Voltage</span>
            <span className="text-right">Price</span>
          </div>
          <div className="oc-row-divider">
            {slotCategories.map(({ slotId, label }) => {
              const slot = buildSlots[slotId];
              if (!slot) return null;
              const isAffected =
                hasConflict && voltageConflict.affectedSlots.includes(slotId);

              return (
                <CardRow
                  key={slotId}
                  className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center ${isAffected ? 'bg-accent-muted/40' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{slot.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase">{label}</p>
                    </div>
                    {isAffected && <Badge variant="warning">Mismatch</Badge>}
                  </div>
                  <span className="hidden sm:inline">
                    <StoreLink store={slot.store} url={slot.listingUrl} />
                  </span>
                  <span className={`text-xs font-mono ${isAffected ? 'text-accent' : 'text-slate-400'}`}>
                    {slot.voltage}
                  </span>
                  <span className="text-sm font-bold text-accent-bright text-right">₱{slot.price}</span>
                </CardRow>
              );
            })}
          </div>

          <div className="px-4 py-3 border-t border-surface-card/60 bg-surface-raised/30 flex justify-between items-center">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
              Estimated Subtotal
              {scrapeLoading && <span className="ml-2 text-accent animate-pulse">scanning…</span>}
            </span>
            <span className="text-lg font-black text-accent">₱{estimatedTotal.toLocaleString()}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
