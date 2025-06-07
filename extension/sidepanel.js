import { convertPdfToImage } from "./utils/convertPdf.js";

const fileInput = document.getElementById("fileInput");
const formatSelect = document.getElementById("formatSelect");
const convertBtn = document.getElementById("convertBtn");
const previewContainer = document.getElementById("previewContainer");

let selectedFile = null;

fileInput.addEventListener("change", (event) => {
  selectedFile = event.target.files[0];
});

convertBtn.addEventListener("click", async () => {
  if (!selectedFile) {
    alert("Please upload a PDF file.");
    return;
  }

  const format = formatSelect.value;
  previewContainer.innerHTML = "Converting...";

  try {
    const imageDataUrl = await convertPdfToImage(selectedFile, format);

    const img = document.createElement("img");
    img.src = imageDataUrl;

    const downloadBtn = document.createElement("a");
    downloadBtn.href = imageDataUrl;
    downloadBtn.download = `converted.${format}`;
    downloadBtn.textContent = "Download Image";
    downloadBtn.className = "downloadBtn";

    previewContainer.innerHTML = "";
    previewContainer.appendChild(img);
    previewContainer.appendChild(downloadBtn);
  } catch (err) {
    previewContainer.innerHTML = "Error converting PDF.";
    console.error(err);
  }
});
