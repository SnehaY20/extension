// Content script for the file upload extension
// This script runs on web pages and can interact with the page content

(function () {
  "use strict";

  // Prevent multiple injections
  if (window.fileUploadExtensionInjected) {
    return;
  }
  window.fileUploadExtensionInjected = true;

  // Listen for messages from the extension
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
      case "injectFileUploader":
        injectFileUploader();
        sendResponse({ success: true });
        break;

      case "getPageInfo":
        sendResponse({
          success: true,
          data: {
            url: window.location.href,
            title: document.title,
            hasFileInputs:
              document.querySelectorAll('input[type="file"]').length > 0,
          },
        });
        break;
    }
  });

  // Function to inject a file uploader into the current page
  function injectFileUploader() {
    // Check if already injected
    if (document.getElementById("extension-file-uploader")) {
      return;
    }

    // Create floating file uploader
    const uploader = document.createElement("div");
    uploader.id = "extension-file-uploader";
    uploader.innerHTML = `
            <div id="extension-uploader-container">
                <div id="extension-uploader-header">
                    <span>Quick File Upload</span>
                    <button id="extension-uploader-close">×</button>
                </div>
                <div id="extension-uploader-body">
                    <input type="file" id="extension-file-input" multiple>
                    <button id="extension-upload-btn">Upload</button>
                </div>
            </div>
        `;

    // Add styles
    const styles = `
            #extension-file-uploader {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                background: white;
                border: 2px solid #667eea;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                font-family: Arial, sans-serif;
                width: 300px;
            }
            
            #extension-uploader-header {
                background: #667eea;
                color: white;
                padding: 10px 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-radius: 8px 8px 0 0;
            }
            
            #extension-uploader-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
            }
            
            #extension-uploader-body {
                padding: 15px;
            }
            
            #extension-file-input {
                width: 100%;
                margin-bottom: 10px;
            }
            
            #extension-upload-btn {
                width: 100%;
                padding: 8px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            }
            
            #extension-upload-btn:hover {
                background: #5a67d8;
            }
        `;

    // Add style element
    const styleElement = document.createElement("style");
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);

    // Add uploader to page
    document.body.appendChild(uploader);

    // Add event listeners
    const closeBtn = document.getElementById("extension-uploader-close");
    const fileInput = document.getElementById("extension-file-input");
    const uploadBtn = document.getElementById("extension-upload-btn");

    closeBtn.addEventListener("click", () => {
      uploader.remove();
    });

    fileInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        uploadBtn.disabled = false;
      }
    });

    uploadBtn.addEventListener("click", () => {
      const files = Array.from(fileInput.files);
      if (files.length > 0) {
        // Send files to background script
        chrome.runtime.sendMessage(
          {
            action: "uploadFile",
            data: files.map((file) => ({
              name: file.name,
              size: file.size,
              type: file.type,
            })),
          },
          (response) => {
            if (response.success) {
              // Show success message
              const successMsg = document.createElement("div");
              successMsg.textContent = "Files uploaded successfully!";
              successMsg.style.cssText = `
                            position: fixed;
                            top: 10px;
                            right: 10px;
                            background: #48bb78;
                            color: white;
                            padding: 10px 20px;
                            border-radius: 5px;
                            z-index: 10001;
                        `;
              document.body.appendChild(successMsg);
              setTimeout(() => successMsg.remove(), 3000);

              // Close uploader
              uploader.remove();
            }
          }
        );
      }
    });
  }

  // Log that content script has been loaded
  console.log("File Upload Extension content script loaded");
})();
