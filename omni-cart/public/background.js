chrome.runtime.onInstalled.addListener(() => {
  console.log("Omni-Cart background worker initialized.");
});

// Modular helper function to handle the injection routing
function injectContextAwareFetcher(activeTab, sendResponse) {
  const url = activeTab.url;
  
  console.log("URL Context:", url);

  // Default fallback uses an array now
  let scriptFiles = ["domFetcher.js"]; 

  if (url.includes("youtube.com/watch") || url.includes("youtube.com/shorts")) {
    scriptFiles = ["videoFetcher.js"];
  }

  console.log(`Routing context matched. Injecting sequentially: ${scriptFiles.join(', ')}`);

  // Programmatically inject the scripts in order
  chrome.scripting.executeScript({
    target: { tabId: activeTab.id },
    files: scriptFiles // Passes the array
  }, () => {
    if (chrome.runtime.lastError) {
      console.error("Injection error:", chrome.runtime.lastError.message);
      sendResponse({ error: chrome.runtime.lastError.message });
    } else {
      sendResponse({ status: `Successfully injected ${scriptFiles.join(' and ')}` });
    }
  });
}

// The centralized message broker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "START_SCAN" || message.action === "START_OMNI_SCAN") {
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab) {
        sendResponse({ error: "No active tab found" });
        return;
      }

      // Call the updated router function
      injectContextAwareFetcher(activeTab, sendResponse);
    });

    return true; // Keep the message channel open for the async response
  }
});