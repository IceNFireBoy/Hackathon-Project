import { useMemo, useState } from 'react';
import { PageHeader } from '../components/dashboard';
import { Card, Badge, Button } from '../components/ui';
import { useBuildContext } from '../context/BuildContext';

const activeFilterClass = 'bg-accent-muted text-accent-bright border-accent/30';
const inactiveFilterClass = 'text-slate-400 border-surface-card hover:border-accent/30 hover:text-accent';

function EditableTitle({ title, onSave, className = '' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  const commit = () => {
    onSave(draft.trim() || title);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className={`flex items-center gap-2 ${className}`} onClick={(e) => e.stopPropagation()}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setDraft(title);
              setEditing(false);
            }
          }}
          className="flex-1 bg-surface-base border border-accent/40 rounded px-2 py-1 text-sm text-slate-200 outline-none"
          autoFocus
        />
        <Button size="sm" onClick={commit}>Save</Button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 min-w-0 ${className}`}>
      <h3 className="text-sm font-bold text-slate-200 truncate">{title}</h3>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setDraft(title);
          setEditing(true);
        }}
        className="shrink-0 p-1 rounded text-slate-500 hover:text-accent-bright hover:bg-surface-card/60 transition-colors"
        aria-label="Rename build"
        title="Rename build"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </div>
  );
}

function BuildDetailDrawer({ build, onClose, onDelete, onDuplicate, onLoad, onRename }) {
  if (!build) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-md h-full bg-surface-raised border-l border-surface-card overflow-y-auto animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-surface-card flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <EditableTitle
              title={build.title}
              onSave={(newTitle) => onRename(build.id, newTitle)}
              className="text-lg"
            />
            <p className="text-xs text-slate-500 mt-1">{build.createdAt}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-accent-bright text-xl shrink-0">&times;</button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-wrap gap-2">
            {(build.tags || []).map((tag) => (
              <Badge key={tag} variant="neutral">{tag}</Badge>
            ))}
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">Notes</p>
            <p className="text-sm text-slate-400 leading-relaxed">{build.notes}</p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-3">
              Components ({build.components?.length || 0})
            </p>
            <div className="space-y-2">
              {(build.components || []).map((comp, i) => (
                <div key={i} className="flex justify-between items-center py-2 px-3 bg-surface-base rounded-lg border border-surface-card/60">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-accent-bright shrink-0">{comp.quantity}x</span>
                    <span className="text-sm text-slate-300 truncate">{comp.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                    {Math.round((comp.confidence_score || 0) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button size="sm" onClick={() => onLoad(build)}>Load into Builder</Button>
            <Button variant="ghost" size="sm" onClick={() => onDuplicate(build)}>Duplicate</Button>
            <Button variant="danger" size="sm" onClick={() => onDelete(build.id)}>Delete</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SavedBuildsView({ onNavigate }) {
  const {
    savedBuilds,
    removeSavedBuild,
    duplicateSavedBuild,
    loadBuildFromArchive,
    renameSavedBuild,
  } = useBuildContext();

  const [selectedBuild, setSelectedBuild] = useState(null);
  const [activeTagFilter, setActiveTagFilter] = useState(null);

  const allTags = useMemo(() => {
    const tags = new Set();
    savedBuilds.forEach((b) => (b.tags || []).forEach((t) => tags.add(t)));
    return [...tags];
  }, [savedBuilds]);

  const filteredBuilds = activeTagFilter
    ? savedBuilds.filter((b) => b.tags?.includes(activeTagFilter))
    : savedBuilds;

  const handleLoad = (build) => {
    loadBuildFromArchive(build);
    setSelectedBuild(null);
    onNavigate?.('builder');
  };

  const handleRename = (id, newTitle) => {
    renameSavedBuild(id, newTitle);
    setSelectedBuild((prev) => (prev?.id === id ? { ...prev, title: newTitle } : prev));
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <PageHeader
        title="Saved Builds Archive"
        subtitle={`${savedBuilds.length} builds in local library`}
      />

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            onClick={() => setActiveTagFilter(null)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors border
              ${!activeTagFilter ? activeFilterClass : inactiveFilterClass}`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTagFilter(tag)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors border
                ${activeTagFilter === tag ? activeFilterClass : inactiveFilterClass}`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {savedBuilds.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-slate-400">No saved builds yet.</p>
          <p className="text-xs text-slate-500 mt-2">
            Import from the extension, then click &quot;Save to Archive&quot; in the sidebar.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBuilds.map((build) => (
            <Card
              key={build.id}
              className="p-4 cursor-pointer hover:border-accent/30 transition-colors"
              onClick={() => setSelectedBuild(build)}
            >
              <EditableTitle
                title={build.title}
                onSave={(newTitle) => handleRename(build.id, newTitle)}
              />
              <p className="text-xs text-slate-500 mt-1">
                {build.createdAt} · {build.componentCount} parts
              </p>
              <div className="flex flex-wrap gap-1 mt-3">
                {(build.tags || []).map((tag) => (
                  <Badge key={tag} variant="neutral">{tag}</Badge>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-3 line-clamp-2">{build.notes}</p>
            </Card>
          ))}
        </div>
      )}

      {filteredBuilds.length === 0 && savedBuilds.length > 0 && (
        <p className="text-center text-slate-500 text-sm py-12">No builds match this filter.</p>
      )}

      {selectedBuild && (
        <BuildDetailDrawer
          build={selectedBuild}
          onClose={() => setSelectedBuild(null)}
          onDelete={removeSavedBuild}
          onDuplicate={duplicateSavedBuild}
          onLoad={handleLoad}
          onRename={handleRename}
        />
      )}
    </div>
  );
}
