import { useMemo, useState, useRef } from 'react';
import { PageHeader } from '../components/dashboard';
import { Card, Badge, Button, SkeletonCard } from '../components/ui';
import { useBuildContext } from '../context/BuildContext';
import { INSPIRATION_VIDEOS } from '../mocks';

const activeFilterClass = 'bg-accent-muted text-accent-bright border-accent/30';
const inactiveFilterClass = 'text-slate-400 border-surface-card hover:border-accent/30 hover:text-accent';

const SORT_OPTIONS = [
  { id: 'price-asc', label: 'Lowest Price' },
  { id: 'sales-desc', label: 'Highest Sales' },
  { id: 'reviews-desc', label: 'Best Reviews' },
];

function sortListings(listings, sortBy) {
  const sorted = [...listings];
  switch (sortBy) {
    case 'sales-desc':
      return sorted.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
    case 'reviews-desc':
      return sorted.sort((a, b) => parseFloat(b.reviewScore || 0) - parseFloat(a.reviewScore || 0));
    case 'price-asc':
    default:
      return sorted.sort((a, b) => a.pricePHP - b.pricePHP);
  }
}

export default function EcommerceInspirationView() {
  const { scrapeListings, scrapeLoading, scrapeError, refreshScrape } = useBuildContext();
  const [storeFilter, setStoreFilter] = useState('all');
  const [sortBy, setSortBy] = useState('price-asc');
  const carouselRef = useRef(null);

  const filteredListings = useMemo(() => {
    let items = scrapeListings;
    if (storeFilter !== 'all') {
      items = items.filter((p) => p.storeId === storeFilter);
    }
    return sortListings(items, sortBy);
  }, [scrapeListings, storeFilter, sortBy]);

  const scrollCarousel = (direction) => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollBy({ left: direction * 280, behavior: 'smooth' });
  };

  const stockVariant = (stock) => {
    if (stock === 'In Stock') return 'success';
    if (stock === 'Low Stock') return 'warning';
    return 'neutral';
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <PageHeader
        title="E-Commerce Aggregator"
        subtitle="Live scraped pricing from Shopee & Lazada for your active build"
      />

      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Related Inspiration</h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => scrollCarousel(-1)}>Prev</Button>
            <Button variant="ghost" size="sm" onClick={() => scrollCarousel(1)}>Next</Button>
          </div>
        </div>

        <div
          ref={carouselRef}
          className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'thin' }}
        >
          {INSPIRATION_VIDEOS.map((video) => (
            <div
              key={video.id}
              className="snap-start shrink-0 w-64 oc-card overflow-hidden cursor-pointer hover:border-accent/30 transition-colors"
            >
              <div className={`h-36 bg-gradient-to-br ${video.gradient} flex items-center justify-center relative`}>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center border-2"
                  style={{ borderColor: video.accent, backgroundColor: 'rgba(15,15,15,0.6)' }}
                >
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: video.accent }}>Play</span>
                </div>
                <span className="absolute bottom-2 right-2 text-[10px] bg-surface-base/80 px-1.5 py-0.5 rounded text-slate-300 font-mono">
                  {video.duration}
                </span>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-slate-200 line-clamp-2">{video.title}</p>
                <p className="text-xs text-slate-500 mt-1">{video.channel}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Live Listings</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'shopee', label: 'Shopee' },
                { id: 'lazada', label: 'Lazada' },
              ].map((store) => (
                <button
                  key={store.id}
                  type="button"
                  onClick={() => setStoreFilter(store.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors border
                    ${storeFilter === store.id ? activeFilterClass : inactiveFilterClass}`}
                >
                  {store.label}
                </button>
              ))}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-surface-raised border border-surface-card rounded-lg text-xs text-slate-300 px-3 py-1.5 outline-none focus:border-accent/40"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {scrapeLoading && (
          <Card className="p-5 mb-4">
            <SkeletonCard rows={4} tint="accent" />
            <p className="text-xs text-accent-bright text-center mt-3 animate-pulse">Scanning marketplace listings…</p>
          </Card>
        )}

        {scrapeError && !scrapeLoading && (
          <Card className="p-5 mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-400">{scrapeError}</p>
            <Button size="sm" variant="ghost" onClick={refreshScrape}>Retry</Button>
          </Card>
        )}

        {!scrapeLoading && filteredListings.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-sm text-slate-400">No listings yet. Import or scan components to populate this grid.</p>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredListings.map((listing) => (
            <Card key={listing.id} className="p-4 hover:border-accent/20 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-3">
                <a
                  href={listing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Badge variant={listing.store === 'Shopee' ? 'warning' : 'neutral'}>
                    {listing.store}
                  </Badge>
                </a>
                <Badge variant={stockVariant(listing.stock)}>{listing.stock}</Badge>
              </div>
              <p className="text-sm font-medium text-slate-200 mb-2">{listing.partName}</p>
              <div className="flex items-center gap-3 text-[10px] text-slate-500 mb-3">
                <span>{listing.salesCount?.toLocaleString()} sold</span>
                <span>★ {listing.reviewScore}</span>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-xl font-black text-accent">₱{listing.pricePHP}</p>
                <a
                  href={listing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent-bright hover:text-accent underline"
                >
                  Verify listing
                </a>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
