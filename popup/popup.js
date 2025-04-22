const toggleButton = document.getElementById("toggle");
const hiddenCountElement = document.getElementById("hidden-count");
const slopCountElement = document.getElementById("slop-count");
const adCountElement = document.getElementById("ad-count");

// Update the hidden count when popup opens
function updateHiddenCount() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (
      tabs[0] &&
      tabs[0].url &&
      (tabs[0].url.includes("twitter.com") || tabs[0].url.includes("x.com"))
    ) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "getHiddenCount" },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            // Show N/A if we can't get counts
            hiddenCountElement.textContent = "N/A";
            slopCountElement.textContent = "N/A";
            adCountElement.textContent = "N/A";
            return;
          }
          if (response) {
            hiddenCountElement.textContent = response.total || 0;
            slopCountElement.textContent = response.slop || 0;
            adCountElement.textContent = response.ads || 0;
          }
        }
      );
    } else {
      hiddenCountElement.textContent = "N/A";
      slopCountElement.textContent = "0";
      adCountElement.textContent = "0";
    }
  });
}

// Initialize toggle button state
chrome.storage.local.get(["filterEnabled"], (result) => {
  const enabled = result.filterEnabled !== false; // Default to true
  toggleButton.textContent = enabled ? "Disable Filter" : "Enable Filter";
  updateHiddenCount();
});

// Handle toggle button click
toggleButton.addEventListener("click", () => {
  chrome.storage.local.get(["filterEnabled"], (result) => {
    const newValue = !(result.filterEnabled !== false); // Toggle the current value
    chrome.storage.local.set({ filterEnabled: newValue }, () => {
      toggleButton.textContent = newValue ? "Disable Filter" : "Enable Filter";
      // The background script will notify content scripts
      // Wait a moment for the change to take effect
      setTimeout(updateHiddenCount, 500);
    });
  });
});

// Update count every second while popup is open
setInterval(updateHiddenCount, 2000);
