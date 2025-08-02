// content.js

// ページ内の動画情報を取得する
function getVideoInfo() {
    // ページ内で動画プレイヤーのインスタンスを見つけます
    const player = document.querySelector('ytd-player');

    // プレイヤーの内部から動画ストリームの情報を取得します
    // この方法はYouTubeの内部実装に依存しているため、仕様変更で動作しなくなる可能性があります
    const videoData = player?.getPlayerResponse();

    if (videoData) {
        const urls = [];
        // ビデオストリームとオーディオストリームを結合してダウンロード可能なURLを生成
        if (videoData.streamingData && videoData.streamingData.formats) {
            videoData.streamingData.formats.forEach(format => {
                if (format.mimeType.includes('video')) {
                    urls.push({
                        url: format.url,
                        quality: format.qualityLabel
                    });
                }
            });
        }
        
        // Background.jsに動画情報を送信します
        chrome.runtime.sendMessage({ type: "videoInfo", urls: urls });
    }
}

// ページが完全に読み込まれた後、動画情報を取得
window.onload = function() {
    getVideoInfo();
};

// ページのURLが変わった場合にも再度情報を取得
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === "urlUpdate") {
        getVideoInfo();
    }
});

console.log("Content script loaded.");
