let stream = null;
let capturedImage = null;

// Open camera
async function openCamera() {
    const cameraSection = document.getElementById('cameraSection');
    const video = document.getElementById('video');
    
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        video.srcObject = stream;
        cameraSection.classList.remove('hidden');
        hideOtherSections(['cameraSection']);
    } catch (err) {
        alert('Could not access camera: ' + err.message);
    }
}

// Close camera
function closeCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    document.getElementById('cameraSection').classList.add('hidden');
    document.getElementById('video').srcObject = null;
}

// Capture image from camera
function captureImage() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const preview = document.getElementById('preview');
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    capturedImage = canvas.toDataURL('image/jpeg');
    preview.src = capturedImage;
    
    closeCamera();
    showPreview();
}

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            capturedImage = e.target.result;
            document.getElementById('preview').src = capturedImage;
            showPreview();
        };
        reader.readAsDataURL(file);
    }
}

// Show preview section
function showPreview() {
    hideOtherSections(['previewSection']);
    document.getElementById('previewSection').classList.remove('hidden');
}

// Process receipt
async function processReceipt() {
    if (!capturedImage) {
        alert('No image captured');
        return;
    }
    
    hideOtherSections(['loadingSection']);
    document.getElementById('loadingSection').classList.remove('hidden');
    
    try {
        // Convert base64 to blob
        const blob = await fetch(capturedImage).then(r => r.blob());
        
        // Create FormData
        const formData = new FormData();
        formData.append('receipt', blob, 'receipt.jpg');
        
        // Send to backend
        const response = await fetch('/api/parse-receipt', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayResults(data.data);
        } else {
            alert('Error processing receipt: ' + data.error);
            resetApp();
        }
    } catch (error) {
        alert('Error: ' + error.message);
        resetApp();
    }
}

// Display results
function displayResults(data) {
    hideOtherSections(['resultsSection']);
    const resultsSection = document.getElementById('resultsSection');
    const resultsDiv = document.getElementById('results');
    
    resultsDiv.innerHTML = '';
    
    if (data.carbon_footprint) {
        const carbonData = data.carbon_footprint;
        
        resultsDiv.innerHTML += `
            <div class="result-section carbon-section">
                <h3>🌍 Carbon Footprint Analysis</h3>
                <div class="result-item">
                    <span class="result-label">Total CO2e:</span>
                    <span class="result-value">${carbonData.total_co2_kg} kg (${carbonData.total_co2_lbs} lbs)</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Items Recognized:</span>
                    <span class="result-value">${carbonData.items_matched}/${carbonData.total_items}</span>
                </div>
            </div>
        `;
        
        // Display breakdown with data sources
        if (carbonData.breakdown && carbonData.breakdown.length > 0) {
            resultsDiv.innerHTML += `<h4>Item Breakdown (with Data Sources):</h4>`;
            
            carbonData.breakdown.forEach(item => {
                resultsDiv.innerHTML += `
                    <div class="result-item breakdown-item">
                        <div><strong>${item.item}</strong></div>
                        <div style="font-size: 0.85em; color: #666;">
                            Source: ${item.source} | Qty: ${item.quantity}
                        </div>
                        <div>CO2e: ${item.total_co2_kg} kg (${(item.total_co2_kg * 2.20462).toFixed(2)} lbs)</div>
                    </div>
                `;
            });
        }
        
        if (carbonData.not_found_list && carbonData.not_found_list.length > 0) {
            resultsDiv.innerHTML += `
                <div class="result-section">
                    <h4>Items Not Recognized:</h4>
                    <div style="color: #666; font-size: 0.9em;">
                        ${carbonData.not_found_list.join(', ')}
                    </div>
                </div>
            `;
        }
    }
    
    resultsSection.classList.remove('hidden');
}



// Reset app
function resetApp() {
    capturedImage = null;
    document.getElementById('preview').src = '';
    document.getElementById('fileInput').value = '';
    hideOtherSections([]);
}

// Hide sections except specified
function hideOtherSections(except) {
    const sections = ['cameraSection', 'previewSection', 'loadingSection', 'resultsSection'];
    sections.forEach(section => {
        if (!except.includes(section)) {
            document.getElementById(section).classList.add('hidden');
        }
    });
}
