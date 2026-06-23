chrome.runtime.onInstalled.addListener(() => {
  console.log("Omni-Cart background worker initialized.");
});

// Modular helper function to handle the injection routing
function injectContextAwareFetcher(activeTab, sendResponse) {
  const url = activeTab.url;
  
  // Explicitly log the URL context as requested
  console.log("URL Context:", url);

  let scriptFile = "domFetcher.js"; // Default fallback

  if (url.includes("youtube.com/watch")) {
    scriptFile = "youtubeFetcher.js";
  } else if (url.includes("youtube.com/shorts")) {
    scriptFile = "shortsFetcher.js";
  }

  console.log(`Routing match. Injecting: ${scriptFile}`);

  // Programmatically inject the script
  chrome.scripting.executeScript({
    target: { tabId: activeTab.id },
    files: [scriptFile]
  }, () => {
    if (chrome.runtime.lastError) {
      console.error("Injection error:", chrome.runtime.lastError.message);
      sendResponse({ error: chrome.runtime.lastError.message });
    } else {
      sendResponse({ status: `Successfully injected ${scriptFile}` });
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

      // Call the new router function
      injectContextAwareFetcher(activeTab, sendResponse);
    });

    return true; // Keep the message channel open for the async response
  }
});