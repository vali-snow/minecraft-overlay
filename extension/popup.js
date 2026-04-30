async function sendAction(action) {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  try {
    await chrome.tabs.sendMessage(tab.id, { action });
  } catch (err) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      });

      await chrome.tabs.sendMessage(tab.id, { action });
    } catch (injectErr) {
      console.error("Could not inject content script:", err, injectErr);
    }
  }
}

document.getElementById("activate").addEventListener("click", () => {
  sendAction("activate");
});

document.getElementById("deactivate").addEventListener("click", () => {
  sendAction("deactivate");
});