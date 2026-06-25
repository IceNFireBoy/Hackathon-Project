import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from './useAnalyzeParts';

export function useScrapePrices(components) {
  const [listings, setListings] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const componentKey = JSON.stringify(
    (components || []).map((c) => c.name).sort()
  );

  const scrape = useCallback(async () => {
    if (!components?.length) {
      setListings([]);
      setDistribution([]);
      setTotals(null);
      return;
    }

    setLoading(true);
    setError(null);

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
      setListings(data.listings || []);
      setDistribution(data.storeDistribution || []);
      setTotals(data.totals || null);
    } catch (err) {
      setError(err.message);
      setListings([]);
      setDistribution([]);
      setTotals(null);
    } finally {
      setLoading(false);
    }
  }, [components]);

  useEffect(() => {
    scrape();
  }, [componentKey, scrape]);

  return { listings, distribution, totals, loading, error, refresh: scrape };
}
