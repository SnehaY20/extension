chrome.runtime.onInstalled.addListener(() => {
    chrome.sidePanel.setOptions({
      path: "sidepanel.html",
      enabled: true,
    });
  });
  
  chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.setOptions({
      tabId: tab.id, 
      path: "sidepanel.html",
      enabled: true,
    });
  
    chrome.sidePanel.open({ tabId: tab.id });
  });
  