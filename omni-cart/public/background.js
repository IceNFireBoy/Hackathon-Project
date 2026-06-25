chrome.runtime.onInstalled.addListener(() => {
  console.log('Omni-Cart background worker initialized.');
});

const tabUrlCache = new Map();

function isYouTubeWatchUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return true;
    if (host !== 'youtube.com' && host !== 'm.youtube.com') return false;
    return parsed.pathname === '/watch' || parsed.pathname.startsWith('/watch/');
  } catch {
    return url.includes('youtube.com/watch') || url.includes('youtu.be/');
  }
}

function isYouTubeShortsUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host !== 'youtube.com' && host !== 'm.youtube.com') return false;
    return parsed.pathname.startsWith('/shorts');
  } catch {
    return url.includes('youtube.com/shorts');
  }
}

function resolveScriptChain(url) {
  if (isYouTubeWatchUrl(url)) {
    return ['opencv.js', 'youtubeFetcher.js'];
  }
  if (isYouTubeShortsUrl(url)) {
    return ['opencv.js', 'shortsFetcher.js'];
  }
  return ['domFetcher.js'];
}

function injectScriptsSequentially(tabId, scriptFiles, sendResponse) {
  if (!scriptFiles.length) {
    sendResponse({ error: 'No scripts to inject.' });
    return;
  }

  const injectNext = (index) => {
    if (index >= scriptFiles.length) {
      sendResponse({ status: `Successfully injected ${scriptFiles.join(' → ')}` });
      return;
    }

    chrome.scripting.executeScript(
      {
        target: { tabId },
        files: [scriptFiles[index]],
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error('Injection error:', chrome.runtime.lastError.message);
          sendResponse({ error: chrome.runtime.lastError.message });
          return;
        }

        const isOpenCv = scriptFiles[index] === 'opencv.js';
        const delayMs = isOpenCv ? 600 : 0;
        setTimeout(() => injectNext(index + 1), delayMs);
      }
    );
  };

  injectNext(0);
}

function injectContextAwareFetcher(activeTab, sendResponse) {
  const url = activeTab.url;
  tabUrlCache.set(activeTab.id, url);

  console.log('URL Context:', url);

  const scriptFiles = resolveScriptChain(url);
  console.log(`Routing context matched. Injecting sequentially: ${scriptFiles.join(' → ')}`);

  injectScriptsSequentially(activeTab.id, scriptFiles, sendResponse);
}

function relayToExtensionPages(message) {
  chrome.runtime.sendMessage(message).catch(() => {});
}

function handleNavigationUpdate(tabId, url) {
  if (!url) return;
  tabUrlCache.set(tabId, url);

  if (isYouTubeWatchUrl(url) || isYouTubeShortsUrl(url)) {
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

    return true;
  }

  if (sender.tab && (message.sourceType || message.error)) {
    relayToExtensionPages(message);
  }

  return false;
});
