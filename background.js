// background.js

let detectedVideoUrls = {};

// webRequest APIを使用して、動画ストリームのネットワークリクエストを監視
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        // "videoplayback"を含むURLをフィルタリングして、YouTubeの動画ストリームを検出
        if (details.url.includes("videoplayback")) {
            const tabId = details.tabId;
            if (tabId === -1) return; // 無効なタブIDの場合はスキップ

            if (!detectedVideoUrls[tabId]) {
                detectedVideoUrls[tabId] = [];
            }

            // URLパラメータから動画のitagとファイル情報を抽出
            const url = new URL(details.url);
            const itag = url.searchParams.get("itag");
            const mimeType = url.searchParams.get("mime");

            let quality = "不明";
            let filename = "video.mp4";
            let format = "video";

            // itagとMIMEタイプに基づいて画質とフォーマットを判断
            if (mimeType.includes("video")) {
                switch (itag) {
                    case "18":
                    case "134":
                        quality = "360p";
                        filename = "video_360p.mp4";
                        break;
                    case "22":
                    case "135":
                        quality = "480p";
                        filename = "video_480p.mp4";
                        break;
                    case "136":
                        quality = "720p";
                        filename = "video_720p.mp4";
                        break;
                    case "37":
                    case "137":
                    case "248":
                        quality = "1080p";
                        filename = "video_1080p.mp4";
                        break;
                    case "38":
                    case "138":
                    case "313":
                        quality = "4K";
                        filename = "video_4K.mp4";
                        break;
                    case "271":
                        quality = "1440p";
                        filename = "video_1440p.mp4";
                        break;
                    default:
                        quality = `不明 (itag: ${itag})`;
                }
            } else if (mimeType.includes("audio")) {
                switch (itag) {
                    case "140":
                        quality = "AAC (audio only)";
                        filename = "audio.m4a";
                        format = "audio";
                        break;
                    case "251":
                        quality = "Opus (audio only)";
                        filename = "audio.webm";
                        format = "audio";
                        break;
                    default:
                        quality = `不明 (itag: ${itag})`;
                        format = "audio";
                }
            } else {
                return; // 動画でも音声でもない場合は無視
            }

            // URLがすでにリストに存在しない場合のみ追加
            const exists = detectedVideoUrls[tabId].some(item => item.url === details.url);
            if (!exists) {
                detectedVideoUrls[tabId].push({ url: details.url, quality: quality, filename: filename, format: format });
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
