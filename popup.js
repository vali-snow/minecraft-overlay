async function sendAction(action) {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  try {
    await chrome.tabs.sendMessage(tab.id, { action });
  } catch (err) {
    console.error("Content script is not available on this tab:", err);
  }
}

document.getElementById("activate").addEventListener("click", () => {
  sendAction("activate");
});

document.getElementById("deactivate").addEventListener("click", () => {
  sendAction("deactivate");
});