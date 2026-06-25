import { useEffect, useState } from 'react';
import {
  ExtensionHeader,
  ScanSkeleton,
  ReadyCartSection,
  UnsureSection,
  MapPanel,
  DevSimulateButton,
} from './components/extension';
import { Button } from './components/ui';
import { useAnalyzeParts } from './hooks/useAnalyzeParts';
import { getImportUrl } from './utils/importBridge';

const WEB_DASHBOARD_URL = import.meta.env.VITE_WEB_DASHBOARD_URL || 'http://localhost:8888/';

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
      if (message.error) {
        setScanStatus(`Scan Error: ${message.error}`);
        return;
      }

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
      chrome.runtime.sendMessage({ action: 'START_OMNI_SCAN' }, (response) => {
        if (chrome.runtime.lastError) {
          setScanStatus('Scan failed to start.');
          return;
        }
        if (response?.error) {
          setScanStatus(`Scan Error: ${response.error}`);
        }
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

  const postToMap = (iframe, activeMode, userLocation) => {
    setScanStatus('Mapping Suppliers...');
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

  const triggerMapRender = (overrideMode) => {
    const activeMode = overrideMode || sortMode;
    const iframe = document.getElementById('map-sandbox');

    if (!iframe || !iframe.contentWindow) return;

    setScanStatus(mapIsVisible ? 'Recalculating Route...' : 'Acquiring GPS Location...');

    const fallbackLocation = { lat: 14.6507, lng: 121.1029 };

    navigator.geolocation.getCurrentPosition(
      (position) =>
        postToMap(iframe, activeMode, {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      () => {
        setScanStatus('Using Regional Base Location...');
        postToMap(iframe, activeMode, fallbackLocation);
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  };

  const handleSortChange = (mode) => {
    setSortMode(mode);
    triggerMapRender(mode);
  };

  const handleOpenWebDashboard = () => {
    const cartForImport = {
      source: 'extension',
      components: components
        .filter((component) => component.checked !== false)
        .map(({ checked, ...component }) => component),
      optimized_maps_query: searchQuery || 'electronic components shop',
    };
    const url = getImportUrl(WEB_DASHBOARD_URL, cartForImport);

    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url });
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const readyItems = components.filter((c) => c.confidence_score >= 0.8);
  const unsureItems = components.filter((c) => c.confidence_score < 0.8);
  const showSkeleton =
    isAnalyzing ||
    (components.length === 0 &&
      (scanStatus === 'Scanning Context...' || scanStatus.startsWith('Analyzing')));
  const showDevButton =
    scanStatus === 'Running in local dev mode.' && components.length === 0 && !isAnalyzing;

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
            <Button variant="outline" className="w-full" onClick={handleOpenWebDashboard}>
              Open in Web Dashboard
            </Button>
          </div>
        )}
      </main>

      {!showSkeleton && components.length > 0 && (
        <MapPanel
          mapIsVisible={mapIsVisible}
          sortMode={sortMode}
          onFindLocally={triggerMapRender}
          onSortChange={handleSortChange}
          components={components}
        />
      )}
    </div>
  );
}

export default ExtensionDashboard;
