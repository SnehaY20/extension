// This is the service worker (background script) for the extension.

import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
  chrome.runtime.getURL("pdf.worker.min.js");

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.type === "CONVERT_PDF") {
    try {
      const { fileArrayBuffer, outputFormat, quality } = request.data;

      const pdf = await pdfjsLib.getDocument({ data: fileArrayBuffer }).promise;
      const images = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: quality });

        // Create an OffscreenCanvas to render in the worker
        const canvas = new OffscreenCanvas(viewport.width, viewport.height);
        const context = canvas.getContext(
          "2d"
        ) as OffscreenCanvasRenderingContext2D;

        if (!context) {
          throw new Error("Could not get 2D context for OffscreenCanvas");
        }

        await page.render({
          canvasContext: context as unknown as CanvasRenderingContext2D,
          viewport: viewport,
        }).promise;

        let imageDataUrl;
        // OffscreenCanvas does not support toDataURL directly in all environments,
        // but can be transferred. However, for simplicity here, we'll convert to Blob
        // and then to Data URL if necessary for sending back.
        // A more efficient approach for large data might be transferring ArrayBuffers.

        if (outputFormat === "png") {
          const blob = await canvas.convertToBlob({ type: "image/png" });
          imageDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } else if (outputFormat === "jpeg" || outputFormat === "jpg") {
          const blob = await canvas.convertToBlob({
            type: "image/jpeg",
            quality: 0.9,
          });
          imageDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } else if (outputFormat === "svg") {
          // SVG conversion is tricky in worker, simplified approach might not work
          // Revisit if SVG is a must-have for background conversion
          // For now, sending a placeholder or error
          throw new Error(
            "SVG conversion in background worker is not directly supported with this method."
          );
        }

        images.push({
          pageNumber: pageNum,
          dataUrl: imageDataUrl as string,
          filename: `page-${pageNum}.${outputFormat}`,
        });
      }

      // Send converted images back to the popup
      chrome.runtime.sendMessage({
        type: "PDF_CONVERSION_COMPLETE",
        data: images,
      });
    } catch (error: any) {
      console.error("Error during PDF conversion in background:", error);
      // Send error back to the popup
      chrome.runtime.sendMessage({
        type: "PDF_CONVERSION_ERROR",
        data: { message: error.message || "An unknown error occurred." },
      });
    }
  }
});

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
});
