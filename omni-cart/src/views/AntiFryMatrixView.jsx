import { useState } from 'react';
import { PageHeader } from '../components/dashboard';
import { Card, CardRow, Button, Badge, Tooltip } from '../components/ui';
import { BUILD_CATEGORIES, VOLTAGE_CONFLICT } from '../mocks';
import { useBuildContext } from '../context/BuildContext';

function CompatibilityBanner({ conflictResolved, ingestedFromScan }) {
  if (conflictResolved) {
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
        <p className="text-xs text-slate-300 mt-1">{VOLTAGE_CONFLICT.message}</p>
      </div>
      <Badge variant="warning">5V vs 3.3V</Badge>
    </div>
  );
}

function ConflictResolutionPanel({ onResolve }) {
  const { alternative, physicsExplanation } = VOLTAGE_CONFLICT;

  return (
    <Card variant="bright" className="mb-6">
      <div className="p-4 border-b border-surface-card/60 bg-accent-muted/50">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-accent">Anti-Fry Resolution Required</h3>
          <Tooltip content={physicsExplanation}>
            <button className="text-xs text-slate-400 underline hover:text-accent-bright">Why?</button>
          </Tooltip>
        </div>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">{physicsExplanation}</p>
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
  const { buildSlots, buildName, conflictResolved, ingestedFromScan, resolveConflict } = useBuildContext();
  const [activeCategory, setActiveCategory] = useState('mcu');

  const subtotal = Object.values(buildSlots).reduce((sum, slot) => sum + (slot?.price || 0), 0);

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <PageHeader title="Anti-Fry Builder's Matrix" subtitle={buildName} />

      <CompatibilityBanner conflictResolved={conflictResolved} ingestedFromScan={ingestedFromScan} />

      {!conflictResolved && <ConflictResolutionPanel onResolve={resolveConflict} />}

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4">
        <Card className="h-fit">
          <div className="p-2">
            {BUILD_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5
                  ${activeCategory === cat.id
                    ? 'bg-accent-muted text-accent-bright border-l-2 border-accent'
                    : 'text-slate-400 hover:bg-surface-card/40 hover:text-accent border-l-2 border-transparent'
                  }`}
              >
                <span className="truncate">{cat.label}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <div className="px-4 py-2 bg-surface-raised/40 border-b border-surface-card/60 grid grid-cols-[1fr_auto_auto_auto] gap-4 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
            <span>Component</span>
            <span className="hidden sm:inline">Specs</span>
            <span>Voltage</span>
            <span className="text-right">Price</span>
          </div>
          <div className="oc-row-divider">
            {BUILD_CATEGORIES.map((cat) => {
              const slot = buildSlots[cat.id];
              if (!slot) return null;
              const isAffected = !conflictResolved && VOLTAGE_CONFLICT.affectedSlots.includes(cat.id);

              return (
                <CardRow
                  key={cat.id}
                  className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center ${isAffected ? 'bg-accent-muted/40' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{slot.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase">{cat.label}</p>
                    </div>
                    {isAffected && <Badge variant="warning">Mismatch</Badge>}
                  </div>
                  <span className="hidden sm:inline text-xs text-slate-500 font-mono truncate max-w-[140px]">
                    {slot.specs}
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
            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Estimated Subtotal</span>
            <span className="text-lg font-black text-accent">₱{subtotal.toLocaleString()}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
