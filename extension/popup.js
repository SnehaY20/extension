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
