function cleanPrice(priceText) {
  if (!priceText) return 0;
  const cleaned = priceText.replace(/[^0-9.]/g, "");
  return cleaned ? Number(cleaned) : 0;
}

function extractAmazonData() {
  const purchases = [];

  // Product page selectors
  const titleEl =
    document.querySelector("#productTitle") ||
    document.querySelector("span#title") ||
    document.querySelector("h1 span");

  const priceEl =
    document.querySelector(".a-price .a-offscreen") ||
    document.querySelector("#priceblock_ourprice") ||
    document.querySelector("#priceblock_dealprice");

  if (titleEl && priceEl) {
    const title = titleEl.innerText.trim();
    const price = cleanPrice(priceEl.innerText);

    if (title && price > 0) {
      purchases.push({
        platform: "Amazon",
        title,
        category: "General",
        price,
        quantity: 1,
        orderDate: new Date().toISOString()
      });
    }
  }

  // Generic fallback scan for cards/blocks
  if (purchases.length === 0) {
    const blocks = document.querySelectorAll("div");

    blocks.forEach((block) => {
      const text = block.innerText ? block.innerText.trim() : "";
      if (!text || text.length < 15) return;
      if (!text.includes("₹")) return;

      const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
      if (lines.length < 2) return;

      const possibleTitle = lines[0];
      const priceMatch = text.match(/₹\s?[\d,]+/);

      if (possibleTitle && priceMatch) {
        const price = cleanPrice(priceMatch[0]);
        if (price > 0) {
          purchases.push({
            platform: "Amazon",
            title: possibleTitle,
            category: "General",
            price,
            quantity: 1,
            orderDate: new Date().toISOString()
          });
        }
      }
    });
  }

  return deduplicatePurchases(purchases);
}

function extractFlipkartData() {
  const purchases = [];

  // Product page selectors
  const titleEl =
    document.querySelector("span.B_NuCI") ||
    document.querySelector("h1 span") ||
    document.querySelector("h1");

  const priceEl =
    document.querySelector("div._30jeq3") ||
    document.querySelector("div.Nx9bqj") ||
    document.querySelector("._16Jk6d");

  if (titleEl && priceEl) {
    const title = titleEl.innerText.trim();
    const price = cleanPrice(priceEl.innerText);

    if (title && price > 0) {
      purchases.push({
        platform: "Flipkart",
        title,
        category: "General",
        price,
        quantity: 1,
        orderDate: new Date().toISOString()
      });
    }
  }

  // Generic fallback scan
  if (purchases.length === 0) {
    const blocks = document.querySelectorAll("div");

    blocks.forEach((block) => {
      const text = block.innerText ? block.innerText.trim() : "";
      if (!text || text.length < 15) return;
      if (!text.includes("₹")) return;

      const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
      if (lines.length < 2) return;

      const possibleTitle = lines[0];
      const priceMatch = text.match(/₹\s?[\d,]+/);

      if (possibleTitle && priceMatch) {
        const price = cleanPrice(priceMatch[0]);
        if (price > 0) {
          purchases.push({
            platform: "Flipkart",
            title: possibleTitle,
            category: "General",
            price,
            quantity: 1,
            orderDate: new Date().toISOString()
          });
        }
      }
    });
  }

  return deduplicatePurchases(purchases);
}

function deduplicatePurchases(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = `${item.platform}|${item.title}|${item.price}|${item.quantity}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function detectPlatformAndExtract() {
  const hostname = window.location.hostname;

  if (hostname.includes("amazon")) {
    return extractAmazonData();
  }

  if (hostname.includes("flipkart")) {
    return extractFlipkartData();
  }

  return [];
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "EXTRACT_PURCHASES") {
    try {
      const purchases = detectPlatformAndExtract();

      sendResponse({
        success: true,
        purchases
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }
});