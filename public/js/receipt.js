console.log("Receipt JS Loaded");

// Show image preview
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const preview = document.getElementById("preview");
    preview.src = URL.createObjectURL(file);

    document.getElementById("previewSection").classList.remove("hidden");
}

// Send to backend
async function processReceipt() {
    const file = document.getElementById("fileInput").files[0];
    if (!file) return alert("Please upload a receipt first!");

    document.getElementById("loadingSection").classList.remove("hidden");

    const formData = new FormData();
    formData.append("receipt", file);

    try {
        const res = await fetch("/api/receipt/parse", {
            method: "POST",
            body: formData
        });

        const data = await res.json();

        document.getElementById("loadingSection").classList.add("hidden");

        if (!data.success) {
            return alert("Parsing error: " + data.msg);
        }

        document.getElementById("resultsSection").classList.remove("hidden");
        document.getElementById("results").innerHTML =
            "<pre>" + JSON.stringify(data, null, 2) + "</pre>";

    } catch (err) {
        console.log(err);
        alert("Upload failed");
    }
}

function resetApp() {
    location.reload();
}
