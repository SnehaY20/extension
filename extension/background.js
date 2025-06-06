// Background service worker for the extension
chrome.runtime.onInstalled.addListener(() => {
  console.log("File Upload Extension installed");

  // Initialize storage
  chrome.storage.local.set({
    uploadHistory: [],
  });
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // This is handled by the popup, but we can add additional logic here if needed
  console.log("Extension icon clicked");
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "uploadFile":
      handleFileUpload(request.data)
        .then((result) => sendResponse({ success: true, data: result }))
        .catch((error) =>
          sendResponse({ success: false, error: error.message })
        );
      return true; // Will respond asynchronously

    case "getUploadHistory":
      chrome.storage.local
        .get(["uploadHistory"])
        .then((result) =>
          sendResponse({ success: true, data: result.uploadHistory || [] })
        )
        .catch((error) =>
          sendResponse({ success: false, error: error.message })
        );
      return true;

    case "clearHistory":
      chrome.storage.local
        .set({ uploadHistory: [] })
        .then(() => sendResponse({ success: true }))
        .catch((error) =>
          sendResponse({ success: false, error: error.message })
        );
      return true;
  }
});

async function handleFileUpload(fileData) {
  try {
    // In a real implementation, you would handle the actual file upload here
    // This could involve sending the file to a server, cloud storage, etc.

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Store upload record
    const uploadRecord = {
      fileName: fileData.name,
      fileSize: fileData.size,
      uploadTime: new Date().toISOString(),
      status: "completed",
    };

    // Get current history
    const result = await chrome.storage.local.get(["uploadHistory"]);
    const history = result.uploadHistory || [];

    // Add new record
    history.unshift(uploadRecord);

    // Keep only last 50 records
    const trimmedHistory = history.slice(0, 50);

    // Save back to storage
    await chrome.storage.local.set({ uploadHistory: trimmedHistory });

    return uploadRecord;
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
}

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log("Extension started");
});

// Clean up old data periodically
setInterval(async () => {
  try {
    const result = await chrome.storage.local.get(["uploadHistory"]);
    const history = result.uploadHistory || [];

    // Remove entries older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const filteredHistory = history.filter((item) => {
      const itemDate = new Date(item.uploadTime || item.timestamp);
      return itemDate > thirtyDaysAgo;
    });

    if (filteredHistory.length !== history.length) {
      await chrome.storage.local.set({ uploadHistory: filteredHistory });
      console.log("Cleaned up old upload history");
    }
  } catch (error) {
    console.error("Failed to clean up history:", error);
  }
}, 24 * 60 * 60 * 1000); // Run once per day
