// background.js

let detectedVideoUrls = {};

// YouTube動画のストリームURLを検出するためのリスナー
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        // googlevideo.com からの動画リクエストを監視
        // 720p（高画質）のストリームを優先して検出します
        if (details.url.includes("googlevideo.com") && details.url.includes("quality=hd720")) {
            const tabId = details.tabId;
            if (tabId !== -1) {
                if (!detectedVideoUrls[tabId]) {
                    detectedVideoUrls[tabId] = [];
                }
                // 重複を避ける
                if (!detectedVideoUrls[tabId].includes(details.url)) {
                    detectedVideoUrls[tabId].push(details.url);
                    console.log(`[YouTube Downloader] Detected 720p stream URL for tab ${tabId}: ${details.url}`);
                    // ポップアップに更新を通知
                    chrome.runtime.sendMessage({ type: "urlUpdate", tabId: tabId, urls: detectedVideoUrls[tabId] });
                }
            }
        }
    },
    { urls: ["*://*.googlevideo.com/*"] }
);

// タブが更新されたり閉じられたりしたら、該当するURL情報をクリア
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.url && !changeInfo.url.includes("youtube.com")) {
        delete detectedVideoUrls[tabId];
    }
});

chrome.tabs.onRemoved.addListener(function(tabId) {
    delete detectedVideoUrls[tabId];
});

// ポップアップからのリクエストを処理
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === "getUrlsForTab") {
        sendResponse({ urls: detectedVideoUrls[request.tabId] || [] });
    } else if (request.type === "downloadVideo") {
        // ダウンロード要求があればchrome.downloads APIを使用
        chrome.downloads.download({
            url: request.url,
            filename: request.filename
        }, function(downloadId) {
            if (chrome.runtime.lastError) {
                console.error("Download failed:", chrome.runtime.lastError.message);
                chrome.runtime.sendMessage({ type: "downloadFailed", message: chrome.runtime.lastError.message });
            } else {
                console.log("Download started:", downloadId);
                chrome.runtime.sendMessage({ type: "downloadStarted", downloadId: downloadId });
            }
        });
    }
});

console.log("Background script loaded.");
