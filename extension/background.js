chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SEND_TO_BACKEND") {
    fetch("http://localhost:5000/api/extension/purchases", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        purchases: message.purchases
      })
    })
      .then(async (response) => {
        const data = await response.json();
        sendResponse({
          success: response.ok,
          status: response.status,
          data
        });
      })
      .catch((error) => {
        sendResponse({
          success: false,
          error: error.message
        });
      });

    return true;
  }
});