const input = document.getElementById("productInput");
const button = document.getElementById("analyzeBtn");

const productImage = document.getElementById("productImage");
const co2El = document.getElementById("co2Value");
const impactEl = document.getElementById("impactValue");

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

const detailsText = document.getElementById("detailsText");
const assumptionList = document.getElementById("assumptionList");

// Optional premium fields — only work if present in EJS
const gradeEl = document.getElementById("gradeValue");
const comparisonEl = document.getElementById("comparisonText");
const downloadBtn = document.getElementById("downloadBtn");

button.addEventListener("click", analyzeProduct);

input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    analyzeProduct();
  }
});

if (downloadBtn) {
  downloadBtn.addEventListener("click", downloadReport);
}

async function analyzeProduct() {
  const product = input.value.trim();

  if (!product) {
    resetUI();
    alert("Please enter a product name.");
    return;
  }

  button.disabled = true;
  setLoadingUI();

  try {
    const response = await fetch("/lca/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ product })
    });

    const data = await response.json();

    if (!data.success) {
      resetUI();
      alert(data.message || "Could not analyze this product.");
      return;
    }

    updateUI(data.result);
  } catch (error) {
    console.error("LCA Error:", error);
    resetUI();
    alert("Something went wrong while analyzing the product.");
  } finally {
    button.disabled = false;
  }
}

function setLoadingUI() {
  co2El.textContent = "Analyzing...";
  impactEl.textContent = "Loading...";

  detailsText.textContent = "Generating detailed life cycle analysis...";

  tip1.textContent = "";
  tip2.textContent = "";
  tip3.textContent = "";

  prodFill.style.width = "0%";
  transFill.style.width = "0%";
  usageFill.style.width = "0%";
  dispFill.style.width = "0%";

  prodPercent.textContent = "...";
  transPercent.textContent = "...";
  usagePercent.textContent = "...";
  dispPercent.textContent = "...";

  assumptionList.innerHTML = "";

  productImage.src = "/images/defaultLCA.png";

  if (gradeEl) gradeEl.textContent = "Loading...";
  if (comparisonEl) comparisonEl.textContent = "Calculating...";
}

function updateUI(item) {
  const co2 = safeNumber(item.co2);
  const production = clampPercent(item.production);
  const transportation = clampPercent(item.transportation);
  const usage = clampPercent(item.usage);
  const disposal = clampPercent(item.disposal);

  co2El.textContent = `${co2} kg CO₂e`;
  impactEl.textContent = item.impact || "MEDIUM";

  prodFill.style.width = `${production}%`;
  transFill.style.width = `${transportation}%`;
  usageFill.style.width = `${usage}%`;
  dispFill.style.width = `${disposal}%`;

  prodPercent.textContent = `${production}%`;
  transPercent.textContent = `${transportation}%`;
  usagePercent.textContent = `${usage}%`;
  dispPercent.textContent = `${disposal}%`;

  tip1.textContent = item.tips?.[0] || "";
  tip2.textContent = item.tips?.[1] || "";
  tip3.textContent = item.tips?.[2] || "";

  detailsText.textContent = item.details || "No detailed analysis available.";

  assumptionList.innerHTML = "";
  if (Array.isArray(item.assumptions) && item.assumptions.length) {
    item.assumptions.forEach((assumption) => {
      const li = document.createElement("li");
      li.textContent = assumption;
      assumptionList.appendChild(li);
    });
  }

  if (item.image && typeof item.image === "string" && item.image.trim()) {
    productImage.src = item.image;
  } else {
    productImage.src = "/images/defaultLCA.png";
  }

  if (gradeEl) {
    gradeEl.textContent = item.grade || calculateGrade(co2);
  }

  if (comparisonEl) {
    comparisonEl.textContent = item.comparison || generateComparisonText(co2);
  }
}

function resetUI() {
  co2El.textContent = "---";
  impactEl.textContent = "---";

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

  detailsText.textContent = "No analysis yet.";
  assumptionList.innerHTML = "";
  productImage.src = "/images/defaultLCA.png";

  if (gradeEl) gradeEl.textContent = "--";
  if (comparisonEl) comparisonEl.textContent = "--";
}

function safeNumber(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Number(num.toFixed(2));
}

function clampPercent(value) {
  let num = Number(value);
  if (Number.isNaN(num)) num = 0;
  if (num < 0) num = 0;
  if (num > 100) num = 100;
  return Math.round(num);
}

function calculateGrade(co2) {
  if (co2 <= 1) return "A+";
  if (co2 <= 2) return "A";
  if (co2 <= 4) return "B";
  if (co2 <= 7) return "C";
  if (co2 <= 10) return "D";
  return "F";
}

function generateComparisonText(co2) {
  const globalAvg = 5;

  if (co2 === 0) return "No comparison available.";
  if (co2 === globalAvg) return "This is close to the global average.";

  if (co2 > globalAvg) {
    const diff = (((co2 - globalAvg) / globalAvg) * 100).toFixed(0);
    return `${diff}% higher than average product footprint.`;
  } else {
    const diff = (((globalAvg - co2) / globalAvg) * 100).toFixed(0);
    return `${diff}% lower than average product footprint.`;
  }
}

async function downloadReport() {
  try {
    if (!window.jspdf || !window.html2canvas) {
      alert("PDF libraries are not loaded.");
      return;
    }

    const container = document.querySelector(".container");
    if (!container) {
      alert("Report area not found.");
      return;
    }

    const canvas = await window.html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff"
    });

    const imgData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
    heightLeft -= (pageHeight - 20);

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - 20);
    }

    const productName = input.value.trim() || "LCA_Report";
    const fileName = `${productName.replace(/\s+/g, "_")}_LCA_Report.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error("PDF Download Error:", error);
    alert("Could not generate PDF report.");
  }
}