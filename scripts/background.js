// Wait for the runtime to be fully initialized
chrome.runtime.onInstalled.addListener(function () {
  // Delay the storage operation slightly to ensure API is ready
  setTimeout(() => {
    try {
      chrome.storage.local.set({ filterEnabled: true }, function () {
        console.log("Filter enabled by default");
      });
    } catch (error) {
      console.error("Error setting storage:", error);
    }
  }, 100);
});

// Listen for changes to the filterEnabled setting and broadcast to tabs
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.filterEnabled) {
    const isEnabled = changes.filterEnabled.newValue;

    // Broadcast to all tabs with Twitter/X open
    chrome.tabs.query({ url: ["*://*.twitter.com/*", "*://*.x.com/*"] }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          action: "toggleFiltering",
          enabled: isEnabled,
        }).catch(err => console.log(`Could not send to tab ${tab.id}:`, err));
      });
    });
  }
});

// Also send current state when a tab is updated (navigation/refresh)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' &&
      (tab.url?.includes('twitter.com') || tab.url?.includes('x.com'))) {
    chrome.storage.local.get(['filterEnabled'], (result) => {
      chrome.tabs.sendMessage(tabId, {
        action: "toggleFiltering",
        enabled: result.filterEnabled ?? true
      }).catch(err => console.log(`Could not send to tab ${tabId}:`, err));
    });
  }
});
