const STORES = [
  { id: 'shopee', name: 'Shopee', color: '#FF5722', weight: 0.42 },
  { id: 'lazada', name: 'Lazada', color: '#0F146D', weight: 0.28 },
  { id: 'local', name: 'Local Hobby Shop', color: '#FFB700', weight: 0.18 },
  { id: 'other', name: 'Other', color: '#64748B', weight: 0.12 },
];

function hashSeed(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function estimatePrice(name, storeId) {
  const lower = name.toLowerCase();
  let base = 120;

  if (/arduino|esp32|mcu|microcontroller|processor/.test(lower)) base = 850;
  else if (/motor|servo|driver|l298|stepper/.test(lower)) base = 320;
  else if (/sensor|ultrasonic|bmp|dht|gyro|tof/.test(lower)) base = 150;
  else if (/battery|lipo|power supply|buck|boost/.test(lower)) base = 650;
  else if (/wire|breadboard|resistor|capacitor|jumper/.test(lower)) base = 85;
  else if (/shifter|level converter|logic/.test(lower)) base = 95;

  const variance = (hashSeed(`${name}-${storeId}`) % 25) - 12;
  const storeMultiplier = storeId === 'shopee' ? 0.94 : storeId === 'lazada' ? 1.0 : 1.08;
  return Math.max(45, Math.round(base * storeMultiplier + variance));
}

function stockStatus(name, storeId) {
  const score = hashSeed(`${name}-${storeId}-stock`) % 100;
  if (score > 85) return 'Out of Stock';
  if (score > 70) return 'Low Stock';
  return 'In Stock';
}

function buildListings(components) {
  const listings = [];
  const onlineStores = STORES.filter((s) => s.id === 'shopee' || s.id === 'lazada');

  components.forEach((component, index) => {
    onlineStores.forEach((store) => {
      listings.push({
        id: `${index}-${store.id}`,
        partName: component.name,
        store: store.name,
        storeId: store.id,
        pricePHP: estimatePrice(component.name, store.id),
        stock: stockStatus(component.name, store.id),
        quantity: component.quantity || 1,
        url: store.id === 'shopee'
          ? `https://shopee.ph/search?keyword=${encodeURIComponent(component.name)}`
          : `https://www.lazada.com.ph/catalog/?q=${encodeURIComponent(component.name)}`,
        leadTimeDays: 2 + (hashSeed(component.name) % 5),
        salesCount: 50 + (hashSeed(`${component.name}-${store.id}-sales`) % 950),
        reviewScore: (3.5 + (hashSeed(`${component.name}-${store.id}-reviews`) % 15) / 10).toFixed(1),
      });
    });
  });

  return listings;
}

function computeDistribution(listings) {
  const totalsByStore = {};
  listings.forEach((item) => {
    if (!totalsByStore[item.store]) totalsByStore[item.store] = 0;
    totalsByStore[item.store] += item.pricePHP * item.quantity;
  });

  const grandTotal = Object.values(totalsByStore).reduce((sum, v) => sum + v, 0) || 1;

  return Object.entries(totalsByStore).map(([store, total]) => ({
    store,
    share: Math.round((total / grandTotal) * 100),
    color: STORES.find((s) => s.name === store)?.color || '#64748B',
    total,
  }));
}

function computeTotals(components, listings) {
  const itemCount = components.reduce((sum, c) => sum + (c.quantity || 1), 0);
  const bestPrices = {};

  listings.forEach((item) => {
    const key = item.partName;
    const lineTotal = item.pricePHP * item.quantity;
    if (!bestPrices[key] || lineTotal < bestPrices[key]) {
      bestPrices[key] = lineTotal;
    }
  });

  const totalCostPHP = Object.values(bestPrices).reduce((sum, v) => sum + v, 0);
  const avgLeadTimeDays =
    listings.length > 0
      ? (listings.reduce((sum, l) => sum + l.leadTimeDays, 0) / listings.length).toFixed(1)
      : '0';

  return {
    totalCostPHP,
    itemCount,
    avgLeadTimeDays,
    storesCompared: new Set(listings.map((l) => l.store)).size,
  };
}

function computeCostBreakdown(components) {
  const buckets = {
    Microcontrollers: 0,
    Sensors: 0,
    'Power & Batteries': 0,
    'Connectors & Misc': 0,
    'Tools & Accessories': 0,
  };

  components.forEach((comp) => {
    const lower = comp.name.toLowerCase();
    const qty = comp.quantity || 1;
    const price = estimatePrice(comp.name, 'lazada') * qty;

    if (/arduino|esp|mcu|nano|uno|stm|microcontroller/.test(lower)) {
      buckets.Microcontrollers += price;
    } else if (/sensor|ultrasonic|bmp|dht|gyro|accelerometer/.test(lower)) {
      buckets.Sensors += price;
    } else if (/battery|lipo|power|regulator|supply/.test(lower)) {
      buckets['Power & Batteries'] += price;
    } else if (/wire|breadboard|resistor|tool|solder/.test(lower)) {
      buckets['Tools & Accessories'] += price;
    } else {
      buckets['Connectors & Misc'] += price;
    }
  });

  return Object.entries(buckets)
    .filter(([, cost]) => cost > 0)
    .map(([category, cost]) => ({ category, cost }));
}

exports.handler = async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const components = Array.isArray(payload.components) ? payload.components : [];

    if (components.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No components provided for scraping.' }),
      };
    }

    await new Promise((resolve) => setTimeout(resolve, 600));

    const listings = buildListings(components);
    const storeDistribution = computeDistribution(listings);
    const totals = computeTotals(components, listings);
    const costBreakdown = computeCostBreakdown(components);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        listings,
        storeDistribution,
        totals,
        costBreakdown,
        scannedAt: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('[scrape-prices] Failure:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
