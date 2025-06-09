import { convertPdfToImages } from "./utils/convertPdf.js";

const fileInput = document.getElementById("fileInput");
const formatSelect = document.getElementById("formatSelect");
const convertBtn = document.getElementById("convertBtn");
const downloadBtn = document.getElementById("downloadBtn");
const previewContainer = document.getElementById("previewContainer");

let selectedFile = null;
let convertedImages = [];

fileInput.addEventListener("change", (event) => {
  selectedFile = event.target.files[0];
  downloadBtn.classList.add("hidden");
  downloadBtn.classList.remove("flex");
  previewContainer.innerHTML = "";
});

convertBtn.addEventListener("click", async () => {
  if (!selectedFile) {
    showError("Please select a PDF file to convert.");
    return;
  }

  // Check file type
  if (selectedFile.type !== "application/pdf") {
    showError(
      "Invalid file type. Please upload a PDF."
    );
    return;
  }

  const format = formatSelect.value;
  showLoading("Converting PDF...");
  downloadBtn.classList.add("hidden");
  downloadBtn.classList.remove("flex");

  try {
    convertedImages = await convertPdfToImages(selectedFile, format);
    previewContainer.innerHTML = "";

    convertedImages.forEach(({ dataUrl, index }) => {
      const img = document.createElement("img");
      img.src = dataUrl;
      img.alt = `Page ${index}`;
      img.className = "max-w-full h-auto mt-2.5 rounded-md shadow-sm";
      previewContainer.appendChild(img);
    });

    downloadBtn.classList.remove("hidden");
    downloadBtn.classList.add("flex");
  } catch (err) {
    let errorMessage = "Error converting PDF: ";

    if (err.message.includes("5MB limit")) {
      errorMessage =
        "The PDF file is too large. Please select a file smaller than 5MB.";
    } else if (err.message.includes("empty")) {
      errorMessage = "The PDF file is empty. Please select a valid PDF file.";
    } else if (err.message.includes("Couldn't find any images")) {
      errorMessage =
        "No visible content found in the PDF. Please ensure the PDF contains images or text.";
    } else if (err.message.includes("JSZip")) {
      errorMessage =
        "Error loading required libraries. Please try refreshing the extension.";
    } else {
      errorMessage += err.message;
    }

    showError(errorMessage);
    console.error("Conversion error:", err);
  }
});

downloadBtn.addEventListener("click", async () => {
  if (!convertedImages.length) {
    showError("No converted images to download.");
    return;
  }

  const format = formatSelect.value;

  if (convertedImages.length === 1) {
    // Direct image download
    const { dataUrl, index } = convertedImages[0];
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `page-${index}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    console.log(`Single image page-${index}.${format} downloaded.`);
    return;
  }

  // Multiple images: download as zip
  if (typeof JSZip === "undefined") {
    showError(
      "Error: Required library not loaded. Please try refreshing the extension."
    );
    return;
  }

  const zip = new JSZip();

  for (const { dataUrl, index } of convertedImages) {
    try {
      const response = await fetch(dataUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch page ${index}: ${response.statusText}`
        );
      }
      const blob = await response.blob();
      zip.file(`page-${index}.${format}`, blob);
    } catch (error) {
      console.error(`Error processing page ${index}:`, error);
      showError(`Error processing page ${index}. Please try again.`);
      return;
    }
  }

  try {
    const blob = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "converted_images.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    console.log("ZIP download initiated.");
  } catch (error) {
    console.error("ZIP generation failed:", error);
    showError("Error creating ZIP file. Please try again.");
  }
});

function showError(message) {
  previewContainer.innerHTML = `<div style="color: red;">${message}</div>`;
}

function showLoading(message) {
  previewContainer.innerHTML = `<div class="text-gray-600 p-4">${message}</div>`;
}
