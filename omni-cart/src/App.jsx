import React, { useEffect, useState } from 'react';

function App() {
  const [scanStatus, setScanStatus] = useState("Initializing...");

  useEffect(() => {
    // 1. Update UI state to show immediate action
    setScanStatus("Verifying Context...");

    // 2. Check if running inside Chrome Extension environment
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      // 3. Dispatch the message to the background script
      chrome.runtime.sendMessage({ action: "START_SCAN" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Messaging Error:", chrome.runtime.lastError);
          setScanStatus("Scan failed to start.");
          return;
        }
        
        console.log("Background response:", response);
        // You can update state here based on background script confirmation
      });
    } else {
      console.log("Running in local dev mode. Skipping Chrome API calls.");
    }
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-white border-2 border-slate-800">
      <div className="flex flex-col items-center space-y-5">
        {/* Animated Loading Spinner */}
        <div className="w-12 h-12 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin"></div>
        
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-wider text-emerald-400">
            OMNI-CART
          </h1>
          <p className="text-sm text-slate-400 animate-pulse mt-2">
            {scanStatus}
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;