const extractBtn = document.getElementById("extractBtn");
const statusBox = document.getElementById("status");

function setStatus(message) {
  statusBox.textContent = message;
}

extractBtn.addEventListener("click", async () => {
  try {
    setStatus("Checking active tab...");

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (!tab || !tab.id) {
      setStatus("No active tab found.");
      return;
    }

    const url = tab.url || "";
    const isSupported =
      url.includes("amazon.in") || url.includes("flipkart.com");

    if (!isSupported) {
      setStatus("Open an Amazon or Flipkart page first.");
      return;
    }

    setStatus("Extracting visible product data...");

    chrome.tabs.sendMessage(tab.id, { type: "EXTRACT_PURCHASES" }, (response) => {
      if (chrome.runtime.lastError) {
        setStatus("Content script error: " + chrome.runtime.lastError.message);
        return;
      }

      if (!response || !response.success) {
        setStatus("Extraction failed.");
        return;
      }

      const purchases = response.purchases || [];

      if (!purchases.length) {
        setStatus("No valid purchase/product data found on this page.");
        return;
      }

      setStatus(`Found ${purchases.length} item(s).\nSending to backend...`);

      chrome.runtime.sendMessage(
        {
          type: "SEND_TO_BACKEND",
          purchases
        },
        (backendResponse) => {
          if (chrome.runtime.lastError) {
            setStatus("Backend message error: " + chrome.runtime.lastError.message);
            return;
          }

          if (!backendResponse || !backendResponse.success) {
            const errorMsg =
              backendResponse?.data?.message ||
              backendResponse?.error ||
              "Failed to save to backend.";
            setStatus("Save failed:\n" + errorMsg);
            return;
          }

          const result = backendResponse.data;

          setStatus(
            `Saved successfully.\n\nSaved: ${result.savedCount}\nSkipped: ${result.skippedCount}`
          );
        }
      );
    });
  } catch (error) {
    setStatus("Unexpected error: " + error.message);
  }
});