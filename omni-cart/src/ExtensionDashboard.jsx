import { useEffect, useState } from 'react';
import {
  ExtensionHeader,
  ScanSkeleton,
  ReadyCartSection,
  UnsureSection,
  MapPanel,
  DevSimulateButton,
} from './components/extension';
import { useAnalyzeParts } from './hooks/useAnalyzeParts';

function ExtensionDashboard() {
  const { analyze, isAnalyzing } = useAnalyzeParts();
  const [scanStatus, setScanStatus] = useState('Initializing...');
  const [components, setComponents] = useState([]);
  const [sortMode, setSortMode] = useState('trusted');
  const [mapIsVisible, setMapIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const formatResult = (result) => {
    const formattedComponents = result.components.map((comp) => ({
      ...comp,
      checked: comp.confidence_score >= 0.8,
    }));
    setComponents(formattedComponents);
    setSearchQuery(result.optimized_maps_query || 'electronic components shop');
    setScanStatus('Verification Sandbox');
  };

  useEffect(() => {
    setScanStatus('Scanning Context...');

    const messageListener = async (message) => {
      if (message.sourceType && message.data) {
        setScanStatus('Analyzing with AI...');
        try {
          const result = await analyze(message);
          formatResult(result);
        } catch (error) {
          console.error('Backend Error:', error);
          setScanStatus(`AI Error: ${error.message}`);
        }
      }
    };

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(messageListener);
      chrome.runtime.sendMessage({ action: 'START_OMNI_SCAN' }, () => {
        if (chrome.runtime.lastError) setScanStatus('Scan failed to start.');
      });
    } else {
      setScanStatus('Running in local dev mode.');
    }

    return () => {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.removeListener(messageListener);
      }
    };
  }, [analyze]);

  const toggleCheck = (index) => {
    setComponents((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], checked: !next[index].checked };
      return next;
    });
  };

  const handleNameChange = (index, newName) => {
    setComponents((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], name: newName };
      return next;
    });
  };

  const buildOnlineQuery = () => {
    const names = readyItems.map(item => item.name.trim()).filter(Boolean);
    if (names.length > 0) {
      return names;
    }
    return [searchQuery || 'electronics components shop'];
  };

  const triggerMapRender = (overrideMode) => {
    const activeMode = overrideMode || sortMode;
    const iframe = document.getElementById('map-sandbox');

    if (!iframe || !iframe.contentWindow) return;

<<<<<<< HEAD
    setScanStatus(activeMode === 'online' ? "Loading online options..." : mapIsVisible ? "Recalculating Route..." : "Acquiring GPS Location...");
    iframe.classList.remove('hidden');
    setMapIsVisible(true);

    if (activeMode === 'online') {
      const onlineQuery = buildOnlineQuery();
      iframe.contentWindow.postMessage({
        action: 'RENDER_MAP',
        userLocation: { lat: 14.6507, lng: 121.1029 },
        sortMode: activeMode,
        optimizedQuery: onlineQuery
      }, '*');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
        setScanStatus("Mapping Suppliers...");
        iframe.contentWindow.postMessage({
          action: 'RENDER_MAP',
          userLocation: userLocation,
          sortMode: activeMode,
          optimizedQuery: searchQuery 
        }, '*');
      },
      (error) => {
        const fallbackLocation = { lat: 14.6507, lng: 121.1029 }; 
        setScanStatus("Using Regional Base Location...");
        iframe.contentWindow.postMessage({
          action: 'RENDER_MAP',
          userLocation: fallbackLocation,
          sortMode: activeMode,
          optimizedQuery: searchQuery
        }, '*');
=======
    setScanStatus(mapIsVisible ? 'Recalculating Route...' : 'Acquiring GPS Location...');

    const postToMap = (userLocation) => {
      setScanStatus('Mapping Suppliers...');
      iframe.classList.remove('hidden');
      setMapIsVisible(true);
      iframe.contentWindow.postMessage(
        {
          action: 'RENDER_MAP',
          userLocation,
          sortMode: activeMode,
          optimizedQuery: searchQuery,
        },
        '*'
      );
    };

    navigator.geolocation.getCurrentPosition(
      (position) => postToMap({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => {
        setScanStatus('Using Regional Base Location...');
        postToMap({ lat: 14.6507, lng: 121.1029 });
>>>>>>> 043c87775edfedee59e0b3d37bee58d894dc4dcf
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  };

  const handleSortChange = (mode) => {
    setSortMode(mode);
    triggerMapRender(mode);
  };

  const readyItems = components.filter((c) => c.confidence_score >= 0.8);
  const unsureItems = components.filter((c) => c.confidence_score < 0.8);
  const showSkeleton =
    isAnalyzing || (components.length === 0 && scanStatus === 'Scanning Context...');
  const showDevButton = scanStatus === 'Running in local dev mode.' && components.length === 0 && !isAnalyzing;

  return (
    <div className="w-[380px] h-[550px] flex flex-col bg-surface-base text-slate-200 font-sans antialiased overflow-hidden">
      <ExtensionHeader scanStatus={scanStatus} isAnalyzing={isAnalyzing} />

      <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 space-y-3">
        {showSkeleton && <ScanSkeleton scanStatus={scanStatus} />}

        {showDevButton && (
          <DevSimulateButton
            onStart={() => setScanStatus('Analyzing with AI...')}
            onResult={formatResult}
            onEnd={() => {}}
          />
        )}

        {!showSkeleton && components.length > 0 && (
          <div className="space-y-4 pb-2">
            <ReadyCartSection
              items={readyItems}
              components={components}
              onToggleCheck={toggleCheck}
            />
            <UnsureSection
              items={unsureItems}
              components={components}
              onToggleCheck={toggleCheck}
              onNameChange={handleNameChange}
            />
          </div>
        )}
      </main>

        {/* Updated MOCK DEV BUTTON to match new JSON schema */}
        {scanStatus === "Running in local dev mode." && components.length === 0 && (
          <button 
            onClick={() => {
              setIsAnalyzing(true); setScanStatus("Analyzing with AI...");
              fetch(`${API_BASE_URL}/analyze-parts`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceType: "article", data: "You need an Arduino, a servo, and jumper wires." })
              })
              .then(res => res.json())
              .then(result => {
                setComponents(result.components.map(comp => ({ ...comp, checked: comp.confidence_score >= 0.8 })));
                setSearchQuery(result.optimized_maps_query);
                setScanStatus("Verification Sandbox");
              })
              .finally(() => setIsAnalyzing(false));
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg text-sm w-full transition-colors shadow-lg shadow-blue-900/20"
          >
            [DEV] Simulate Content Scan
          </button>
        )}

        {!isAnalyzing && components.length > 0 && (
          <div className="space-y-6 pb-2">
            <section className="w-full">
              <h2 className="text-[11px] font-bold text-emerald-300 mb-2 uppercase tracking-wider pl-1 opacity-90">Ready for Cart ({readyItems.length})</h2>
              <div className="w-full bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden shadow-sm">
                {readyItems.map((item) => {
                  const originalIndex = components.indexOf(item);
                  return (
                    <div key={originalIndex} className="flex items-start p-3 border-b border-slate-700/50 last:border-b-0 hover:bg-slate-700/40 transition-colors w-full">
                      <input type="checkbox" checked={item.checked} onChange={() => toggleCheck(originalIndex)} className="mt-0.5 w-4 h-4 accent-emerald-500 cursor-pointer shrink-0 mr-3"/>
                      <span className="text-sm font-medium tracking-wide flex-1 text-slate-200">{item.name}</span>
                    </div>
                  );
                })}
              </div>
            </section>
            
            <section className="w-full">
              <h2 className="text-[11px] font-bold text-amber-300 mb-2 uppercase tracking-wider pl-1 opacity-90">Unsure Components ({unsureItems.length})</h2>
              <div className="w-full bg-slate-800/30 rounded-xl border border-amber-500/30 overflow-hidden shadow-sm">
                {unsureItems.map((item) => {
                  const originalIndex = components.indexOf(item);
                  return (
                    <div key={originalIndex} className="flex flex-col p-3 border-b border-slate-700/50 last:border-b-0">
                      <div className="flex items-center w-full">
                        <input type="checkbox" checked={item.checked} onChange={() => toggleCheck(originalIndex)} className="w-4 h-4 accent-amber-500 cursor-pointer shrink-0 mr-3"/>
                        <input type="text" value={item.name} onChange={(e) => handleNameChange(originalIndex, e.target.value)} className="bg-slate-950/60 border border-slate-600/50 rounded text-sm w-full px-2 py-1 text-slate-200"/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </div>

      {!isAnalyzing && components.length > 0 && (
        <div className="p-4 pt-2 border-t border-slate-800 shrink-0 bg-slate-950 z-10 flex flex-col space-y-3">
          
          <iframe id="map-sandbox" src="sandbox.html" width="100%" height="300" sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-modals allow-same-origin" allow="geolocation" className="hidden border border-slate-600 rounded-lg overflow-hidden mt-2"></iframe>

          {mapIsVisible ? (
            <div className="flex flex-col space-y-2">
              <div className="flex space-x-2">
                <button 
                  onClick={() => { setSortMode('trusted'); triggerMapRender('trusted'); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${sortMode === 'trusted' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  🏆 Most Trusted
                </button>
                <button 
                  onClick={() => { setSortMode('distance'); triggerMapRender('distance'); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${sortMode === 'distance' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  📍 Closest Dist.
                </button>
                <button 
                  onClick={() => { setSortMode('online'); triggerMapRender('online'); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${sortMode === 'online' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  🛒 Online Stores
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => triggerMapRender()}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold py-3 px-4 rounded-lg shadow-lg"
            >
              Find Locally
            </button>
          )}
        </div>
      {!showSkeleton && components.length > 0 && (
        <MapPanel
          mapIsVisible={mapIsVisible}
          sortMode={sortMode}
          onFindLocally={triggerMapRender}
          onSortChange={handleSortChange}
        />
      )}
    </div>
  );
}

export default ExtensionDashboard;
