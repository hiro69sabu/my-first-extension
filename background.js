// background.js

let detectedVideoUrls = {};

// webRequest APIを使用して、動画ストリームのネットワークリクエストを監視
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        // ★デバッグ用ログ: 全てのリクエストURLをログに出力
        console.log("onBeforeRequest fired for URL:", details.url);
        // ★デバッグ用ログ: detailsオブジェクト全体を確認（デバッグ時に非常に役立ちます）
        console.log("Details:", details);

        // "videoplayback"を含むURLをフィルタリングして、YouTubeの動画ストリームを検出
        if (details.url.includes("videoplayback")) {
            // ★デバッグ用ログ: videoplaybackを含むURLが検出されたことをログ
            console.log("videoplayback URL detected:", details.url);

            const tabId = details.tabId;
            // ★デバッグ用ログ: 検出されたタブIDをログ
            console.log("Detected tabId:", tabId);

            if (tabId === -1) {
                // ★デバッグ用ログ: tabIdが-1でスキップされたことをログ
                console.log("Skipping request due to tabId -1:", details.url);
                return; // 無効なタブIDの場合はスキップ
            }

            if (!detectedVideoUrls[tabId]) {
                detectedVideoUrls[tabId] = [];
                // ★デバッグ用ログ: 新しいタブIDのURLリストが初期化されたことをログ
                console.log(`Initialized detectedVideoUrls for tabId: ${tabId}`);
            }

            // URLパラメータから動画のitagとファイル情報を抽出
            const url = new URL(details.url);
            const itag = url.searchParams.get("itag");
            const mimeType = url.searchParams.get("mime");

            // ★デバッグ用ログ: itagとmimeTypeの値をログ
            console.log(`itag: ${itag}, mimeType: ${mimeType} for URL: ${details.url}`);

            let quality = "不明";
            let filename = "video.mp4";
            let format = "video";

            // itagとMIMEタイプに基づいて画質とフォーマットを判断
            if (mimeType && mimeType.includes("video")) { // mimeTypeがnullでないかチェックを追加
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
                console.log(`Determined video quality: ${quality}, filename: ${filename}`); // ★デバッグ用ログ
            } else if (mimeType && mimeType.includes("audio")) { // mimeTypeがnullでないかチェックを追加
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
                console.log(`Determined audio quality: ${quality}, filename: ${filename}`); // ★デバッグ用ログ
            } else {
                // ★デバッグ用ログ: 動画でも音声でもない場合にスキップされたことをログ
                console.log("Neither video nor audio mimeType, skipping:", mimeType, details.url);
                return; // 動画でも音声でもない場合は無視
            }

            // URLがすでにリストに存在しない場合のみ追加
            const exists = detectedVideoUrls[tabId].some(item => item.url === details.url);
            if (!exists) {
                detectedVideoUrls[tabId].push({ url: details.url, quality: quality, filename: filename, format: format });
                // ★デバッグ用ログ: URLがリストに追加されたことをログ
                console.log(`Added URL to detectedVideoUrls[${tabId}]: ${quality}, ${details.url}`);
                // ポップアップにURLが更新されたことを通知
                chrome.runtime.sendMessage({ type: "urlUpdate", tabId: tabId, urls: detectedVideoUrls[tabId] });
                // ★デバッグ用ログ: urlUpdateメッセージが送信されたことをログ
                console.log(`Sent urlUpdate message for tabId: ${tabId}`);
            } else {
                // ★デバッグ用ログ: URLが既に存在してスキップされたことをログ
                console.log(`URL already exists for tabId ${tabId}, skipping add: ${details.url}`);
            }
        } else {
            // ★必要に応じて追加: videoplaybackを含まないgooglevideo.comのURLもログに出す
            // console.log("URL does not contain 'videoplayback':", details.url);
        }
    },
    { urls: ["*://*.googlevideo.com/*"] }
    // Manifest V2では ['blocking'] オプションは通常必要ありませんが、
    // 以前のコードで指定されていた場合はそのままにしておきます。
    // リダイレクトやリクエストのキャンセルを行わないため、厳密には不要です。
);

// ポップアップからのリクエストを処理
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // ★デバッグ用ログ: 受信したメッセージの種類をログ
    console.log("Received message:", request.type, "from sender:", sender);
    if (request.type === "getUrlsForTab") {
        const urlsToSend = detectedVideoUrls[request.tabId] || [];
        sendResponse({ urls: urlsToSend });
        // ★デバッグ用ログ: ポップアップに送信したURLリストをログ
        console.log(`Sent URLs for tabId ${request.tabId}:`, urlsToSend);
    } else if (request.type === "downloadVideo") {
        // ★デバッグ用ログ: ダウンロードリクエストの詳細をログ
        console.log("Download request:", request.url, request.filename);
        chrome.downloads.download({
            url: request.url,
            filename: request.filename
        }, function(downloadId) {
            if (chrome.runtime.lastError) {
                // ★デバッグ用ログ: ダウンロード失敗時のエラーをログ
                console.error("Download failed:", chrome.runtime.lastError.message);
                chrome.runtime.sendMessage({ type: "downloadFailed", message: chrome.runtime.lastError.message });
            } else {
                // ★デバッグ用ログ: ダウンロード開始時のIDをログ
                console.log("Download started with ID:", downloadId);
                chrome.runtime.sendMessage({ type: "downloadStarted", downloadId: downloadId });
            }
        });
    }
});

// タブが閉じられたらURL情報をクリア
chrome.tabs.onRemoved.addListener(function(tabId) {
    // ★デバッグ用ログ: タブが閉じられてURL情報がクリアされたことをログ
    console.log("Tab removed, clearing URLs for tabId:", tabId);
    delete detectedVideoUrls[tabId];
});
