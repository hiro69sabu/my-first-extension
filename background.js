// background.js

let detectedVideoUrls = {};

// タブが更新されたときに実行されるリスナー
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url.includes("youtube.com/watch")) {
        // コンテンツスクリプトを注入して、動画情報を取得
        chrome.tabs.executeScript(tabId, {file: 'content.js'}, function() {
            if (chrome.runtime.lastError) {
                console.error('Failed to inject content script:', chrome.runtime.lastError.message);
            }
        });
    }
});

// ポップアップからのリクエストを処理
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === "videoInfo") {
        const tabId = sender.tab.id;
        detectedVideoUrls[tabId] = request.urls;
        console.log(`[YouTube Downloader] Received video info for tab ${tabId}:`, request.urls);
        // ポップアップに更新を通知
        chrome.runtime.sendMessage({ type: "urlUpdate", tabId: tabId, urls: detectedVideoUrls[tabId] });
    } else if (request.type === "getUrlsForTab") {
        sendResponse({ urls: detectedVideoUrls[request.tabId] || [] });
    } else if (request.type === "downloadVideo") {
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

// タブが閉じられたらURL情報をクリア
chrome.tabs.onRemoved.addListener(function(tabId) {
    delete detectedVideoUrls[tabId];
});

console.log("Background script loaded.");
