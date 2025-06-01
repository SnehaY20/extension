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

// Updated toast notification function
const showToast = (message: string, type: "success" | "error" = "success") => {
  // Ensure this runs in a browser/DOM environment
  if (typeof document === "undefined") {
    console.log(`Toast (${type}): ${message}`); // Fallback for non-DOM environments
    return;
  }

  const toastElement = document.createElement("div");
  toastElement.style.position = "fixed";
  toastElement.style.bottom = "20px";
  toastElement.style.left = "50%";
  toastElement.style.transform = "translateX(-50%)";
  toastElement.style.padding = "10px 20px";
  toastElement.style.borderRadius = "5px";
  toastElement.style.color = "white";
  toastElement.style.zIndex = "10000"; // Ensure it's on top
  toastElement.style.fontSize = "14px";
  toastElement.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
  toastElement.style.fontFamily =
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  toastElement.style.textAlign = "center";

  if (type === "success") {
    toastElement.style.backgroundColor = "#4CAF50"; // Green
  } else {
    toastElement.style.backgroundColor = "#f44336"; // Red
  }
  toastElement.textContent = message;

  document.body.appendChild(toastElement);

  // Remove the toast after a few seconds
  setTimeout(() => {
    if (toastElement.parentNode === document.body) {
      document.body.removeChild(toastElement);
    }
  }, 3000); // Display for 3 seconds
};

export function Popup() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [convertedImages, setConvertedImages] = useState<ConvertedImage[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [outputFormat, setOutputFormat] = useState("png");
  const [quality, setQuality] = useState(1.5);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add a direct event listener for debugging
  useEffect(() => {
    console.log("Popup: Setting up direct file input listener effect.");
    const currentInput = fileInputRef.current;
    if (currentInput) {
      console.log("Popup: File input ref is available.");
      const directChangeHandler = (event: Event) => {
        console.log("Direct file input change event fired.", event);
        // Try to access files here and log immediately
        try {
          const files = (event.target as HTMLInputElement).files;
          console.log("Direct handler: Accessing files.", files);
          if (files && files.length > 0) {
            console.log(
              "Direct handler: File selected via direct listener.",
              files[0].name
            );
          } else {
            console.log("Direct handler: No file selected or cancelled.");
          }
        } catch (error) {
          console.error(
            "Direct handler: Error accessing files from event.",
            error
          );
        }
      };

      currentInput.addEventListener("change", directChangeHandler);

      // Cleanup the direct listener
      return () => {
        console.log("Popup: Cleaning up direct file input listener.");
        currentInput.removeEventListener("change", directChangeHandler);
      };
    } else {
      console.log(
        "Popup: File input ref not available yet for direct listener."
      );
    }
  }, []); // Empty dependency array means this runs once on mount

  // Listen for messages from background script
  useEffect(() => {
    console.log("Popup: Setting up message listener effect.");
    const handleMessages = (
      request: MessagePayload,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      console.log("Popup received message:", request.type, request.data);
      if (request.type === "PDF_CONVERSION_COMPLETE") {
        console.log(
          "Popup: Conversion complete message received, updating state."
        );
        setConvertedImages(request.data);
        setIsConverting(false);
        console.log(
          "Popup: Converted images state updated.",
          request.data.length
        );
        showToast("Conversion successful!", "success");
      } else if (request.type === "PDF_CONVERSION_ERROR") {
        setIsConverting(false);
        console.error(
          "Popup: Conversion error message received:",
          request.data
        );
        showToast("Error converting PDF: " + request.data?.message, "error");
      }
    };

    // Ensure chrome.runtime is available before adding listener
    if (
      typeof chrome !== "undefined" &&
      chrome.runtime &&
      chrome.runtime.onMessage
    ) {
      console.log("Popup: Attaching chrome.runtime.onMessage listener.");
      chrome.runtime.onMessage.addListener(handleMessages);
    } else {
      console.warn("Popup: chrome.runtime.onMessage not available.");
    }

    // Cleanup listener on unmount
    return () => {
      console.log("Popup: Cleaning up message listener effect.");
      if (
        typeof chrome !== "undefined" &&
        chrome.runtime &&
        chrome.runtime.onMessage
      ) {
        console.log("Popup: Removing chrome.runtime.onMessage listener.");
        chrome.runtime.onMessage.removeListener(handleMessages);
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount/unmount

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleFileSelect: --- START ---");
    console.log("handleFileSelect: File input change detected.", event);
    event.preventDefault(); // Added to prevent any potential default behavior
    try {
      console.log("handleFileSelect: Accessing event.target.", event.target);
      console.log("handleFileSelect: Accessing event.target.files.");
      const files = event.target.files;
      if (!files || files.length === 0) {
        console.log(
          "handleFileSelect: No files selected or selection cancelled."
        );
        // User cancelled file selection, do nothing or reset if needed
        // We might want to reset state only if a file was previously selected.
        // For now, let's just log and return.
        console.log(
          "handleFileSelect: File selection cancelled, exiting function."
        );
        return; // Exit if no file selected
      }

      console.log("handleFileSelect: Files list obtained.", files);
      const file = files[0];
      console.log("handleFileSelect: First file object obtained.", file);

      if (file.type === "application/pdf") {
        console.log("handleFileSelect: Valid PDF file detected.", file.name);
        console.log("handleFileSelect: Setting selectedFile state.");
        setSelectedFile(file);
        console.log("handleFileSelect: Clearing convertedImages state.");
        setConvertedImages([]); // Clear previous results on new file select
        console.log("handleFileSelect: Setting isConverting state to false.");
        setIsConverting(false); // Reset converting state
        console.log(
          "handleFileSelect: State updates (setSelectedFile, setConvertedImages, setIsConverting) initiated. Expect re-render."
        );
      } else {
        console.warn(
          "handleFileSelect: Invalid file type selected.",
          file?.type
        );
        setSelectedFile(null); // Clear selected file if invalid
        setConvertedImages([]); // Clear previous results
        setIsConverting(false); // Reset converting state
        showToast("Please select a valid PDF file.", "error");
      }

      // Always reset file input value to allow selecting the same file again
      if (fileInputRef.current) {
        console.log("handleFileSelect: Resetting file input value.");
        fileInputRef.current.value = "";
      }
      console.log("handleFileSelect: Function finished successfully.");
    } catch (error: any) {
      console.error(
        "handleFileSelect: Error caught during file selection.",
        error
      );
      showToast(
        "An error occurred while selecting the file: " + error.message,
        "error"
      );
      // Attempt to reset state and input on error
      setSelectedFile(null);
      setConvertedImages([]);
      setIsConverting(false);
      if (fileInputRef.current) {
        console.log(
          "handleFileSelect: Attempting to reset file input value after error."
        );
        fileInputRef.current.value = "";
      }
      console.log("handleFileSelect: --- ERROR HANDLED ---");
    }
    console.log("handleFileSelect: --- END ---");
  };

  const convertPDFToImages = async () => {
    if (!selectedFile || isConverting) {
      console.log(
        "convertPDFToImages: Conversion cannot start (no file selected or already converting)."
      );
      return; // Prevent multiple conversions or conversion without file
    }

    setIsConverting(true);
    setConvertedImages([]); // Clear previous results when starting new conversion
    console.log(
      "convertPDFToImages: Starting conversion for",
      selectedFile.name,
      "with format:",
      outputFormat,
      "and quality:",
      quality
    );

    try {
      // Read the file as ArrayBuffer on the popup side
      console.log("convertPDFToImages: Reading file into ArrayBuffer.");
      const arrayBuffer = await selectedFile.arrayBuffer();
      console.log(
        "convertPDFToImages: File read into ArrayBuffer, size:",
        arrayBuffer.byteLength
      );

      // Convert ArrayBuffer to a standard Array for sending
      const fileDataArray = Array.from(new Uint8Array(arrayBuffer));
      console.log(
        "convertPDFToImages: Converted ArrayBuffer to Array, size:",
        fileDataArray.length
      );

      // Send file data and options to the background script
      if (
        typeof chrome !== "undefined" &&
        chrome.runtime &&
        chrome.runtime.sendMessage
      ) {
        console.log(
          "convertPDFToImages: Sending message to background script: CONVERT_PDF"
        );
        chrome.runtime.sendMessage(
          {
            type: "CONVERT_PDF",
            data: {
              fileArrayBuffer: fileDataArray,
              outputFormat,
              quality,
            },
          },
          (response) => {
            // This callback is for acknowledgement, not the final result
            console.log(
              "convertPDFToImages: chrome.runtime.sendMessage acknowledgement:",
              response
            );
            if (chrome.runtime.lastError) {
              console.error(
                "convertPDFToImages: Error sending message via chrome.runtime.sendMessage:",
                chrome.runtime.lastError
              );
              const errorMsg =
                "Error communicating with background script: " +
                (chrome.runtime.lastError.message ||
                  "Unknown error. Ensure the background script is active and correctly configured.");
              showToast(errorMsg, "error");
              setIsConverting(false);
              return; // Exit early
            }
            // Process successful acknowledgement if needed
            console.log(
              "convertPDFToImages: Message sending acknowledged.",
              response
            );
          }
        );
        // The actual conversion result comes via the onMessage listener
        console.log(
          "convertPDFToImages: Message sent, waiting for background script response via onMessage."
        );
      } else {
        console.error(
          "convertPDFToImages: Chrome runtime message sending not available."
        );
        showToast(
          "Extension context not found. Cannot start conversion.",
          "error"
        );
        setIsConverting(false);
      }
    } catch (error: any) {
      console.error(
        "convertPDFToImages: Error preparing or sending PDF for background conversion:",
        error
      );
      showToast("Error preparing PDF: " + error.message, "error");
      setIsConverting(false);
    }
  };

  const downloadImage = (image: ConvertedImage) => {
    try {
      console.log("downloadImage: Attempting to download", image.filename);
      const link = document.createElement("a");
      link.href = image.dataUrl;
      link.download = image.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log("downloadImage: Download initiated for", image.filename);
    } catch (error) {
      console.error(
        "downloadImage: Error downloading image:",
        image.filename,
        error
      );
      showToast(
        "An error occurred while trying to download " + image.filename,
        "error"
      );
    }
  };

  const downloadAllImages = () => {
    console.log(
      "downloadAllImages: Attempting to download all",
      convertedImages.length,
      "images."
    );
    // Basic staggering for multiple downloads to prevent browser blocking
    convertedImages.forEach((image, index) => {
      setTimeout(() => {
        downloadImage(image);
      }, index * 200); // Adjust delay as needed
    });
  };

  const resetConverter = () => {
    console.log("resetConverter: Resetting converter state and input.");
    setSelectedFile(null);
    setConvertedImages([]);
    setIsConverting(false);
    // Reset file input value to allow selecting the same file again
    if (fileInputRef.current) {
      console.log("resetConverter: Clearing file input value.");
      fileInputRef.current.value = "";
    }
  };

  // Debug useEffects to see state changes in console
  useEffect(() => {
    console.log("State updated: selectedFile", selectedFile?.name);
  }, [selectedFile]);
  useEffect(() => {
    console.log("State updated: isConverting", isConverting);
  }, [isConverting]);
  useEffect(() => {
    console.log("State updated: convertedImages count", convertedImages.length);
  }, [convertedImages]);
  useEffect(() => {
    console.log("State updated: outputFormat", outputFormat);
  }, [outputFormat]);
  useEffect(() => {
    console.log("State updated: quality", quality);
  }, [quality]);

  // Determine which section to show
  const showFileUpload =
    !selectedFile && !isConverting && convertedImages.length === 0;
  const showFileSelectedInfo =
    selectedFile && !isConverting && convertedImages.length === 0;
  const showConversionOptions =
    selectedFile && !isConverting && convertedImages.length === 0;
  const showLoadingState = isConverting;
  const showResults = convertedImages.length > 0;

  console.log(
    `Rendering check: FileUpload=${showFileUpload}, FileSelectedInfo=${showFileSelectedInfo}, Options=${showConversionOptions}, Loading=${showLoadingState}, Results=${showResults}`
  );

  return (
    <div style={{ padding: "16px" }}>
      <h1
        style={{
          fontSize: "20px",
          marginBottom: "16px",
          textAlign: "center",
        }}
      >
        PDF to Image Converter
      </h1>

      {/* File Upload Section: Shown initially */}
      {showFileUpload && (
        <div style={{ marginBottom: "16px" }}>
          <p
            style={{ marginBottom: "16px", textAlign: "center", color: "#555" }}
          >
            Upload a PDF to convert its pages to images.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            style={{ display: "none" }}
            id="pdf-upload"
          />
          <label
            htmlFor="pdf-upload"
            style={{
              display: "block",
              padding: "12px",
              backgroundColor: "#60A5FA",
              color: "white",
              textAlign: "center",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Choose PDF File
          </label>
        </div>
      )}

      {/* File Selected Info & Choose Another: Show after selecting file, before converting */}
      {showFileSelectedInfo && (
        <div style={{ marginBottom: "16px", textAlign: "center" }}>
          <p style={{ marginBottom: "12px", fontSize: "14px", color: "#333" }}>
            Selected: <strong>{selectedFile?.name}</strong>
          </p>
          {/* Re-using the hidden input and label to allow changing file */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            style={{ display: "none" }}
            id="pdf-upload-another"
          />
          <label
            htmlFor="pdf-upload-another"
            style={{
              display: "inline-block",
              padding: "8px 12px",
              backgroundColor: "#4F46E5",
              color: "white",
              textAlign: "center",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Choose Another File
          </label>
        </div>
      )}

      {/* Conversion Options and Convert Button: Show if file selected, not converting, and no results yet */}
      {showConversionOptions && (
        <div style={{ marginBottom: "16px" }}>
          <p
            style={{ marginBottom: "16px", textAlign: "center", color: "#555" }}
          >
            Select output format and quality, then convert.
          </p>
          <div style={{ marginBottom: "12px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
              }}
            >
              Output Format
            </label>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ddd",
              }}
            >
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
              <option value="jpg">JPG</option>
              {/* SVG removed as it's not implemented in background for simplicity */}
            </select>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
              }}
            >
              Quality: {quality}x
            </label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>

          <button
            onClick={convertPDFToImages}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#10B981",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Convert to Images
          </button>
        </div>
      )}

      {/* Loading State: Show only when converting */}
      {showLoadingState && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <p style={{ marginBottom: "16px", color: "#555" }}>
            Converting PDF...
          </p>
          {/* You could add a spinner here */}
          Converting...
        </div>
      )}

      {/* Results and Download Options: Show only when converted images are available */}
      {showResults && (
        <div>
          <p
            style={{ marginBottom: "16px", textAlign: "center", color: "#555" }}
          >
            Conversion complete! Download your images.
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h2 style={{ fontSize: "16px", margin: 0 }}>
              Converted Images ({convertedImages.length})
            </h2>
            <div>
              <button
                onClick={downloadAllImages}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#4F46E5",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  marginRight: "8px",
                  cursor: "pointer",
                }}
              >
                Download All
              </button>
              <button
                onClick={resetConverter}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#6B7280",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Reset
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            {convertedImages.map((image) => (
              <div
                key={image.pageNumber}
                style={{
                  padding: "12px",
                  backgroundColor: "#F9FAFB",
                  borderRadius: "8px",
                }}
              >
                <img
                  src={image.dataUrl}
                  alt={`Page ${image.pageNumber}`}
                  style={{
                    width: "100%",
                    height: "200px",
                    objectFit: "contain",
                    backgroundColor: "white",
                    marginBottom: "8px",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "14px" }}>
                    Page {image.pageNumber}
                  </span>
                  <button
                    onClick={() => downloadImage(image)}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#10B981",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
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
  );
}
