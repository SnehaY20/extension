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

document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const uploadArea = document.getElementById("uploadArea");
  const uploadButton = document.getElementById("uploadButton");
  const fileInput = document.getElementById("fileInput");
  const fileList = document.getElementById("fileList");
  const uploadHistory = document.getElementById("uploadHistory");
  const status = document.getElementById("status");

  // State
  let currentFiles = [];
  let uploadHistoryData = [];

  // Load upload history
  loadUploadHistory();

  // Prevent extension from closing on errors
  window.addEventListener("error", function (e) {
    console.error("Extension error:", e);
    showStatus("Error: " + e.message, "error");
    return true; // Prevent default error handling
  });

  // Prevent unhandled promise rejections from closing extension
  window.addEventListener("unhandledrejection", function (e) {
    console.error("Unhandled promise rejection:", e);
    showStatus("Upload error: Please try again", "error");
    e.preventDefault();
  });

  // Prevent form submissions that might cause navigation
  document.addEventListener("submit", function (e) {
    e.preventDefault();
    return false;
  });

  // Upload button click handler
  uploadButton.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    try {
      fileInput.click();
    } catch (error) {
      console.error("Error opening file dialog:", error);
      showStatus("Error opening file dialog", "error");
    }
  });

  // Upload area click handler
  uploadArea.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.target !== uploadButton) {
      try {
        fileInput.click();
      } catch (error) {
        console.error("Error opening file dialog:", error);
        showStatus("Error opening file dialog", "error");
      }
    }
  });

  // File input change handler
  fileInput.addEventListener("change", function (e) {
    e.preventDefault();
    e.stopPropagation();

    try {
      const files = Array.from(e.target.files);
      if (files.length === 0) {
        showStatus("No files selected", "error");
        return;
      }

      handleFiles(files);
    } catch (error) {
      console.error("Error handling file selection:", error);
      showStatus("Error processing files", "error");
    }
  });

  // Drag and drop handlers
  uploadArea.addEventListener("dragover", function (e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.add("dragover");
  });

  uploadArea.addEventListener("dragleave", function (e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove("dragover");
  });

  uploadArea.addEventListener("drop", function (e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove("dragover");

    try {
      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) {
        showStatus("No files dropped", "error");
        return;
      }

      handleFiles(files);
    } catch (error) {
      console.error("Error handling dropped files:", error);
      showStatus("Error processing dropped files", "error");
    }
  });

  // Handle files
  async function handleFiles(files) {
    try {
      showStatus("Processing files...", "info");
      fileList.innerHTML = "";

      for (const file of files) {
        await processFile(file);
      }

      showStatus(`Successfully processed ${files.length} file(s)`, "success");
    } catch (error) {
      console.error("Error in handleFiles:", error);
      showStatus("Error processing files: " + error.message, "error");
    }
  }

  // Process individual file
  async function processFile(file) {
    return new Promise((resolve, reject) => {
      try {
        // Validate file
        if (!file || !file.name) {
          throw new Error("Invalid file");
        }

        // Create file item in UI
        const fileItem = createFileItem(file);
        fileList.appendChild(fileItem);

        // Read file content
        const reader = new FileReader();

        reader.onload = function (e) {
          try {
            console.log("File read successfully:", file.name);

            // Store file info
            const fileInfo = {
              name: file.name,
              size: file.size,
              type: file.type,
              lastModified: file.lastModified,
              content: e.target.result,
            };

            // Add to current files
            currentFiles.push(fileInfo);

            // Add to upload history
            addToUploadHistory(fileInfo);

            // Update progress
            updateFileProgress(fileItem, 100);

            resolve();
          } catch (error) {
            console.error("Error processing file content:", error);
            reject(error);
          }
        };

        reader.onerror = function (error) {
          console.error("FileReader error:", error);
          reject(new Error("Failed to read file"));
        };

        // Read as ArrayBuffer
        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error("Error in processFile:", error);
        reject(error);
      }
    });
  }

  // Create file item element
  function createFileItem(file) {
    const fileItem = document.createElement("div");
    fileItem.className = "file-item fade-in";

    fileItem.innerHTML = `
            <div class="file-info">
                <p class="file-name">${file.name}</p>
                <p class="file-size">${formatFileSize(file.size)}</p>
            </div>
            <div class="file-progress">
                <div class="progress-bar" style="width: 0%"></div>
            </div>
        `;

    return fileItem;
  }

  // Update file progress
  function updateFileProgress(fileItem, progress) {
    const progressBar = fileItem.querySelector(".progress-bar");
    progressBar.style.width = `${progress}%`;
  }

  // Add file to upload history
  function addToUploadHistory(fileInfo) {
    uploadHistoryData.unshift(fileInfo);
    if (uploadHistoryData.length > 10) {
      uploadHistoryData.pop();
    }
    saveUploadHistory();
    updateUploadHistoryUI();
  }

  // Save upload history to storage
  function saveUploadHistory() {
    chrome.storage.local.set({ uploadHistory: uploadHistoryData }, function () {
      if (chrome.runtime.lastError) {
        console.error("Storage error:", chrome.runtime.lastError);
      }
    });
  }

  // Load upload history from storage
  function loadUploadHistory() {
    chrome.storage.local.get(["uploadHistory"], function (result) {
      if (chrome.runtime.lastError) {
        console.error("Storage error:", chrome.runtime.lastError);
        return;
      }

      if (result.uploadHistory) {
        uploadHistoryData = result.uploadHistory;
        updateUploadHistoryUI();
      }
    });
  }

  // Update upload history UI
  function updateUploadHistoryUI() {
    uploadHistory.innerHTML = "";

    uploadHistoryData.forEach((file) => {
      const historyItem = document.createElement("div");
      historyItem.className = "history-item fade-in";

      historyItem.innerHTML = `
                <div class="file-info">
                    <p class="file-name">${file.name}</p>
                    <p class="file-size">${formatFileSize(file.size)}</p>
                </div>
            `;

      uploadHistory.appendChild(historyItem);
    });
  }

  // Show status message
  function showStatus(message, type = "info") {
    status.textContent = message;
    status.className = `status ${type}`;

    setTimeout(() => {
      status.className = "status";
    }, 3000);
  }

  // Format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Initialize
  console.log("Extension popup loaded successfully");
});
