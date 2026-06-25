import { useState, useRef } from 'react';
import { PageHeader } from '../components/dashboard';
import { Card, Badge, Button } from '../components/ui';
import { INSPIRATION_VIDEOS, PRICE_LISTINGS } from '../mocks';

const activeFilterClass = 'bg-accent-muted text-accent-bright border-accent/30';
const inactiveFilterClass = 'text-slate-400 border-surface-card hover:border-accent/30 hover:text-accent';

export default function EcommerceInspirationView() {
  const [storeFilter, setStoreFilter] = useState('all');
  const carouselRef = useRef(null);

  const filteredListings =
    storeFilter === 'all'
      ? PRICE_LISTINGS
      : PRICE_LISTINGS.filter((p) => p.store.toLowerCase() === storeFilter);

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
        title="E-Commerce & Inspiration"
        subtitle="Related project videos and regional pricing from Shopee & Lazada"
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
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">E-Commerce Aggregator</h2>
          <div className="flex gap-2">
            {['all', 'shopee', 'lazada'].map((store) => (
              <button
                key={store}
                onClick={() => setStoreFilter(store)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors border
                  ${storeFilter === store ? activeFilterClass : inactiveFilterClass}`}
              >
                {store === 'all' ? 'All Stores' : store.charAt(0).toUpperCase() + store.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredListings.map((listing) => (
            <Card key={listing.id} className="p-4 hover:border-accent/20 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-3">
                <Badge variant={listing.store === 'Shopee' ? 'warning' : 'neutral'}>
                  {listing.store}
                </Badge>
                <Badge variant={stockVariant(listing.stock)}>{listing.stock}</Badge>
              </div>
              <p className="text-sm font-medium text-slate-200 mb-2">{listing.partName}</p>
              <div className="flex items-end justify-between">
                <p className="text-xl font-black text-accent">₱{listing.pricePHP}</p>
                <a
                  href={listing.url}
                  className="text-xs text-accent-bright hover:text-accent underline"
                  onClick={(e) => e.preventDefault()}
                >
                  View
                </a>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
