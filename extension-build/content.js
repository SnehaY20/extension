(function () {
  "use strict";

  // Prevent any errors from bubbling up
  window.addEventListener("error", function (e) {
    console.log("Content script error caught:", e);
    return true;
  });

  // Listen for messages from the extension
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GET_PAGE_INFO") {
      sendResponse({
        url: window.location.href,
        title: document.title,
      });
    }
    return true;
  });

  console.log("Content script loaded");
})();
