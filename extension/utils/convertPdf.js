export async function convertPdfToImages(file, format = "png") {
  // Check file size (5MB = 5 * 1024 * 1024 bytes)
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("PDF file size exceeds 5MB limit");
  }

  window.pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL(
    "lib/pdf.worker.min.js"
  );
  const typedArray = new Uint8Array(await file.arrayBuffer());

  const pdf = await window.pdfjsLib.getDocument({ data: typedArray }).promise;

  // Check if PDF has any pages
  if (pdf.numPages === 0) {
    throw new Error("PDF file is empty");
  }

  const images = [];
  let hasContent = false;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;

    // Check if the page has any content
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const hasNonTransparentPixels = imageData.data.some((pixel) => pixel !== 0);

    if (hasNonTransparentPixels) {
      hasContent = true;
      const dataUrl = canvas.toDataURL(`image/${format}`);
      images.push({ dataUrl, index: i });
    }
  }

  if (!hasContent) {
    throw new Error("Couldn't find any images or relevant content in the PDF");
  }

  return images;
}
