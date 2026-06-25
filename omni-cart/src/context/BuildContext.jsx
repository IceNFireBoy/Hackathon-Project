import { createContext, useContext, useState, useCallback } from 'react';
import { INITIAL_BUILD, mapComponentToCategory } from '../mocks';

const BuildContext = createContext(null);

export function BuildProvider({ children }) {
  const [buildSlots, setBuildSlots] = useState({ ...INITIAL_BUILD.slots });
  const [buildName, setBuildName] = useState(INITIAL_BUILD.name);
  const [conflictResolved, setConflictResolved] = useState(false);
  const [ingestedFromScan, setIngestedFromScan] = useState(false);

  const mergeComponentsFromIngestion = useCallback((components) => {
    setBuildSlots((prev) => {
      const next = { ...prev };
      components.forEach((comp) => {
        const category = mapComponentToCategory(comp.name);
        next[category] = {
          partId: `ingested-${comp.name}`,
          name: comp.name,
          voltage: comp.voltage || '—',
          price: comp.price || 0,
          specs: `Qty ${comp.quantity || 1} · Ingested from scan`,
        };
      });
      return next;
    });
    setIngestedFromScan(true);
  }, []);

  const resolveConflict = useCallback((alternative) => {
    setBuildSlots((prev) => ({
      ...prev,
      [alternative.insertSlot]: {
        partId: alternative.partId,
        name: alternative.name,
        voltage: alternative.voltage,
        price: alternative.price,
        specs: alternative.specs,
      },
    }));
    setConflictResolved(true);
  }, []);

  const resetBuild = useCallback(() => {
    setBuildSlots({ ...INITIAL_BUILD.slots });
    setBuildName(INITIAL_BUILD.name);
    setConflictResolved(false);
    setIngestedFromScan(false);
  }, []);

  return (
    <BuildContext.Provider
      value={{
        buildSlots,
        buildName,
        conflictResolved,
        ingestedFromScan,
        mergeComponentsFromIngestion,
        resolveConflict,
        resetBuild,
        setBuildName,
      }}
    >
      {children}
    </BuildContext.Provider>
  );
}

export function useBuildContext() {
  const ctx = useContext(BuildContext);
  if (!ctx) throw new Error('useBuildContext must be used within BuildProvider');
  return ctx;
}
