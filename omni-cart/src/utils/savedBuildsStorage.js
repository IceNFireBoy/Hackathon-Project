const STORAGE_KEY = 'omni-cart-saved-builds';

export function loadSavedBuilds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistSavedBuilds(builds) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
}

export function appendSavedBuild(build) {
  const existing = loadSavedBuilds();
  const next = [build, ...existing];
  persistSavedBuilds(next);
  return next;
}

export function deleteSavedBuild(id) {
  const next = loadSavedBuilds().filter((b) => b.id !== id);
  persistSavedBuilds(next);
  return next;
}

export function updateSavedBuildTitle(id, newTitle) {
  const builds = loadSavedBuilds();
  const next = builds.map((b) =>
    b.id === id ? { ...b, title: newTitle.trim() || b.title } : b
  );
  persistSavedBuilds(next);
  return next;
}

export function buildArchiveEntry({ buildName, components, optimized_maps_query, tags = [] }) {
  const componentList = Array.isArray(components) ? components : [];
  return {
    id: `build-${Date.now()}`,
    title: buildName || 'Imported Build',
    createdAt: new Date().toISOString().split('T')[0],
    tags: tags.length ? tags : ['imported'],
    componentCount: componentList.length,
    notes: optimized_maps_query
      ? `Map query: "${optimized_maps_query}"`
      : 'Saved from Omni-Cart dashboard.',
    components: componentList.map((c) => ({
      name: c.name,
      quantity: c.quantity || 1,
      confidence_score: c.confidence_score ?? 0.85,
    })),
    buildSlots: null,
  };
}
