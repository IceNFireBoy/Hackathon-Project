import React, { useEffect, useState } from 'react';

const isLocal = true;
const API_BASE_URL = isLocal 
  ? 'http://localhost:8888/.netlify/functions' 
  : 'https://[YOUR-FUTURE-NETLIFY-URL]/.netlify/functions';

function App() {
  const [scanStatus, setScanStatus] = useState("Initializing...");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [components, setComponents] = useState([]);

  useEffect(() => {
    setScanStatus("Scanning Context...");

    const messageListener = async (message, sender, sendResponse) => {
      if (message.sourceType && message.data) {
        console.log("Payload received from fetcher:", message);
        setScanStatus("Analyzing with AI...");
        setIsAnalyzing(true);
        
        try {
          const response = await fetch(`${API_BASE_URL}/analyze-parts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message)
          });

          if (!response.ok) {
            const errorText = await response.text();
            try {
              const errorData = JSON.parse(errorText);
              throw new Error(errorData.error || `Server crashed with status ${response.status}`);
            } catch (parseError) {
              throw new Error(errorText.substring(0, 50) + "..."); 
            }
          }
          
          const result = await response.json();
          
          const formattedComponents = result.map(comp => ({
            ...comp,
            checked: comp.confidence_score >= 0.8
          }));
          
          setComponents(formattedComponents);
          setScanStatus("Verification Sandbox");
        } catch (error) {
          console.error("Backend Error:", error);
          setScanStatus(`AI Error: ${error.message}`);
        } finally {
          setIsAnalyzing(false);
        }
      }
    };

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(messageListener);
      
      chrome.runtime.sendMessage({ action: "START_OMNI_SCAN" }, (response) => {
        if (chrome.runtime.lastError) {
          setScanStatus("Scan failed to start.");
        }
      });
    } else {
      setScanStatus("Running in local dev mode.");
    }

    return () => {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.removeListener(messageListener);
      }
    };
  }, []);

  const toggleCheck = (index) => {
    const newComps = [...components];
    newComps[index] = { ...newComps[index], checked: !newComps[index].checked };
    setComponents(newComps);
  };

  const handleNameChange = (index, newName) => {
    const newComps = [...components];
    newComps[index] = { ...newComps[index], name: newName };
    setComponents(newComps);
  };

  const readyItems = components.filter(c => c.confidence_score >= 0.8);
  const unsureItems = components.filter(c => c.confidence_score < 0.8);

  return (
    // Pinned Layout: Fixed dimensions, no overflow on the main container
    <div className="w-[380px] h-[550px] flex flex-col bg-slate-950 text-slate-200 font-sans antialiased selection:bg-emerald-500/30 overflow-hidden">
      
      {/* Header (Pinned Top) */}
      <header className="text-center border-b border-slate-800 p-4 shrink-0 bg-slate-950 z-10 shadow-sm">
        <h1 className="text-2xl font-black tracking-widest text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]">
          OMNI-CART
        </h1>
        <p className="text-xs text-slate-400 animate-pulse mt-1">{scanStatus}</p>
      </header>

      {/* Middle Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Loading State */}
        {(isAnalyzing || (components.length === 0 && scanStatus === "Scanning Context...")) && (
          <div className="h-full flex flex-col justify-center items-center space-y-4 pt-10">
            <svg className="animate-spin h-10 w-10 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sm text-slate-400 animate-pulse">{scanStatus}</p>
          </div>
        )}

        {/* Development Mock Button */}
        {scanStatus === "Running in local dev mode." && components.length === 0 && (
          <button 
            onClick={() => {
              setIsAnalyzing(true);
              setScanStatus("Analyzing with AI...");
              fetch(`${API_BASE_URL}/analyze-parts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  sourceType: "article", 
                  data: "To build this blinking LED circuit, you will need a 5V power supply, an Arduino Nano, a breadboard, and two 220 ohm resistors." 
                })
              })
              .then(async res => {
                if (!res.ok) throw new Error("Mock fetch failed");
                return res.json();
              })
              .then(result => {
                setComponents(result.map(comp => ({ ...comp, checked: comp.confidence_score >= 0.8 })));
                setScanStatus("Verification Sandbox");
              })
              .catch(err => setScanStatus(`Error: ${err.message}`))
              .finally(() => setIsAnalyzing(false));
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg text-sm w-full transition-colors shadow-lg shadow-blue-900/20"
          >
            [DEV] Simulate Content Scan
          </button>
        )}

        {/* Verification Sandbox Lists */}
        {!isAnalyzing && components.length > 0 && (
          <div className="space-y-6 pb-2">
            
            {/* Unified Card: Ready Items */}
            <section className="w-full">
              <h2 className="text-[11px] font-bold text-emerald-300 mb-2 uppercase tracking-wider pl-1 opacity-90">
                Ready for Cart ({readyItems.length})
              </h2>
              <div className="w-full bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden shadow-sm">
                {readyItems.map((item) => {
                  const originalIndex = components.indexOf(item);
                  return (
                    <div key={originalIndex} className="flex items-start p-3 border-b border-slate-700/50 last:border-b-0 hover:bg-slate-700/40 transition-colors w-full group">
                      <input 
                        type="checkbox" 
                        checked={item.checked} 
                        onChange={() => toggleCheck(originalIndex)}
                        className="mt-0.5 w-4 h-4 accent-emerald-500 cursor-pointer shrink-0 mr-3"
                      />
                      <div className="flex items-start text-left w-full min-w-0">
                        {item.quantity > 1 && (
                          <span className="text-emerald-400 font-bold text-sm mr-2 shrink-0">
                            {item.quantity}x
                          </span>
                        )}
                        <span className="text-sm font-medium tracking-wide flex-1 break-words whitespace-normal min-w-0 pt-px text-slate-200">
                          {item.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {readyItems.length === 0 && <p className="text-xs text-slate-500 italic p-4 text-center">No highly confident items found.</p>}
              </div>
            </section>

            {/* Unified Card: Unsure Items */}
            <section className="w-full">
              <h2 className="text-[11px] font-bold text-amber-300 mb-2 uppercase tracking-wider pl-1 opacity-90">
                Unsure Components ({unsureItems.length})
              </h2>
              <div className="w-full bg-slate-800/30 rounded-xl border border-amber-500/30 overflow-hidden shadow-sm">
                {unsureItems.map((item) => {
                  const originalIndex = components.indexOf(item);
                  return (
                    <div key={originalIndex} className="flex flex-col p-3 border-b border-slate-700/50 last:border-b-0 hover:bg-slate-700/40 transition-colors w-full focus-within:bg-slate-800 focus-within:ring-1 focus-within:ring-amber-500/50">
                      <div className="flex items-center w-full">
                        <input 
                          type="checkbox" 
                          checked={item.checked} 
                          onChange={() => toggleCheck(originalIndex)}
                          className="w-4 h-4 accent-amber-500 cursor-pointer shrink-0 mr-3"
                        />
                        <div className="flex flex-1 items-center bg-slate-950/60 border border-slate-600/50 rounded overflow-hidden min-w-0">
                          {item.quantity > 1 && (
                            <span className="text-amber-400 font-bold text-sm pl-2 py-1 select-none border-r border-slate-600/50 pr-2 bg-slate-900/50 shrink-0">
                              {item.quantity}x
                            </span>
                          )}
                          <input 
                            type="text"
                            value={item.name}
                            onChange={(e) => handleNameChange(originalIndex, e.target.value)}
                            className="bg-transparent text-sm w-full px-2 py-1 focus:outline-none text-slate-200 placeholder-slate-500 min-w-0"
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-amber-400/80 pl-7 mt-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        Review needed ({(item.confidence_score * 100).toFixed(0)}% Match)
                      </span>
                    </div>
                  );
                })}
                {unsureItems.length === 0 && <p className="text-xs text-slate-400 italic p-4 text-center">No unsure items.</p>}
              </div>
            </section>

          </div>
        )}
      </div>

      {/* Footer / CTA & Sandbox (Pinned Bottom) */}
      {!isAnalyzing && components.length > 0 && (
        <div className="p-4 pt-2 border-t border-slate-800 shrink-0 bg-slate-950 z-10 flex flex-col space-y-4">
          
          {/* Hidden Sandbox iframe - Notice we removed the sandbox attribute and added overflow-hidden! */}
          <iframe 
            id="map-sandbox"
            src="sandbox.html" 
            className="w-full h-[200px] rounded-lg border border-slate-700/50 hidden overflow-hidden outline-none"
          ></iframe>

          <button 
            onClick={() => {
              // 1. Reveal the iframe visually
              const iframe = document.getElementById('map-sandbox');
              iframe.classList.remove('hidden');
              
              // 2. Shoot the data payload into the sandbox
              iframe.contentWindow.postMessage({
                action: 'RENDER_MAP',
                components: components.map(c => c.name) // Send just the names
              }, '*');
            }}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-emerald-900/40 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] tracking-wide"
          >
            Find Locally
          </button>
        </div>
      )}
    </div>
  );
}

export default App;