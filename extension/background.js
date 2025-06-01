const filter = {
  url: [{ urlMatches: "https://www.google.com/" }],
};

chrome.webNavigation.onCompleted.addListener(() => {
  console.log("Navigation completed - Google detected");
  
  // You can add more logic here for PDF handling
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "modifyHeadings",
        text: "Modified by extension!"
      });
    }
  });
}, filter);

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("PDF Converter Extension installed");
});