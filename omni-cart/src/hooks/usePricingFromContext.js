import { useMemo } from 'react';
import { slotsToComponentList } from '../utils/voltageAnalysis';

export function computeBestListings(listings) {
  const bestByPart = {};

  listings.forEach((item) => {
    const lineTotal = item.pricePHP * (item.quantity || 1);
    const existing = bestByPart[item.partName];
    if (!existing || lineTotal < existing.lineTotal) {
      bestByPart[item.partName] = { ...item, lineTotal };
    }
  });

  return bestByPart;
}

export function usePricingFromContext(buildContext) {
  const {
    scrapeTotals,
    scrapeListings,
    scrapeDistribution,
    scrapeLoading,
    scrapeError,
    refreshScrape,
    buildSlots,
  } = buildContext;

  const components = useMemo(() => slotsToComponentList(buildSlots), [buildSlots]);
  const bestByPart = useMemo(
    () => computeBestListings(scrapeListings),
    [scrapeListings]
  );

  const estimatedTotal = scrapeTotals?.totalCostPHP ?? Object.values(buildSlots).reduce(
    (sum, slot) => sum + (slot?.price || 0),
    0
  );

  return {
    components,
    bestByPart,
    estimatedTotal,
    scrapeTotals,
    scrapeListings,
    scrapeDistribution,
    scrapeLoading,
    scrapeError,
    refreshScrape,
  };
}
