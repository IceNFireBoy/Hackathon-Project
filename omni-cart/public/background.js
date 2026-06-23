chrome.runtime.onInstalled.addListener(() => {
  console.log("Omni-Cart background worker initialized.");
});

// Listen for messages from the React Popup or Content Scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "START_SCAN") {
    console.log("Scan command received from React popup.");
    
    // Future Phase 2 Logic: 
    // 1. Query the active tab
    // 2. Execute scripting.executeScript to inject Readability.js or the canvas sampler
    
    sendResponse({ status: "ACK", message: "Background worker has initiated the scanning protocol." });
  }
  
  // Return true to indicate that the response will be sent asynchronously
  return true; 
});