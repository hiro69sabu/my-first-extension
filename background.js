// background.js

let detectedVideoUrls = {};

// webRequest APIを使ってYouTube動画のストリームURLを監視
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        // "videoplayback"を含むURLをフィルタリングして、動画ストリームを検出
        if (details.url.includes("videoplayback")) {
            const tabId = details.tabId;
            if (!detectedVideoUrls[tabId]) {
                detectedVideoUrls[tabId] = [];
            }
            
            // URLパラメータから画質情報を抽出する
            const url = new URL(details.url);
            const itag = url.searchParams.get("itag");
            let quality = "不明";

            // itagに基づいて画質を判断（簡略化された例）
            switch (itag) {
                case "18":
                    quality = "360p (MP4)";
                    break;
                case "22":
                    quality = "720p (MP4)";
                    break;
                case "37":
                    quality = "1080p (MP4)";
                    break;
                case "38":
                    quality = "4K (MP4)";
                    break;
                default:
                    quality = `不明 (itag: ${itag})`;
            }

            // URLがすでにリストに存在しない場合のみ追加
            if (!detectedVideoUrls[tabId].some(item => item.url === details.url)) {
                detectedVideoUrls[tabId].push({ url: details.url, quality: quality });
                // ポップアップにURLが更新されたことを通知
                chrome.runtime.sendMessage({ type: "urlUpdate", tabId: tabId, urls: detectedVideoUrls[tabId] });
            }
        }
    },
    { urls: ["*://*.googlevideo.com/*"] }
);

// ポップアップからのリクエストを処理
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === "getUrlsForTab") {
        sendResponse({ urls: detectedVideoUrls[request.tabId] || [] });
    } else if (request.type === "downloadVideo") {
        chrome.downloads.download({
            url: request.url,
            filename: request.filename
        }, function(downloadId) {
            if (chrome.runtime.lastError) {
                chrome.runtime.sendMessage({ type: "downloadFailed", message: chrome.runtime.lastError.message });
            } else {
                chrome.runtime.sendMessage({ type: "downloadStarted", downloadId: downloadId });
            }
        });
    }
});

// タブが閉じられたらURL情報をクリア
chrome.tabs.onRemoved.addListener(function(tabId) {
    delete detectedVideoUrls[tabId];
});

console.log("Background script loaded with new webRequest listener.");
