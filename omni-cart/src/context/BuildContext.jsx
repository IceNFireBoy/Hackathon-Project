import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { INITIAL_BUILD, mapComponentToCategory } from '../mocks';
import {
  clearImportCartFromUrl,
  normalizeImportCart,
  readImportCartFromUrl,
} from '../utils/importBridge';

const BuildContext = createContext(null);

export function BuildProvider({ children }) {
  const [buildSlots, setBuildSlots] = useState({ ...INITIAL_BUILD.slots });
  const [buildName, setBuildName] = useState(INITIAL_BUILD.name);
  const [conflictResolved, setConflictResolved] = useState(false);
  const [ingestedFromScan, setIngestedFromScan] = useState(false);
  const [importedCart, setImportedCart] = useState(null);

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

  const importCart = useCallback((cart, source = 'ingestion') => {
    const normalizedCart = normalizeImportCart(cart, source);
    setImportedCart(normalizedCart);
    if (normalizedCart.components.length > 0) {
      mergeComponentsFromIngestion(normalizedCart.components);
    }
    return normalizedCart;
  }, [mergeComponentsFromIngestion]);

  const clearImportedCart = useCallback(() => {
    setImportedCart(null);
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
    setImportedCart(null);
  }, []);

  useEffect(() => {
    const urlCart = readImportCartFromUrl();
    if (!urlCart) return;

    importCart(urlCart, 'url');
    clearImportCartFromUrl();
  }, [importCart]);

  return (
    <BuildContext.Provider
      value={{
        buildSlots,
        buildName,
        conflictResolved,
        ingestedFromScan,
        importedCart,
        importCart,
        clearImportedCart,
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
