function estimateCarbon(product = {}) {
  const title = (product.title || "").toLowerCase();
  const category = (product.category || "").toLowerCase();
  const quantity = Number(product.quantity || 1);

  let baseCarbon = 5; // default fallback kg CO2

  // Electronics
  if (
    title.includes("phone") ||
    title.includes("mobile") ||
    title.includes("laptop") ||
    title.includes("charger") ||
    title.includes("earphone") ||
    category.includes("electronics")
  ) {
    baseCarbon = 25;
  }

  // Clothing
  else if (
    title.includes("shirt") ||
    title.includes("t-shirt") ||
    title.includes("jeans") ||
    title.includes("jacket") ||
    title.includes("shoe") ||
    category.includes("fashion") ||
    category.includes("clothing")
  ) {
    baseCarbon = 8;
  }

  // Household / reusable items
  else if (
    title.includes("bottle") ||
    title.includes("container") ||
    title.includes("utensil") ||
    category.includes("household")
  ) {
    baseCarbon = 3;
  }

  // Books / stationery
  else if (
    title.includes("book") ||
    title.includes("notebook") ||
    title.includes("pen") ||
    category.includes("stationery")
  ) {
    baseCarbon = 2;
  }

  // Food / grocery
  else if (
    title.includes("rice") ||
    title.includes("milk") ||
    title.includes("bread") ||
    title.includes("snack") ||
    category.includes("food") ||
    category.includes("grocery")
  ) {
    baseCarbon = 1.5;
  }

  return Number((baseCarbon * quantity).toFixed(2));
}

module.exports = estimateCarbon;