// background.js

let detectedVideoUrls = {}; // 検出された動画URLを格納するオブジェクト

// YouTube動画のストリームURLを検出するためのリスナー
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        // YouTubeの動画ストリーム (.mp4, .m3u8, .webm など) を検出
        // googlevideo.com はYouTubeの動画配信ドメイン
        if (details.url.includes("googlevideo.com") &&
            (details.url.includes(".mp4") || details.url.includes(".m3u8") || details.url.includes(".webm"))) {
            
            const tabId = details.tabId;
            if (tabId !== -1) { // -1はブラウザ自身のリクエストなど
                if (!detectedVideoUrls[tabId]) {
                    detectedVideoUrls[tabId] = [];
                }
                // 重複を避ける
                if (!detectedVideoUrls[tabId].includes(details.url)) {
                    detectedVideoUrls[tabId].push(details.url);
                    console.log(`[YouTube Downloader] Detected stream URL for tab ${tabId}: ${details.url}`);
                    // ポップアップに更新を通知
                    chrome.runtime.sendMessage({ type: "urlUpdate", tabId: tabId, urls: detectedVideoUrls[tabId] });
                }
            }
        }
    },
    { urls: ["*://*.googlevideo.com/*"] } // googlevideo.comからのリクエストを監視
);

// タブが更新されたり閉じられたりしたら、該当するURL情報をクリア
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.url && !changeInfo.url.includes("youtube.com")) { // YouTube以外のページに移動したらクリア
        delete detectedVideoUrls[tabId];
    }
});

chrome.tabs.onRemoved.addListener(function(tabId) {
    delete detectedVideoUrls[tabId];
});


// ポップアップからのリクエストを処理
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // リクエストのタイプに応じて処理を分岐
    if (request.type === "getUrlsForTab") {
        sendResponse({ urls: detectedVideoUrls[request.tabId] || [] });
    } else if (request.type === "downloadVideo") {
        // ダウンロード要求があればchrome.downloads APIを使用
        chrome.downloads.download({
            url: request.url,
            filename: request.filename // ファイル名を指定
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

console.log("Background script for YouTube Downloader loaded.");
