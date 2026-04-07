// ======= MASTER MOCK DATA (ALL 10 ITEMS) =======
const mockData = {
    "t-shirt": {
        co2: 0.8,
        impact: "MEDIUM",
        production: 40,
        transportation: 10,
        usage: 20,
        disposal: 30,
        tips: [
            "Prefer garments certified for lower-impact production (e.g., GOTS or OEKO-TEX) to reduce upstream emissions.",
            "Increase use-phase efficiency: wash in cold water and line-dry to cut lifetime energy use.",
            "Buy second-hand or buy fewer higher-quality pieces to lower per-use embodied carbon."
        ]
    },
    "water bottle": {
        co2: 1.2,
        impact: "HIGH",
        production: 60,
        transportation: 10,
        usage: 5,
        disposal: 25,
        tips: [
            "Choose reusable stainless steel or glass bottles with long guaranteed lifetimes to amortize production emissions.",
            "Prefer locally manufactured bottles or refill stations to reduce transport-related CO₂e.",
            "If plastic, select bottles with high recycled content (rPET) and recycle them through proper streams."
        ]
    },
    "smartphone": {
        co2: 55,
        impact: "VERY HIGH",
        production: 70,
        transportation: 10,
        usage: 15,
        disposal: 5,
        tips: [
            "Extend service life by 2–3 years and prioritize software updates over replacement to reduce annualized emissions.",
            "When replacing, consider refurbished models or buy devices with modular/repairable designs.",
            "Recycle through certified e-waste programs to recover critical metals and avoid toxic end-of-life impacts."
        ]
    },
    "plastic bag": {
        co2: 0.1,
        impact: "LOW",
        production: 50,
        transportation: 20,
        usage: 10,
        disposal: 20,
        tips: [
            "Replace single-use plastic bags with durable reusable bags (cotton or recycled PET) to cut lifetime waste.",
            "Reuse existing bags multiple times and prefer shops that offer refill or bring-your-own schemes.",
            "Avoid burning or open disposal; use municipal recycling/collection to reduce environmental harm."
        ]
    },
    "jeans": {
        co2: 3.5,
        impact: "MEDIUM-HIGH",
        production: 50,
        transportation: 10,
        usage: 30,
        disposal: 10,
        tips: [
            "Buy from brands using lower-impact fibres (recycled denim or organic cotton) to reduce manufacturing emissions.",
            "Increase per-item use: repair, tailor and wear longer to lower the per-wear carbon footprint.",
            "Choose low-temperature washing and line-drying; consider professional repair instead of replacement."
        ]
    },
    "shoes": {
        co2: 2.0,
        impact: "MEDIUM",
        production: 60,
        transportation: 15,
        usage: 10,
        disposal: 15,
        tips: [
            "Select durable designs and materials (repairable soles, replaceable components) to extend service life.",
            "Opt for brands with transparent supply chains and recycled or bio-based materials where possible.",
            "Maintain and resoling where available — repairing can cut lifetime emissions far below buying new."
        ]
    },
    "laptop": {
        co2: 200,
        impact: "VERY HIGH",
        production: 80,
        transportation: 5,
        usage: 10,
        disposal: 5,
        tips: [
            "Prioritize refurbished or business-grade units with longer warranty and upgrade paths to reduce embodied carbon.",
            "Optimize use-phase energy: enable power-saving profiles and avoid 24/7 charging to cut operational emissions.",
            "When retiring, recycle through certified e-steward programs so critical materials are recovered and toxics are managed."
        ]
    },
    "book": {
        co2: 0.7,
        impact: "LOW",
        production: 55,
        transportation: 25,
        usage: 10,
        disposal: 10,
        tips: [
            "Buy second-hand or share books through libraries to reduce demand for virgin paper and transport emissions.",
            "Prefer books printed on FSC-certified paper or with high recycled content to lower forestry impacts.",
            "Donate or pass on books after use to increase the number of reads per production-unit."
        ]
    },
    "milk carton": {
        co2: 0.5,
        impact: "LOW-MEDIUM",
        production: 40,
        transportation: 40,
        usage: 5,
        disposal: 15,
        tips: [
            "Choose locally produced dairy or plant-based alternatives to reduce transport and supply-chain emissions.",
            "Prefer cartons with clear recycling streams or returnable/refill systems to limit end-of-life impact.",
            "Minimise food waste by planning purchases and using full contents — wastage multiplies the product’s footprint."
        ]
    },
    "headphones": {
        co2: 1.8,
        impact: "MEDIUM",
        production: 65,
        transportation: 10,
        usage: 20,
        disposal: 5,
        tips: [
            "Choose modular or repairable headphones and replace cables or pads rather than the whole unit.",
            "Buy durable models from manufacturers with transparent materials and take-back programs.",
            "Use product warranties and certified repair services to extend service life and reduce replacement frequency."
        ]
    }
};



// ======= DOM ELEMENTS =======
const input = document.querySelector(".input-row input");
const button = document.querySelector(".input-row button");

const co2El = document.querySelector(".co2");
const impactEl = document.querySelector(".overall-value");

const prodFill = document.getElementById("prodFill");
const transFill = document.getElementById("transFill");
const usageFill = document.getElementById("usageFill");
const dispFill = document.getElementById("dispFill");

const prodPercent = document.getElementById("prodPercent");
const transPercent = document.getElementById("transPercent");
const usagePercent = document.getElementById("usagePercent");
const dispPercent = document.getElementById("dispPercent");

const tip1 = document.getElementById("tip1");
const tip2 = document.getElementById("tip2");
const tip3 = document.getElementById("tip3");



// ====== BUTTON CLICK ======
button.addEventListener("click", () => {
    const product = input.value.trim().toLowerCase();

    // EMPTY SEARCH → RESET
    if (product === "") {
        resetUI();
        return;
    }

    // NOT FOUND
    if (!mockData[product]) {
        resetUI();
        alert("Product not found!");
        return;
    }

    // FOUND → UPDATE
    updateUI(mockData[product]);
});



// ====== UPDATE UI ======
function updateUI(item) {

    co2El.textContent = item.co2 + " kg CO₂e";
    impactEl.textContent = item.impact;

    prodFill.style.width = item.production + "%";
    transFill.style.width = item.transportation + "%";
    usageFill.style.width = item.usage + "%";
    dispFill.style.width = item.disposal + "%";

    prodPercent.textContent = item.production + "%";
    transPercent.textContent = item.transportation + "%";
    usagePercent.textContent = item.usage + "%";
    dispPercent.textContent = item.disposal + "%";

    tip1.textContent = item.tips[0];
    tip2.textContent = item.tips[1];
    tip3.textContent = item.tips[2];
}



// ====== RESET UI ======
function resetUI() {

    co2El.textContent = "—";
    impactEl.textContent = "—";

    prodFill.style.width = "0%";
    transFill.style.width = "0%";
    usageFill.style.width = "0%";
    dispFill.style.width = "0%";

    prodPercent.textContent = "0%";
    transPercent.textContent = "0%";
    usagePercent.textContent = "0%";
    dispPercent.textContent = "0%";

    tip1.textContent = "";
    tip2.textContent = "";
    tip3.textContent = "";
}
