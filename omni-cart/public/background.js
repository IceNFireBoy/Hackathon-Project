chrome.runtime.onInstalled.addListener(() => {
  console.log('Omni-Cart background worker initialized.');
});

const tabUrlCache = new Map();

// Helper to reliably check for YouTube contexts
function isYouTubeVideoUrl(url) {
  if (!url) return false;
  return url.includes('youtube.com/watch') || 
         url.includes('youtube.com/shorts') || 
         url.includes('youtu.be/');
}

// 1. Unified Context Router
function resolveScriptChain(url) {
  if (isYouTubeVideoUrl(url)) {
    // Pure HTML5 Canvas approach - no OpenCV needed!
    return ['videoFetcher.js'];
  }
  return ['domFetcher.js'];
}

function injectContextAwareFetcher(activeTab, sendResponse) {
  const url = activeTab.url;
  tabUrlCache.set(activeTab.id, url);

  console.log('URL Context:', url);

  const scriptFiles = resolveScriptChain(url);
  console.log(`Routing context matched. Injecting: ${scriptFiles.join(' ')}`);

  chrome.scripting.executeScript(
    {
      target: { tabId: activeTab.id },
      files: scriptFiles,
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error('Injection error:', chrome.runtime.lastError.message);
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ status: `Successfully injected ${scriptFiles[0]}` });
      }
    }
  );
}

function relayToExtensionPages(message) {
  chrome.runtime.sendMessage(message).catch(() => {});
}

// 2. YouTube SPA (Single Page Application) Route Tracker
function handleNavigationUpdate(tabId, url) {
  if (!url) return;
  tabUrlCache.set(tabId, url);

  if (isYouTubeVideoUrl(url)) {
    console.log(`Omni-Cart: YouTube SPA navigation detected on tab ${tabId}: ${url}`);
  }
}

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.frameId !== 0) return;
  handleNavigationUpdate(details.tabId, details.url);
});

chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId !== 0) return;
  handleNavigationUpdate(details.tabId, details.url);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabUrlCache.delete(tabId);
});

// 3. Main Message Broker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'START_SCAN' || message.action === 'START_OMNI_SCAN') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab?.id) {
        sendResponse({ error: 'No active tab found' });
        return;
      }

      const cachedUrl = tabUrlCache.get(activeTab.id);
      const tabForInjection =
        cachedUrl && cachedUrl !== activeTab.url
          ? { ...activeTab, url: cachedUrl }
          : activeTab;

      injectContextAwareFetcher(tabForInjection, sendResponse);
    });

    return true; // Keep channel open for async execution
  }

  // Relay data payloads from fetchers to the React UI
  if (sender.tab && (message.sourceType || message.error)) {
    relayToExtensionPages(message);
  }

  return false;
});