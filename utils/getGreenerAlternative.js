function getGreenerAlternative(product = {}) {
  const title = (product.title || "").toLowerCase();
  const category = (product.category || "").toLowerCase();

  if (
    title.includes("plastic bottle") ||
    (title.includes("bottle") && !title.includes("steel"))
  ) {
    return "Consider a stainless steel or glass bottle for long-term reuse.";
  }

  if (
    title.includes("t-shirt") ||
    title.includes("shirt") ||
    title.includes("jeans") ||
    category.includes("clothing")
  ) {
    return "Try sustainable fabrics like organic cotton or buy fewer long-lasting clothes.";
  }

  if (
    title.includes("charger") ||
    title.includes("phone") ||
    title.includes("laptop") ||
    category.includes("electronics")
  ) {
    return "Look for durable, repairable electronics with energy-efficient ratings.";
  }

  if (
    title.includes("notebook") ||
    title.includes("paper") ||
    category.includes("stationery")
  ) {
    return "Choose recycled paper products or buy in bulk to reduce packaging waste.";
  }

  if (
    title.includes("grocery") ||
    category.includes("food")
  ) {
    return "Prefer local products with minimal packaging when possible.";
  }

  return "Choose durable, reusable, and locally sourced alternatives whenever possible.";
}

module.exports = getGreenerAlternative;