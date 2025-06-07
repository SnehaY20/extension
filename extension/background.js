chrome.runtime.onInstalled.addListener(() => {
    chrome.sidePanel.setOptions({
      path: "sidepanel.html",
      enabled: true,
    });
  });
  
  chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.setOptions({
      tabId: tab.id, // 👈 important!
      path: "sidepanel.html",
      enabled: true,
    });
  
    // 👇 fix: provide tabId explicitly
    chrome.sidePanel.open({ tabId: tab.id });
  });
  