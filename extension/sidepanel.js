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
    alert("Please upload a PDF file.");
    return;
  }

  const format = formatSelect.value;
  previewContainer.innerHTML = "Converting...";
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
    previewContainer.innerHTML = "Error converting PDF.";
    console.error(err);
    downloadBtn.classList.add("hidden");
    downloadBtn.classList.remove("flex");
  }
});

downloadBtn.addEventListener("click", async () => {
  if (!convertedImages.length) {
    console.log("No converted images to download.");
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
    alert("JSZip failed to load. Cannot generate ZIP file.");
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
  }
});
