import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { INITIAL_BUILD } from '../mocks';
import { API_BASE_URL } from '../hooks/useAnalyzeParts';
import {
  clearImportCartFromUrl,
  normalizeImportCart,
  readImportCartFromUrl,
} from '../utils/importBridge';
import {
  appendSavedBuild,
  buildArchiveEntry,
  deleteSavedBuild,
  loadSavedBuilds,
  persistSavedBuilds,
  updateSavedBuildTitle,
} from '../utils/savedBuildsStorage';
import { componentsToBuildSlots, detectVoltageConflict, slotsToComponentList } from '../utils/voltageAnalysis';
import { computeBestListings } from '../hooks/usePricingFromContext';

const BuildContext = createContext(null);

function applyScrapedPricesToSlots(slots, listings) {
  const bestByPart = computeBestListings(listings);
  const next = { ...slots };

  Object.keys(next).forEach((slotId) => {
    const slot = next[slotId];
    const best = bestByPart[slot.name];
    if (best) {
      next[slotId] = {
        ...slot,
        price: best.pricePHP,
        listingUrl: best.url,
        store: best.store,
        storeId: best.storeId,
      };
    }
  });

  return next;
}

export function BuildProvider({ children }) {
  const [buildSlots, setBuildSlots] = useState({ ...INITIAL_BUILD.slots });
  const [buildName, setBuildName] = useState(INITIAL_BUILD.name);
  const [conflictResolved, setConflictResolved] = useState(false);
  const [ingestedFromScan, setIngestedFromScan] = useState(false);
  const [importedCart, setImportedCart] = useState(null);
  const [hasUnsavedImport, setHasUnsavedImport] = useState(false);
  const [savedBuilds, setSavedBuilds] = useState(() => loadSavedBuilds());

  const [scrapeListings, setScrapeListings] = useState([]);
  const [scrapeDistribution, setScrapeDistribution] = useState([]);
  const [scrapeTotals, setScrapeTotals] = useState(null);
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [scrapeError, setScrapeError] = useState(null);

  const lastAppliedScrapeRef = useRef('');
  const buildSlotsRef = useRef(buildSlots);
  buildSlotsRef.current = buildSlots;

  const voltageConflict = useMemo(() => {
    if (conflictResolved) return null;
    return detectVoltageConflict(buildSlots);
  }, [buildSlots, conflictResolved]);

  const componentNamesKey = useMemo(
    () => JSON.stringify(slotsToComponentList(buildSlots).map((c) => c.name).sort()),
    [buildSlots]
  );

  const refreshScrape = useCallback(async () => {
    const components = slotsToComponentList(buildSlotsRef.current);
    if (!components.length) {
      setScrapeListings([]);
      setScrapeDistribution([]);
      setScrapeTotals(null);
      return;
    }

    setScrapeLoading(true);
    setScrapeError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/scrape-prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          components: components.map((c) => ({ name: c.name, quantity: c.quantity || 1 })),
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text.substring(0, 120) || `Scraper returned ${response.status}`);
      }

      const data = await response.json();
      const listings = data.listings || [];

      setScrapeListings(listings);
      setScrapeDistribution(data.storeDistribution || []);
      setScrapeTotals(data.totals || null);

      const scrapeKey = JSON.stringify(listings.map((l) => l.id));
      if (scrapeKey !== lastAppliedScrapeRef.current) {
        lastAppliedScrapeRef.current = scrapeKey;
        setBuildSlots((prev) => applyScrapedPricesToSlots(prev, listings));
      }
    } catch (err) {
      setScrapeError(err.message);
      setScrapeListings([]);
      setScrapeDistribution([]);
      setScrapeTotals(null);
    } finally {
      setScrapeLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshScrape();
  }, [componentNamesKey, refreshScrape]);

  const hydrateFromComponents = useCallback((components, cartMeta = {}) => {
    const slots = componentsToBuildSlots(components);
    setBuildSlots(slots);
    setBuildName(cartMeta.buildName || 'Imported Build');
    setConflictResolved(false);
    setIngestedFromScan(true);
    setHasUnsavedImport(true);
    lastAppliedScrapeRef.current = '';
  }, []);

  const importCart = useCallback(
    (cart, source = 'ingestion') => {
      const normalizedCart = normalizeImportCart(cart, source);
      setImportedCart(normalizedCart);

      if (normalizedCart.components.length > 0) {
        hydrateFromComponents(normalizedCart.components, {
          buildName:
            source === 'url'
              ? `Extension Import · ${new Date().toLocaleDateString()}`
              : 'Scanned Build',
        });
      }

      return normalizedCart;
    },
    [hydrateFromComponents]
  );

  const clearImportedCart = useCallback(() => {
    setImportedCart(null);
  }, []);

  const mergeComponentsFromIngestion = useCallback(
    (components) => {
      hydrateFromComponents(components);
    },
    [hydrateFromComponents]
  );

  const resolveConflict = useCallback((alternative) => {
    setBuildSlots((prev) => ({
      ...prev,
      [alternative.insertSlot]: {
        partId: alternative.partId,
        name: alternative.name,
        voltage: alternative.voltage,
        price: alternative.price,
        specs: alternative.specs,
        category: prev[alternative.insertSlot]?.category || 'connector',
      },
    }));
    setConflictResolved(true);
  }, []);

  const saveToArchive = useCallback(() => {
    const components =
      importedCart?.components ||
      Object.values(buildSlots).map((slot) => ({
        name: slot.name,
        quantity: 1,
        confidence_score: 0.9,
        voltage: slot.voltage,
        price: slot.price,
      }));

    const entry = buildArchiveEntry({
      buildName,
      components,
      optimized_maps_query: importedCart?.optimized_maps_query,
      tags: ingestedFromScan ? ['imported'] : ['manual'],
    });

    entry.buildSlots = buildSlots;

    const next = appendSavedBuild(entry);
    setSavedBuilds(next);
    setHasUnsavedImport(false);
    return entry;
  }, [buildName, buildSlots, importedCart, ingestedFromScan]);

  const removeSavedBuild = useCallback((id) => {
    const next = deleteSavedBuild(id);
    setSavedBuilds(next);
  }, []);

  const renameSavedBuild = useCallback((id, newTitle) => {
    const next = updateSavedBuildTitle(id, newTitle);
    setSavedBuilds(next);
  }, []);

  const duplicateSavedBuild = useCallback((build) => {
    const duplicate = {
      ...build,
      id: `build-${Date.now()}`,
      title: `${build.title} (Copy)`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const next = [duplicate, ...loadSavedBuilds()];
    persistSavedBuilds(next);
    setSavedBuilds(next);
    return duplicate;
  }, []);

  const loadBuildFromArchive = useCallback((build) => {
    if (build.buildSlots) {
      setBuildSlots(build.buildSlots);
    } else if (build.components?.length) {
      setBuildSlots(componentsToBuildSlots(build.components));
    }
    setBuildName(build.title);
    setImportedCart({
      version: 1,
      source: 'archive',
      importedAt: new Date().toISOString(),
      components: build.components || [],
      optimized_maps_query: '',
    });
    setConflictResolved(false);
    setIngestedFromScan(true);
    setHasUnsavedImport(false);
    lastAppliedScrapeRef.current = '';
  }, []);

  const resetBuild = useCallback(() => {
    setBuildSlots({ ...INITIAL_BUILD.slots });
    setBuildName(INITIAL_BUILD.name);
    setConflictResolved(false);
    setIngestedFromScan(false);
    setImportedCart(null);
    setHasUnsavedImport(false);
    lastAppliedScrapeRef.current = '';
  }, []);

  useEffect(() => {
    const urlCart = readImportCartFromUrl();
    if (!urlCart) return;

    importCart(urlCart, 'url');
    clearImportCartFromUrl();
  }, [importCart]);

  const estimatedTotal = scrapeTotals?.totalCostPHP ?? Object.values(buildSlots).reduce(
    (sum, slot) => sum + (slot?.price || 0),
    0
  );

  return (
    <BuildContext.Provider
      value={{
        buildSlots,
        buildName,
        conflictResolved,
        ingestedFromScan,
        importedCart,
        hasUnsavedImport,
        savedBuilds,
        voltageConflict,
        scrapeListings,
        scrapeDistribution,
        scrapeTotals,
        scrapeLoading,
        scrapeError,
        estimatedTotal,
        refreshScrape,
        importCart,
        clearImportedCart,
        mergeComponentsFromIngestion,
        resolveConflict,
        saveToArchive,
        removeSavedBuild,
        renameSavedBuild,
        duplicateSavedBuild,
        loadBuildFromArchive,
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
