import React, { useState, useRef, useEffect } from "react";

interface ConvertedImage {
  pageNumber: number;
  dataUrl: string;
  filename: string;
}

interface MessagePayload {
  type: string;
  data?: any;
}

// Simple toast notification function to replace react-toastify
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  console.log(`${type.toUpperCase()}: ${message}`);
  
  // Create a simple notification div
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 16px;
    border-radius: 4px;
    color: white;
    font-size: 14px;
    z-index: 10000;
    max-width: 300px;
    ${type === 'success' ? 'background-color: #10b981;' : 'background-color: #ef4444;'}
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast);
    }
  }, 3000);
};

export function PDFConverter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [convertedImages, setConvertedImages] = useState<ConvertedImage[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [outputFormat, setOutputFormat] = useState("png");
  const [quality, setQuality] = useState(1.5);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Check if Chrome APIs are available
  const isChromeExtension = typeof chrome !== 'undefined' && 
                           chrome.runtime && 
                           chrome.runtime.sendMessage;

  // Listen for messages from the background script
  useEffect(() => {
    if (!isChromeExtension) {
      console.log("Chrome extension APIs not available");
      return;
    }

    let isActive = true;

    const handleMessages = (
      request: MessagePayload,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      if (!isActive) return;

      console.log("Received message:", request.type, request.data);

      if (request.type === "PDF_CONVERSION_COMPLETE") {
        console.log("Conversion complete, received images:", request.data);
        setConvertedImages(request.data || []);
        setIsConverting(false);
        setError("");
        showToast("PDF converted successfully!", 'success');
      } else if (request.type === "PDF_CONVERSION_ERROR") {
        console.error("Conversion error:", request.data);
        setIsConverting(false);
        const errorMessage = request.data?.message || "Unknown error occurred";
        setError(errorMessage);
        showToast("Error converting PDF: " + errorMessage, 'error');
      }
    };

    try {
      chrome.runtime.onMessage.addListener(handleMessages);
      console.log("Message listener added successfully");
    } catch (err) {
      console.error("Error setting up message listener:", err);
    }

    return () => {
      isActive = false;
      if (chrome?.runtime?.onMessage) {
        chrome.runtime.onMessage.removeListener(handleMessages);
        console.log("Message listener removed");
      }
    };
  }, [isChromeExtension]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      event.preventDefault();
      const file = event.target.files?.[0];
      
      console.log("File selection triggered:", file?.name);
      
      if (file && file.type === "application/pdf") {
        setSelectedFile(file);
        setConvertedImages([]);
        setError("");
        console.log("Valid PDF file selected:", file.name, "Size:", file.size);
      } else {
        const errorMsg = "Please select a valid PDF file";
        setError(errorMsg);
        showToast(errorMsg, 'error');
        console.log("Invalid file selected");
      }
    } catch (err) {
      console.error("Error in file selection:", err);
      setError("Error selecting file");
    }
  };

  const convertPDFToImages = async (event: React.FormEvent) => {
    try {
      event.preventDefault();
      if (!selectedFile) {
        console.log("No file selected for conversion");
        return;
      }

      console.log("Starting conversion with format:", outputFormat, "and quality:", quality);
      setIsConverting(true);
      setConvertedImages([]);
      setError("");

      const arrayBuffer = await selectedFile.arrayBuffer();
      console.log("File converted to array buffer, size:", arrayBuffer.byteLength);

      if (isChromeExtension) {
        // Send file data and options to the background script
        chrome.runtime.sendMessage(
          {
            type: "CONVERT_PDF",
            data: {
              fileArrayBuffer: Array.from(new Uint8Array(arrayBuffer)),
              outputFormat: outputFormat,
              quality: quality,
            },
          },
          (response) => {
            console.log("Received response from background:", response);
            if (chrome.runtime.lastError) {
              console.error("Error sending message:", chrome.runtime.lastError);
              const errorMsg = "Error communicating with background script: " + 
                              chrome.runtime.lastError.message;
              setError(errorMsg);
              showToast(errorMsg, 'error');
              setIsConverting(false);
            }
          }
        );
      } else {
        // Fallback for testing without Chrome APIs
        setTimeout(() => {
          const mockImages: ConvertedImage[] = [
            {
              pageNumber: 1,
              dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
              filename: `page-1.${outputFormat}`
            }
          ];
          setConvertedImages(mockImages);
          setIsConverting(false);
          showToast("Mock conversion completed!", 'success');
        }, 2000);
      }
    } catch (error: any) {
      console.error("Error converting PDF:", error);
      const errorMsg = "Error converting PDF: " + (error.message || "Unknown error");
      setError(errorMsg);
      showToast(errorMsg, 'error');
      setIsConverting(false);
    }
  };

  const downloadImage = (image: ConvertedImage) => {
    try {
      const link = document.createElement("a");
      link.href = image.dataUrl;
      link.download = image.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log("Downloaded:", image.filename);
    } catch (err) {
      console.error("Error downloading image:", err);
      showToast("Error downloading image", 'error');
    }
  };

  const downloadAllImages = () => {
    try {
      convertedImages.forEach((image, index) => {
        setTimeout(() => {
          downloadImage(image);
        }, index * 300); // Reduced delay for faster downloads
      });
      showToast(`Downloading ${convertedImages.length} images`, 'success');
    } catch (err) {
      console.error("Error downloading all images:", err);
      showToast("Error downloading images", 'error');
    }
  };

  const resetConverter = () => {
    try {
      setSelectedFile(null);
      setConvertedImages([]);
      setError("");
      setIsConverting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      console.log("Converter reset");
    } catch (err) {
      console.error("Error resetting converter:", err);
    }
  };

  return (
    <div className="w-full min-h-[600px] bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            PDF to Image Converter
          </h1>
          <p className="text-sm text-gray-600">
            Convert PDF files to PNG, JPEG, or SVG images
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
            <button 
              onClick={() => setError("")}
              className="float-right text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* File Upload Section */}
          <div className="mb-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <div className="mb-3">
                <svg
                  className="mx-auto h-8 w-8 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block text-sm"
              >
                Choose PDF File
              </label>
              {selectedFile && (
                <p className="mt-2 text-xs text-gray-600">
                  Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                </p>
              )}
            </div>
          </div>

          {/* Conversion Options - Always show when file is selected */}
          {selectedFile && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Output Format
                </label>
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  disabled={isConverting}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="png">PNG</option>
                  <option value="jpeg">JPEG</option>
                  <option value="jpg">JPG</option>
                  <option value="svg">SVG</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quality/Scale: {quality}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  disabled={isConverting}
                  className="w-full disabled:opacity-50"
                />
              </div>
            </div>
          )}

          {/* Convert Button */}
          {selectedFile && !isConverting && convertedImages.length === 0 && (
            <div className="mb-6 text-center">
              <button
                onClick={convertPDFToImages}
                className="px-6 py-2 rounded-lg text-white font-medium transition-colors bg-green-600 hover:bg-green-700 text-sm"
              >
                Convert to Images
              </button>
            </div>
          )}

          {/* Loading State */}
          {isConverting && (
            <div className="mb-6 text-center">
              <div className="inline-flex items-center px-6 py-2 rounded-lg text-white font-medium bg-gray-400 text-sm">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Converting...
              </div>
            </div>
          )}

          {/* Results Section */}
          {convertedImages.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Converted Images ({convertedImages.length})
                </h2>
                <div className="space-x-2">
                  <button
                    onClick={downloadAllImages}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Download All
                  </button>
                  <button
                    onClick={resetConverter}
                    className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-60 overflow-y-auto">
                {convertedImages.map((image) => (
                  <div
                    key={image.pageNumber}
                    className="bg-gray-50 rounded-lg p-3"
                  >
                    <div className="mb-2 relative w-full h-24">
                      <img
                        src={image.dataUrl}
                        alt={`Page ${image.pageNumber}`}
                        className="object-contain bg-white rounded shadow-sm w-full h-24"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-700">
                        Page {image.pageNumber}
                      </span>
                      <button
                        onClick={() => downloadImage(image)}
                        className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Debug Info - Remove in production */}
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
            <strong>Debug:</strong> File: {selectedFile?.name || 'None'} | 
            Converting: {isConverting ? 'Yes' : 'No'} | 
            Images: {convertedImages.length} | 
            Chrome APIs: {isChromeExtension ? 'Available' : 'Not Available'}
          </div>
        </div>
      </div>
    </div>
  );
}