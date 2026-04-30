async function sendAction(action) {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  try {
    await chrome.tabs.sendMessage(tab.id, { action });
  } catch (err) {
    console.warn("Content script not available. Injecting...", err);
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      });

      await chrome.tabs.sendMessage(tab.id, { action });
    } catch (injectErr) {
      console.error("Could not inject content script:", injectErr);
    }
  }
}

document.getElementById("activate").addEventListener("click", () => {
  sendAction("activate");
});

document.getElementById("deactivate").addEventListener("click", () => {
  sendAction("deactivate");
});