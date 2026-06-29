import { useState, useMemo } from 'react';
import { PageHeader } from '../components/dashboard';
import { Card, Button } from '../components/ui';
import { useBuildContext } from '../context/BuildContext';
import { parseVoltageValue } from '../utils/voltageAnalysis';

const inferCategory = (component) => {
  const name = (component.name || '').toLowerCase();
  if (/arduino|esp|raspberry|atmega|stm32|pic|microcontroller|mcu/.test(name)) return 'MCU';
  if (/sensor|bmp|dht|hc-sr|pir|ldr|ultrasonic|gyro|accel/.test(name)) return 'Sensor';
  if (/lipo|battery|lm78|buck|boost|regulator|power|cap/.test(name)) return 'Power';
  if (/jumper|wire|header|connector|relay|module|shifter/.test(name)) return 'Connector';
  return 'MCU';
};

const INITIAL_DEMO_COMPONENTS = [
  {
    id: 'demo-mcu',
    name: 'Arduino Uno R3',
    voltage: 5,
    category: 'MCU',
    quantity: 1,
  },
  {
    id: 'demo-sensor',
    name: 'BMP280 Barometric Sensor',
    voltage: 3.3,
    category: 'Sensor',
    quantity: 1,
  },
];

const ALTERNATIVES_BY_CATEGORY = {
  MCU: [
    { name: 'Arduino Nano', voltage: 5, price: 350, note: 'Smaller form factor, same logic level' },
    { name: 'ESP32 DevKit', voltage: 3.3, price: 280, note: '3.3V logic, built-in WiFi/BT' },
    { name: 'Raspberry Pi Pico', voltage: 3.3, price: 220, note: '3.3V logic, dual-core' },
  ],
  Sensor: [
    { name: 'BMP180', voltage: 3.3, price: 89, note: 'Lower precision, 3.3V compatible' },
    { name: 'DHT22', voltage: 3.3, price: 120, note: 'Temp + humidity, 3.3V' },
    { name: 'HC-SR04 Ultrasonic', voltage: 5, price: 75, note: '5V compatible, distance sensing' },
  ],
  Power: [
    { name: '4-Channel Logic Level Shifter', voltage: 'both', price: 95, note: 'Bridges 3.3V and 5V — resolves I2C/SPI conflicts' },
    { name: 'AMS1117 3.3V Regulator', voltage: 3.3, price: 35, note: 'Steps down 5V supply to 3.3V' },
    { name: 'MT3608 Boost Converter', voltage: 5, price: 65, note: 'Steps up 3.3V to 5V' },
  ],
  Connector: [
    { name: '4-Channel Logic Level Shifter', voltage: 'both', price: 95, note: 'Bidirectional — required for I2C between mismatched voltages' },
    { name: 'I2C Multiplexer TCA9548A', voltage: 3.3, price: 150, note: 'Separates bus domains entirely' },
  ],
};

const TAB_ORDER = ['All', 'MCU', 'Sensor', 'Power', 'Connector'];

function parseVoltageNumber(v) {
  if (v == null || v === '—' || v === 'both') return null;
  if (typeof v === 'number') return v;
  const s = String(v);
  if (s.includes('/') || s.includes('↔')) return null;
  return parseVoltageValue(s);
}

function formatVoltage(v) {
  if (v == null || v === '—') return '—';
  if (v === 'both') return '3.3V / 5V';
  if (typeof v === 'number') return `${v}V`;
  return String(v);
}

function classifyDelta(delta) {
  if (delta >= 1.5) {
    return {
      border: 'border-red-500',
      badge: '🔴 OVERVOLTAGE — PERMANENT DAMAGE RISK',
      badgeClass: 'bg-red-950 text-red-400',
    };
  }
  if (delta >= 0.5) {
    return {
      border: 'border-amber-500',
      badge: '🟡 UNDERDRIVEN LOGIC — UNRELIABLE COMMUNICATION',
      badgeClass: 'bg-yellow-950 text-yellow-400',
    };
  }
  return {
    border: 'border-gray-600',
    badge: '⚪ BORDERLINE — SOFT CAUTION',
    badgeClass: 'bg-gray-800 text-gray-400',
  };
}

function detectConflictsForList(components) {
  const conflicts = [];
  for (let i = 0; i < components.length; i++) {
    for (let j = i + 1; j < components.length; j++) {
      const a = components[i];
      const b = components[j];
      const av = parseVoltageNumber(a.voltage);
      const bv = parseVoltageNumber(b.voltage);
      if (av == null || bv == null) continue;
      if (av > 6 || bv > 6) continue;
      const delta = +Math.abs(av - bv).toFixed(2);
      if (delta < 0.1) continue;
      const higher = av >= bv ? a : b;
      const lower = av >= bv ? b : a;
      const higherV = Math.max(av, bv);
      const lowerV = Math.min(av, bv);
      let reason;
      if (delta >= 1.5) {
        reason = `${higher.name} drives ${higherV}V signals, exceeding the ${lowerV}V absolute-maximum rating on ${lower.name}. This will permanently damage its input pins. Use a bidirectional logic level shifter to step ${higherV}V down to ${lowerV}V safely.`;
      } else if (delta >= 0.5) {
        reason = `${lower.name} outputs ${lowerV}V, which may not cross the logic-HIGH threshold on ${higher.name}'s ${higherV}V inputs. No damage, but expect missed bits and unreliable communication.`;
      } else {
        reason = `Borderline mismatch (${delta}V) between ${higher.name} and ${lower.name}. Likely to work, but a level shifter is recommended for production reliability.`;
      }
      conflicts.push({
        id: `conflict-${a.id}-${b.id}`,
        affectedIds: [a.id, b.id],
        higher,
        lower,
        higherV,
        lowerV,
        delta,
        reason,
      });
    }
  }
  return conflicts;
}

function ConflictSummaryCard({ conflict }) {
  const meta = classifyDelta(conflict.delta);
  return (
    <Card className={`border-l-4 ${meta.border} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${meta.badgeClass}`}>
            {meta.badge}
          </span>
          <p className="text-sm text-slate-200 mt-2">
            <span className="font-bold">{conflict.higher.name}</span>
            <span className="text-slate-500"> ({conflict.higherV}V) </span>
            ↔
            <span className="font-bold"> {conflict.lower.name}</span>
            <span className="text-slate-500"> ({conflict.lowerV}V)</span>
          </p>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{conflict.reason}</p>
        </div>
        <span className="text-xs font-mono text-slate-500 shrink-0">Δ {conflict.delta}V</span>
      </div>
    </Card>
  );
}

function AlternativeRow({ alt, resolves, onUse }) {
  return (
    <div className="p-3 rounded-lg border border-surface-card/60 bg-surface-raised/40 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-slate-200">{alt.name}</p>
          <span className="text-[10px] font-mono text-slate-400 bg-surface-card/60 px-1.5 py-0.5 rounded">
            {alt.voltage === 'both' ? '3.3V / 5V' : `${alt.voltage}V`}
          </span>
          {resolves && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-900/50 border border-emerald-500/40 px-2 py-0.5 rounded">
              ✓ Resolves Conflict
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">{alt.note}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-black text-accent-bright">₱{alt.price}</p>
        <Button size="sm" className="mt-1" onClick={onUse}>Use This</Button>
      </div>
    </div>
  );
}

function OriginalRow({ original, onRestore }) {
  return (
    <div className="p-3 rounded-lg border border-surface-card/60 border-l-4 border-l-amber-500 bg-surface-raised/30 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-slate-200">{original.name}</p>
          <span className="text-[10px] font-mono text-slate-400 bg-surface-card/60 px-1.5 py-0.5 rounded">
            {formatVoltage(original.voltage)}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-900/40 border border-amber-500/40 px-2 py-0.5 rounded">
            Original
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Previously in this slot before the swap.</p>
      </div>
      <div className="text-right shrink-0">
        <Button size="sm" variant="ghost" onClick={onRestore}>↩ Restore</Button>
      </div>
    </div>
  );
}

export default function AntiFryMatrixView() {
  const {
    buildSlots,
    buildName,
    estimatedTotal,
    scrapeLoading,
    replaceComponent,
  } = useBuildContext();

  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoComponents, setDemoComponents] = useState(INITIAL_DEMO_COMPONENTS);
  const [activeCategory, setActiveCategory] = useState('All');
  const [openPanelId, setOpenPanelId] = useState(null);
  const [swapHistory, setSwapHistory] = useState({});
  const [toast, setToast] = useState(null);

  const realComponentsFromContext = useMemo(
    () =>
      Object.entries(buildSlots).map(([slotId, slot]) => ({
        id: slotId,
        name: slot.name,
        voltage: parseVoltageNumber(slot.voltage) ?? slot.voltage,
        category: inferCategory({ name: slot.name }),
        quantity: 1,
        price: slot.price,
      })),
    [buildSlots]
  );

  const displayedComponents = useMemo(
    () => (isDemoMode ? [...realComponentsFromContext, ...demoComponents] : realComponentsFromContext),
    [isDemoMode, realComponentsFromContext, demoComponents]
  );

  const conflicts = useMemo(() => detectConflictsForList(displayedComponents), [displayedComponents]);

  const conflictByCompId = useMemo(() => {
    const map = {};
    conflicts.forEach((c) => {
      c.affectedIds.forEach((id) => {
        if (!map[id]) map[id] = c;
      });
    });
    return map;
  }, [conflicts]);

  const categoryCounts = useMemo(() => {
    const counts = { All: displayedComponents.length, MCU: 0, Sensor: 0, Power: 0, Connector: 0 };
    displayedComponents.forEach((c) => {
      const cat = c.category || inferCategory({ name: c.name });
      if (counts[cat] !== undefined) counts[cat] += 1;
    });
    return counts;
  }, [displayedComponents]);

  const filteredComponents = useMemo(() => {
    if (activeCategory === 'All') return displayedComponents;
    return displayedComponents.filter(
      (c) => (c.category || inferCategory({ name: c.name })) === activeCategory
    );
  }, [displayedComponents, activeCategory]);

  const showToast = (msg) => {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2500);
  };

  const togglePanel = (id) => {
    setOpenPanelId((prev) => (prev === id ? null : id));
  };

  const getAlternativesForComponent = (comp) => {
    const cat = comp.category || inferCategory({ name: comp.name });
    const base = ALTERNATIVES_BY_CATEGORY[cat] || [];
    const inConflict = Boolean(conflictByCompId[comp.id]);
    if (!inConflict) return base;
    const seenNames = new Set(base.map((a) => a.name));
    const extras = [];
    Object.entries(ALTERNATIVES_BY_CATEGORY).forEach(([key, alts]) => {
      if (key === cat) return;
      alts.forEach((a) => {
        if (a.voltage === 'both' && !seenNames.has(a.name)) {
          extras.push(a);
          seenNames.add(a.name);
        }
      });
    });
    return [...base, ...extras];
  };

  const alternativeResolvesConflict = (comp, alt) => {
    const conflict = conflictByCompId[comp.id];
    if (!conflict) return false;
    if (alt.voltage === 'both') return true;
    const otherId = conflict.affectedIds.find((id) => id !== comp.id);
    const other = displayedComponents.find((c) => c.id === otherId);
    if (!other) return false;
    const otherV = parseVoltageNumber(other.voltage);
    return alt.voltage === otherV;
  };

  const handleUseAlternative = (comp, alt) => {
    const newComponent = {
      name: alt.name,
      voltage: alt.voltage,
      category: inferCategory({ name: alt.name }),
      quantity: comp.quantity || 1,
      price: alt.price,
      note: alt.note,
    };

    // Save the ORIGINAL (first-seen) to swapHistory so revert always returns to it.
    setSwapHistory((prev) => (prev[comp.id] ? prev : { ...prev, [comp.id]: comp }));

    const isDemoRow = comp.id.startsWith('demo-');
    if (isDemoRow) {
      // Demo swaps stay 100% local — never touch BuildContext.
      setDemoComponents((prev) =>
        prev.map((c) => (c.id === comp.id ? { ...newComponent, id: comp.id } : c))
      );
    } else {
      // Real swap goes through BuildContext.replaceComponent (which removes the old slot).
      replaceComponent(comp.id, newComponent);
    }

    setOpenPanelId(null);
    showToast(`✓ ${alt.name} swapped in`);
  };

  const handleRevert = (comp) => {
    const original = swapHistory[comp.id];
    if (!original) return;

    const isDemoRow = comp.id.startsWith('demo-');
    if (isDemoRow) {
      setDemoComponents((prev) => prev.map((c) => (c.id === comp.id ? original : c)));
    } else {
      replaceComponent(comp.id, original);
    }

    setSwapHistory((prev) => {
      const next = { ...prev };
      delete next[comp.id];
      return next;
    });

    setOpenPanelId(null);
    showToast(`↩ Restored ${original.name}`);
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <PageHeader title="Anti-Fry Builder's Matrix" subtitle={buildName} />
        </div>
        <button
          type="button"
          onClick={() => setIsDemoMode((m) => !m)}
          aria-pressed={isDemoMode}
          className={`shrink-0 self-start px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors border ${
            isDemoMode
              ? 'bg-accent text-surface-base border-accent shadow-card'
              : 'bg-surface-card text-slate-400 border-surface-card hover:text-accent-bright hover:border-accent/40'
          }`}
        >
          {isDemoMode ? '⚡ Demo Mode ON' : 'Demo Mode'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {TAB_ORDER.map((cat) => {
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border flex items-center gap-2 ${
                active
                  ? 'bg-accent-muted text-accent-bright border-accent/30'
                  : 'text-slate-400 border-surface-card hover:border-accent/30 hover:text-accent'
              }`}
            >
              <span>{cat}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  active ? 'bg-accent/20 text-accent-bright' : 'bg-surface-card/60 text-slate-500'
                }`}
              >
                {categoryCounts[cat] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {conflicts.length === 0 ? (
        <div className="mb-5 p-4 rounded-card border border-accent/40 bg-accent-muted">
          <p className="text-sm font-bold text-accent-bright">Compatibility Verified</p>
          <p className="text-xs text-slate-400">
            All voltage levels are compatible. Build is ready for procurement.
          </p>
        </div>
      ) : (
        <div className="space-y-3 mb-5">
          {conflicts.map((conflict) => (
            <ConflictSummaryCard key={conflict.id} conflict={conflict} />
          ))}
        </div>
      )}

      <Card>
        <div className="px-4 py-2 bg-surface-raised/40 border-b border-surface-card/60 grid grid-cols-[1fr_auto] gap-4 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
          <span>Component</span>
          <span className="text-right">Voltage · Action</span>
        </div>
        <div className="oc-row-divider">
          {filteredComponents.length === 0 && (
            <div className="px-4 py-6 text-sm text-slate-500 text-center">
              No components in this category.
            </div>
          )}
          {filteredComponents.map((comp) => {
            const conflict = conflictByCompId[comp.id];
            const isInConflict = Boolean(conflict);
            const meta = isInConflict ? classifyDelta(conflict.delta) : null;
            const isOpen = openPanelId === comp.id;
            const alternatives = isOpen ? getAlternativesForComponent(comp) : [];
            const category = comp.category || inferCategory({ name: comp.name });
            const original = swapHistory[comp.id];
            const isDemoRow = comp.id.startsWith('demo-');

            return (
              <div key={comp.id} className={meta ? `border-l-4 ${meta.border}` : 'border-l-4 border-transparent'}>
                <div className="px-4 py-3 grid grid-cols-[1fr_auto] gap-4 items-center">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-slate-200 truncate">{comp.name}</p>
                      {isDemoRow && (
                        <span className="text-[10px] uppercase font-bold text-accent-bright bg-accent-muted px-1.5 py-0.5 rounded">
                          Demo
                        </span>
                      )}
                      {original && (
                        <span className="text-[10px] uppercase font-bold text-amber-300 bg-amber-900/40 border border-amber-500/40 px-1.5 py-0.5 rounded">
                          Swapped
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase mt-0.5">{category}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-mono ${isInConflict ? 'text-accent-bright' : 'text-slate-400'}`}>
                      {formatVoltage(comp.voltage)}
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePanel(comp.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        isInConflict
                          ? 'bg-accent text-surface-base border-accent hover:bg-accent-bright'
                          : 'bg-surface-card text-slate-300 border-surface-card hover:text-accent-bright hover:border-accent/40'
                      }`}
                    >
                      {isInConflict ? '⚡ Find Safe Alternative' : '↔ Swap Component'}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="px-4 pb-4 pt-2 bg-surface-base/40 border-t border-surface-card/40">
                    {original && (
                      <>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-amber-300 mb-2">
                          ↩ Revert to Original
                        </p>
                        <div className="mb-4">
                          <OriginalRow original={original} onRestore={() => handleRevert(comp)} />
                        </div>
                      </>
                    )}
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-3">
                      {isInConflict
                        ? 'Recommended alternatives — green badge resolves the conflict'
                        : `Alternatives in ${category}`}
                    </p>
                    <div className="space-y-2">
                      {alternatives.length === 0 && (
                        <p className="text-xs text-slate-500">No alternatives available for this category.</p>
                      )}
                      {alternatives.map((alt, idx) => (
                        <AlternativeRow
                          key={`${alt.name}-${idx}`}
                          alt={alt}
                          resolves={alternativeResolvesConflict(comp, alt)}
                          onUse={() => handleUseAlternative(comp, alt)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
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

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg bg-emerald-900/95 border border-emerald-500/50 text-emerald-100 text-sm shadow-card animate-fade-in-up">
          {toast}
        </div>
      )}
    </div>
  );
}
