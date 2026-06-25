import { useState } from 'react';
import { PageHeader } from '../components/dashboard';
import { Card, Badge, Button } from '../components/ui';
import { SAVED_BUILDS, ALL_TAGS } from '../mocks';

const activeFilterClass = 'bg-accent-muted text-accent-bright border-accent/30';
const inactiveFilterClass = 'text-slate-400 border-surface-card hover:border-accent/30 hover:text-accent';

function BuildDetailDrawer({ build, onClose, onDelete, onDuplicate }) {
  if (!build) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-md h-full bg-surface-raised border-l border-surface-card overflow-y-auto animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-surface-card flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-slate-100">{build.title}</h2>
            <p className="text-xs text-slate-500 mt-1">{build.createdAt}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-accent-bright text-xl">&times;</button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-wrap gap-2">
            {build.tags.map((tag) => (
              <Badge key={tag} variant="neutral">{tag}</Badge>
            ))}
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">Notes</p>
            <p className="text-sm text-slate-400 leading-relaxed">{build.notes}</p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-3">
              Components ({build.components.length})
            </p>
            <div className="space-y-2">
              {build.components.map((comp, i) => (
                <div key={i} className="flex justify-between items-center py-2 px-3 bg-surface-base rounded-lg border border-surface-card/60">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-accent-bright shrink-0">{comp.quantity}x</span>
                    <span className="text-sm text-slate-300 truncate">{comp.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                    {Math.round(comp.confidence_score * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={() => onDuplicate(build)}>Duplicate</Button>
            <Button variant="danger" size="sm" onClick={() => onDelete(build.id)}>Delete</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SavedBuildsView() {
  const [builds, setBuilds] = useState(SAVED_BUILDS);
  const [selectedBuild, setSelectedBuild] = useState(null);
  const [activeTagFilter, setActiveTagFilter] = useState(null);

  const filteredBuilds = activeTagFilter
    ? builds.filter((b) => b.tags.includes(activeTagFilter))
    : builds;

  const handleDelete = (id) => {
    setBuilds((prev) => prev.filter((b) => b.id !== id));
    setSelectedBuild(null);
  };

  const handleDuplicate = (build) => {
    const duplicate = {
      ...build,
      id: `build-${Date.now()}`,
      title: `${build.title} (Copy)`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setBuilds((prev) => [duplicate, ...prev]);
    setSelectedBuild(null);
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <PageHeader title="Saved Builds Archive" subtitle={`${builds.length} builds in local library`} />

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTagFilter(null)}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors border
            ${!activeTagFilter ? activeFilterClass : inactiveFilterClass}`}
        >
          All
        </button>
        {ALL_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTagFilter(tag)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors border
              ${activeTagFilter === tag ? activeFilterClass : inactiveFilterClass}`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBuilds.map((build) => (
          <Card
            key={build.id}
            className="p-4 cursor-pointer hover:border-accent/30 transition-colors"
            onClick={() => setSelectedBuild(build)}
          >
            <h3 className="text-sm font-bold text-slate-200 truncate">{build.title}</h3>
            <p className="text-xs text-slate-500 mt-1">{build.createdAt} · {build.componentCount} parts</p>
            <div className="flex flex-wrap gap-1 mt-3">
              {build.tags.map((tag) => (
                <Badge key={tag} variant="neutral">{tag}</Badge>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-3 line-clamp-2">{build.notes}</p>
          </Card>
        ))}
      </div>

      {filteredBuilds.length === 0 && (
        <p className="text-center text-slate-500 text-sm py-12">No builds match this filter.</p>
      )}

      {selectedBuild && (
        <BuildDetailDrawer
          build={selectedBuild}
          onClose={() => setSelectedBuild(null)}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
        />
      )}
    </div>
  );
}
