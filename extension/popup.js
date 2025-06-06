// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL(
  "lib/pdf.worker.min.js"
);

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const loading = document.getElementById("loading");
const error = document.getElementById("error");
const previewContainer = document.getElementById("previewContainer");
const previewImages = document.getElementById("previewImages");
const downloadBtn = document.getElementById("downloadBtn");
const formatOptions = document.querySelectorAll(".format-option");
const qualitySelector = document.getElementById("quality");
const pageRange = document.getElementById("pageRange");

let currentFormat = "png";
let currentQuality = 1;
let convertedImages = [];
let originalCanvases = [];
let currentFile = null;

// Handle file selection triggered by click or drag-drop
dropZone.addEventListener("click", () => {
  if (fileInput) {
    fileInput.click();
  } else {
    console.error("File input element not found!");
  }
});
fileInput.addEventListener("change", handleFileSelect);

// Handle drag and drop events
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file && file.type === "application/pdf") {
    handleFile(file);
  } else {
    showError("Please select a valid PDF file");
  }
});

// Handle format selection
formatOptions.forEach((option) => {
  option.addEventListener("click", () => {
    formatOptions.forEach((opt) => opt.classList.remove("active"));
    option.classList.add("active");
    currentFormat = option.dataset.format;
    updateImages();
  });
});

// Handle quality selection
qualitySelector.addEventListener("change", (e) => {
  currentQuality = parseFloat(e.target.value);
  updateImages();
});

// Handle page range selection
pageRange.addEventListener("change", () => {
  if (currentFile) {
    handleFile(currentFile);
  }
});

// Handle download button click
downloadBtn.addEventListener("click", () => {
  if (convertedImages.length > 0) {
    const originalName = currentFile.name.replace(/\.pdf$/i, "");

    if (convertedImages.length === 1) {
      // Single page download
      const link = document.createElement("a");
      link.download = `${originalName}.${currentFormat}`;
      link.href = convertedImages[0];
      link.click();
    } else {
      // Multiple pages download
      convertedImages.forEach((imageData, index) => {
        const link = document.createElement("a");
        link.download = `${originalName}_page${index + 1}.${currentFormat}`;
        link.href = imageData;
        link.click();
      });
    }

    // Show success message
    const success = document.createElement("div");
    success.className = "success";
    success.textContent = "Download started!";
    document.body.appendChild(success);
    setTimeout(() => success.remove(), 3000);
  } else {
    console.warn("No images to download");
  }
});

// Process selected/dropped file
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) {
    handleFile(file);
  } else {
    console.log("No file selected via input");
  }
}

// Main file processing function
async function handleFile(file) {
  if (file.size > 10 * 1024 * 1024) {
    showError("File size must be less than 10MB");
    return;
  }

  currentFile = file;
  showLoading();
  const reader = new FileReader();

  reader.onload = async function (e) {
    try {
      const typedarray = new Uint8Array(e.target.result);
      const pdf = await pdfjsLib.getDocument(typedarray).promise;

      // Clear previous previews
      previewImages.innerHTML = "";
      originalCanvases = [];
      convertedImages = [];

      // Determine which pages to process
      const numPages = pdf.numPages;
      const pagesToProcess =
        pageRange.value === "all"
          ? Array.from({ length: numPages }, (_, i) => i + 1)
          : [1];

      // Process each page
      for (const pageNum of pagesToProcess) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        originalCanvases.push(canvas);
      }

      updateImages();
      hideLoading();
    } catch (err) {
      console.error("Conversion error:", err);
      showError("Error converting PDF: " + err.message);
      hideLoading();
    }
  };

  reader.onerror = function () {
    console.error("FileReader error", reader.error);
    showError("Error reading file");
    hideLoading();
  };

  reader.readAsArrayBuffer(file);
}

// Generate images from canvases based on current format and quality
function updateImages() {
  if (originalCanvases.length === 0) {
    console.warn("No canvases available for updateImages");
    return;
  }

  convertedImages = [];
  previewImages.innerHTML = "";

  originalCanvases.forEach((canvas, index) => {
    const tempCanvas = document.createElement("canvas");
    const tempContext = tempCanvas.getContext("2d");

    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempContext.drawImage(canvas, 0, 0);

    let quality = currentFormat === "png" ? undefined : currentQuality;
    const imageData = tempCanvas.toDataURL(`image/${currentFormat}`, quality);
    convertedImages.push(imageData);

    // Create preview image element
    const img = document.createElement("img");
    img.src = imageData;
    img.className = "preview-image";
    img.alt = `Page ${index + 1}`;
    previewImages.appendChild(img);
  });

  previewContainer.classList.add("active");
}

// Show loading indicator and hide other sections
function showLoading() {
  loading.classList.add("active");
  error.classList.remove("active");
  previewContainer.classList.remove("active");
}

// Hide loading indicator
function hideLoading() {
  loading.classList.remove("active");
}

// Show error message and hide other sections
function showError(message) {
  error.textContent = message;
  error.classList.add("active");
  loading.classList.remove("active");
  previewContainer.classList.remove("active");
}

// Prevent popup from closing unexpectedly
document.addEventListener("DOMContentLoaded", function () {
  initializeExtension();
});

// Global variables
let selectedFiles = [];
let uploadHistory = [];

function initializeExtension() {
  // Load upload history
  loadUploadHistory();

  // Initialize event listeners
  setupEventListeners();

  // Prevent form submission and page navigation
  preventDefaultBehaviors();
}

function setupEventListeners() {
  const fileInput = document.getElementById("fileInput");
  const uploadBtn = document.getElementById("uploadBtn");

  // File selection handler
  fileInput.addEventListener("change", handleFileSelection);

  // Upload button handler
  uploadBtn.addEventListener("click", handleFileUpload);

  // Prevent the popup from closing on file input click
  fileInput.addEventListener("click", function (e) {
    e.stopPropagation();
  });
}

function preventDefaultBehaviors() {
  // Prevent form submissions
  document.addEventListener("submit", function (e) {
    e.preventDefault();
    return false;
  });

  // Prevent page navigation
  document.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      e.preventDefault();
    }
  });

  // Prevent drag and drop default behavior
  document.addEventListener("dragover", function (e) {
    e.preventDefault();
  });

  document.addEventListener("drop", function (e) {
    e.preventDefault();
    handleFileDrop(e);
  });
}

function handleFileSelection(event) {
  event.preventDefault();
  event.stopPropagation();

  const files = Array.from(event.target.files);

  if (files.length === 0) {
    return;
  }

  // Add new files to selected files array
  files.forEach((file) => {
    // Check if file already exists
    if (
      !selectedFiles.find((f) => f.name === file.name && f.size === file.size)
    ) {
      selectedFiles.push(file);
    }
  });

  updateSelectedFilesDisplay();
  updateUploadButton();
}

function handleFileDrop(event) {
  event.preventDefault();
  event.stopPropagation();

  const files = Array.from(event.dataTransfer.files);

  files.forEach((file) => {
    if (
      !selectedFiles.find((f) => f.name === file.name && f.size === file.size)
    ) {
      selectedFiles.push(file);
    }
  });

  updateSelectedFilesDisplay();
  updateUploadButton();
}

function updateSelectedFilesDisplay() {
  const container = document.getElementById("selectedFiles");

  if (selectedFiles.length === 0) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = selectedFiles
    .map(
      (file, index) => `
        <div class="file-item">
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
            </div>
            <button class="remove-file" onclick="removeFile(${index})">×</button>
        </div>
    `
    )
    .join("");
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  updateSelectedFilesDisplay();
  updateUploadButton();
}

function updateUploadButton() {
  const uploadBtn = document.getElementById("uploadBtn");
  uploadBtn.disabled = selectedFiles.length === 0;
}

async function handleFileUpload() {
  if (selectedFiles.length === 0) {
    showStatus("Please select files to upload", "error");
    return;
  }

  const uploadBtn = document.getElementById("uploadBtn");
  const progressSection = document.getElementById("progressSection");
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");

  // Update UI
  uploadBtn.disabled = true;
  uploadBtn.classList.add("uploading");
  uploadBtn.textContent = "Uploading...";
  progressSection.style.display = "block";

  try {
    // Simulate file upload process
    await simulateFileUpload((progress) => {
      progressFill.style.width = `${progress}%`;
      progressText.textContent = `${progress}%`;
    });

    // Add to history
    selectedFiles.forEach((file) => {
      uploadHistory.unshift({
        name: file.name,
        size: file.size,
        timestamp: new Date().toISOString(),
      });
    });

    // Keep only last 10 uploads
    uploadHistory = uploadHistory.slice(0, 10);

    // Save to storage
    await saveUploadHistory();

    // Update UI
    showStatus(
      `Successfully uploaded ${selectedFiles.length} file(s)`,
      "success"
    );
    updateHistoryDisplay();

    // Reset
    selectedFiles = [];
    document.getElementById("fileInput").value = "";
    updateSelectedFilesDisplay();
  } catch (error) {
    showStatus("Upload failed: " + error.message, "error");
  } finally {
    // Reset upload button
    uploadBtn.disabled = false;
    uploadBtn.classList.remove("uploading");
    uploadBtn.textContent = "Upload Files";

    // Hide progress after delay
    setTimeout(() => {
      progressSection.style.display = "none";
      progressFill.style.width = "0%";
      progressText.textContent = "0%";
    }, 2000);

    updateUploadButton();
  }
}

function simulateFileUpload(onProgress) {
  return new Promise((resolve, reject) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        onProgress(progress);
        clearInterval(interval);
        resolve();
      } else {
        onProgress(Math.floor(progress));
      }
    }, 200);

    // Simulate potential failure
    if (Math.random() < 0.05) {
      // 5% chance of failure
      setTimeout(() => {
        clearInterval(interval);
        reject(new Error("Network error"));
      }, 1000);
    }
  });
}

function showStatus(message, type) {
  const statusMessage = document.getElementById("statusMessage");
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;

  // Clear status after 5 seconds
  setTimeout(() => {
    statusMessage.textContent = "";
    statusMessage.className = "status-message";
  }, 5000);
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

async function loadUploadHistory() {
  try {
    const result = await chrome.storage.local.get(["uploadHistory"]);
    uploadHistory = result.uploadHistory || [];
    updateHistoryDisplay();
  } catch (error) {
    console.error("Failed to load upload history:", error);
  }
}

async function saveUploadHistory() {
  try {
    await chrome.storage.local.set({ uploadHistory });
  } catch (error) {
    console.error("Failed to save upload history:", error);
  }
}

function updateHistoryDisplay() {
  const historyList = document.getElementById("historyList");

  if (uploadHistory.length === 0) {
    historyList.innerHTML = '<div class="no-history">No uploads yet</div>';
    return;
  }

  historyList.innerHTML = uploadHistory
    .map((item) => {
      const date = new Date(item.timestamp);
      const timeStr = date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      return `
            <div class="history-item">
                <span class="history-file">${item.name}</span>
                <span class="history-time">${timeStr}</span>
            </div>
        `;
    })
    .join("");
}

// Make removeFile function global
window.removeFile = removeFile;
