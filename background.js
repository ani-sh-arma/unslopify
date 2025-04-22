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
