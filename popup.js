const toggleButton = document.getElementById("toggle");

chrome.storage.local.get(["filterEnabled"], (result) => {
  const enabled = result.filterEnabled ?? true;
  toggleButton.textContent = enabled ? "Disable Filter" : "Enable Filter";
});

toggleButton.addEventListener("click", () => {
  chrome.storage.local.get(["filterEnabled"], (result) => {
    const newValue = !result.filterEnabled;
    chrome.storage.local.set({ filterEnabled: newValue }, () => {
      toggleButton.textContent = newValue ? "Disable Filter" : "Enable Filter";
    });
  });
});
