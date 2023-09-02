const sandbox = document.getElementById("sandbox");

chrome.runtime.onMessage.addListener((count, sender, sendResponse) => {
  sandbox.contentWindow.postMessage(count, "*");

  window.addEventListener("message", (event) => {
    sendResponse(event.data);
  }, false);

  return true;
});