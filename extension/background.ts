// This is the service worker (background script) for the extension.

import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
  chrome.runtime.getURL("pdf.worker.min.js");

// Keep service worker alive (optional, but can help with long conversions)
let keepAliveTimer: number | undefined;

function resetKeepAliveTimer() {
  if (keepAliveTimer) {
    clearTimeout(keepAliveTimer);
  }
  // Set a timer to log something periodically to keep the worker alive during long operations
  // The actual duration might need tuning based on Chrome's service worker idle timeout
  keepAliveTimer = setTimeout(() => {
    console.log("Service worker keep-alive heartbeat");
    // You might send a message to the popup here to show progress if needed
    resetKeepAliveTimer(); // Reset timer to continue keeping it alive
  }, 25000) as unknown as number; // Assert return type to number for browser env
}

function stopKeepAliveTimer() {
  if (keepAliveTimer) {
    clearTimeout(keepAliveTimer);
    keepAliveTimer = undefined;
    console.log("Service worker keep-alive timer stopped.");
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background received message:", request.type, sender);

  // Use async directly in listener for async responses in Manifest V3 service workers
  (async () => {
    if (request.type === "CONVERT_PDF") {
      resetKeepAliveTimer(); // Keep alive during conversion
      try {
        const { fileArrayBuffer, outputFormat, quality } = request.data;

        const pdf = await pdfjsLib.getDocument({ data: fileArrayBuffer })
          .promise;
        const images = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: quality });

          // Create an OffscreenCanvas to render in the worker
          // OffscreenCanvas is suitable for workers
          const canvas = new OffscreenCanvas(viewport.width, viewport.height);
          const context = canvas.getContext("2d");

          if (!context) {
            throw new Error("Could not get 2D context for OffscreenCanvas");
          }

          // Render PDF page to the canvas
          const renderContext = {
            canvasContext: context as unknown as CanvasRenderingContext2D, // Type assertion needed for OffscreenCanvas context
            viewport: viewport,
          };
          await page.render(renderContext).promise;

          let imageDataUrl;
          // Convert canvas content to Blob, then to Data URL
          // SVG conversion is complex in this context, only support PNG/JPEG
          if (outputFormat === "png") {
            const blob = await canvas.convertToBlob({ type: "image/png" });
            imageDataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } else if (outputFormat === "jpeg" || outputFormat === "jpg") {
            const blob = await canvas.convertToBlob({
              type: "image/jpeg",
              quality: 0.9,
            });
            imageDataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } else {
            throw new Error(`Unsupported output format: ${outputFormat}`);
          }

          images.push({
            pageNumber: pageNum,
            dataUrl: imageDataUrl,
            filename: `page-${pageNum}.${outputFormat}`,
          });
          console.log(`Converted page ${pageNum}`);
        }
        console.log(`Conversion complete for ${pdf.numPages} pages.`);

        // Send converted images back to the popup
        // Use chrome.runtime.sendMessage for communication between service worker and popup
        console.log("Sending PDF_CONVERSION_COMPLETE message to popup.");
        chrome.runtime.sendMessage({
          type: "PDF_CONVERSION_COMPLETE",
          data: images,
        });
      } catch (error: any) {
        console.error("Error during PDF conversion in background:", error);
        // Send error back to the popup
        console.log("Sending PDF_CONVERSION_ERROR message to popup.");
        chrome.runtime.sendMessage({
          type: "PDF_CONVERSION_ERROR",
          data: {
            message:
              error.message || "An unknown error occurred during conversion.",
          },
        });
      } finally {
        stopKeepAliveTimer(); // Stop timer after conversion finishes or fails
      }
      return true; // Required to use sendResponse asynchronously
    }
    // Keep-alive message handling (optional, but good practice)
    if (request.type === "KEEP_ALIVE") {
      console.log("Received keep-alive message.");
      sendResponse({ status: "alive" });
      return true; // Indicates that response will be sent
    }

    // If the message type is not handled, you might still need to respond
    // or return false to indicate no async response will be sent.
    // Returning false can sometimes allow the port to close.
    // In Manifest V3, returning true is common for async responses.
    console.log("Background received unhandled message type:", request.type);
    // sendResponse({error: 'Unhandled message type'}); // Optional: send an explicit error
    return false; // Indicate that no response will be sent.
  })(); // Execute the async IIFE

  // Note: In Manifest V3 Service Workers, returning true from the listener
  // indicates you will send a response asynchronously. Not returning anything,
  // returning false, or letting the async function complete without calling
  // sendResponse will eventually close the messaging channel.
  // By wrapping in an async IIFE and returning true *from the IIFE's context*
  // for handled async types, we correctly manage the channel.
  // The outer listener must also return true if the IIFE uses sendResponse.
  return true; // Return true from the outer listener for async handling
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log("PDF Converter extension started");
  // No need for initial timer here, it starts with message handling.
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("PDF Converter extension installed");
  // No need for initial timer here, it starts with message handling.
});

// Initial timer setup is now tied to message receipt
// If you need the worker to stay alive indefinitely, consider other strategies
// like periodic alarms or websockets if applicable (usually not needed for simple popups).
