import React, { useMemo, useState } from 'react';

const defaultQuery = 'electronics components shop';

const marketplaceDefinitions = [
  {
    name: 'Shopee',
    badge: 'Shopee',
    link: (query) => `https://shopee.ph/search?keyword=${encodeURIComponent(query)}&page=0&sortBy=sales`,
  },
  {
    name: 'Lazada',
    badge: 'Lazada',
    link: (query) => `https://www.lazada.com.ph/catalog/?q=${encodeURIComponent(query)}&page=1&sort=popularity`,
  }
];

function parseQueryItems(query) {
  if (!query || !query.trim()) return ['electronics components'];
  return query
    .replace(/^buy\s+/i, '')
    .replace(/\s+online$/i, '')
    .split(/\s*,\s*/)
    .map(item => item.trim())
    .filter(Boolean);
}

function openMarketplaceSearch(url, provider) {
  if (provider === 'Shopee') {
    const win = window.open('https://shopee.ph', '_blank');
    if (win) {
      setTimeout(() => {
        if (!win.closed) {
          win.location.href = url;
        }
      }, 1800);
    }
  } else {
    window.open(url, '_blank');
  }
}

export default function OnlineStoreDashboard() {
  const [query, setQuery] = useState(defaultQuery);
  const [activeQuery, setActiveQuery] = useState(defaultQuery);

  const itemNames = useMemo(() => parseQueryItems(activeQuery), [activeQuery]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setActiveQuery(query.trim() || defaultQuery);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-black tracking-widest text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.4)]">
          OMNI-CART Online Stores
        </h1>
        <p className="text-sm text-slate-400 mt-2">Search and open Shopee/Lazada catalogs for your parts list.</p>
      </header>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto mb-6 flex gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500"
          placeholder="Search online store parts..."
        />
        <button
          type="submit"
          className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
        >
          Search
        </button>
      </form>

      <section className="max-w-3xl mx-auto space-y-5">
        {marketplaceDefinitions.map((market) => (
          <article key={market.name} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-lg shadow-black/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                  {market.badge}
                </span>
                <h2 className="mt-3 text-2xl font-bold text-slate-100">{market.name}</h2>
                <p className="mt-2 text-sm text-slate-400">Best matched product searches for “{activeQuery}”.</p>
              </div>
              <button
                type="button"
                onClick={() => openMarketplaceSearch(market.link(activeQuery), market.name)}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-slate-700"
              >
                View full catalog
              </button>
            </div>

            <ul className="mt-6 space-y-4">
              {itemNames.map((name) => (
                <li key={`${market.name}-${name}`} className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
                  <button
                    type="button"
                    onClick={() => openMarketplaceSearch(market.link(name), market.name)}
                    className="w-full text-left text-sm font-semibold text-slate-100 transition hover:text-emerald-300"
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
