import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";

interface ConvertedImage {
  pageNumber: number;
  dataUrl: string;
  filename: string;
}

interface MessagePayload {
  type: string;
  data?: any;
}

export function PDFConverter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [convertedImages, setConvertedImages] = useState<ConvertedImage[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [outputFormat, setOutputFormat] = useState("png");
  const [quality, setQuality] = useState(1.5);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Listen for messages from the background script
  useEffect(() => {
    const handleMessages = (
      request: MessagePayload,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      console.log("Received message:", request.type, request.data);

      if (request.type === "PDF_CONVERSION_COMPLETE") {
        console.log("Conversion complete, received images:", request.data);
        setConvertedImages(request.data);
        setIsConverting(false);
        toast.success("PDF converted successfully!");
      } else if (request.type === "PDF_CONVERSION_ERROR") {
        console.error("Conversion error:", request.data);
        setIsConverting(false);
        toast.error("Error converting PDF. " + request.data?.message || "");
      }
    };

    chrome.runtime.onMessage.addListener(handleMessages);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessages);
    };
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setConvertedImages([]);
      console.log("File selected:", file.name);
    } else {
      toast.error("Please select a valid PDF file");
    }
  };

  const convertPDFToImages = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) return;

    setIsConverting(true);
    setConvertedImages([]);
    console.log(
      "Starting conversion with format:",
      outputFormat,
      "and quality:",
      quality
    );

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      console.log(
        "File converted to array buffer, size:",
        arrayBuffer.byteLength
      );

      // Send file data and options to the background script
      chrome.runtime.sendMessage(
        {
          type: "CONVERT_PDF",
          data: {
            fileArrayBuffer: arrayBuffer,
            outputFormat: outputFormat,
            quality: quality,
          },
        },
        (response) => {
          console.log("Received response from background:", response);
          if (chrome.runtime.lastError) {
            console.error("Error sending message:", chrome.runtime.lastError);
            toast.error("Error communicating with background script");
            setIsConverting(false);
          }
        }
      );
    } catch (error: any) {
      console.error("Error converting PDF:", error);
      toast.error("Error converting PDF. " + error.message || "");
      setIsConverting(false);
    }
  };

  const downloadImage = (image: ConvertedImage) => {
    const link = document.createElement("a");
    link.href = image.dataUrl;
    link.download = image.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllImages = () => {
    convertedImages.forEach((image, index) => {
      setTimeout(() => {
        downloadImage(image);
      }, index * 500); // Stagger downloads
    });
  };

  const resetConverter = () => {
    setSelectedFile(null);
    setConvertedImages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            PDF to Image Converter
          </h1>
          <p className="text-gray-600">
            Convert your PDF files to PNG, JPEG, or SVG images
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* File Upload Section */}
          <div className="mb-8">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
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
                className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
              >
                Choose PDF File
              </label>
              {selectedFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
          </div>

          {/* Conversion Options */}
          {selectedFile && !isConverting && (
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Output Format
                </label>
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="png">PNG</option>
                  <option value="jpeg">JPEG</option>
                  <option value="jpg">JPG</option>
                  <option value="svg">SVG</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality/Scale: {quality}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Convert Button */}
          {selectedFile && !isConverting && (
            <div className="mb-8 text-center">
              <button
                onClick={convertPDFToImages}
                className="px-8 py-3 rounded-lg text-white font-medium transition-colors bg-green-600 hover:bg-green-700"
              >
                Convert to Images
              </button>
            </div>
          )}

          {/* Loading State */}
          {isConverting && (
            <div className="mb-8 text-center">
              <div className="inline-flex items-center px-8 py-3 rounded-lg text-white font-medium bg-gray-400">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Converted Images ({convertedImages.length} pages)
                </h2>
                <div className="space-x-2">
                  <button
                    onClick={downloadAllImages}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Download All
                  </button>
                  <button
                    onClick={resetConverter}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {convertedImages.map((image) => (
                  <div
                    key={image.pageNumber}
                    className="bg-gray-50 rounded-xl p-4"
                  >
                    <div className="mb-3 relative w-full h-48">
                      <img
                        src={image.dataUrl}
                        alt={`Page ${image.pageNumber}`}
                        className="object-contain bg-white rounded-lg shadow-sm w-full h-48"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">
                        Page {image.pageNumber}
                      </span>
                      <button
                        onClick={() => downloadImage(image)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>
            Upload a PDF file and convert each page to your preferred image
            format
          </p>
        </div>
      </div>
    </div>
  );
}
