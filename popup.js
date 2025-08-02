// popup.js

document.addEventListener('DOMContentLoaded', function() {
    const videoListDiv = document.getElementById('videoList');
    const statusMessageDiv = document.getElementById('statusMessage');
    const noUrlsMessageDiv = document.getElementById('noUrlsMessage');

    // バックグラウンドスクリプトから現在のタブのURLリストを取得
    function getAndDisplayUrls() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs.length === 0) {
                statusMessageDiv.textContent = "タブが見つかりません。";
                return;
            }
            const currentTabId = tabs[0].id;
            
            // バックグラウンドに現在のタブIDを渡してURLを要求
            chrome.runtime.sendMessage({ type: "getUrlsForTab", tabId: currentTabId }, function(response) {
                videoListDiv.innerHTML = ''; // リストをクリア

                if (response && response.urls && response.urls.length > 0) {
                    noUrlsMessageDiv.style.display = 'none';
                    statusMessageDiv.textContent = "検出された動画ストリーム:";
                    response.urls.forEach(videoInfo => {
                        const videoItem = document.createElement('div');
                        videoItem.className = 'video-item';

                        const urlInfo = document.createElement('span');
                        urlInfo.textContent = `画質: ${videoInfo.quality || '不明'}`;
                        urlInfo.title = videoInfo.url;
                        urlInfo.className = 'video-item-info';

                        const downloadButton = document.createElement('button');
                        downloadButton.className = 'download-button';
                        downloadButton.textContent = 'ダウンロード';
                        downloadButton.onclick = function() {
                            downloadButton.disabled = true;
                            downloadButton.textContent = 'ダウンロード中...';
                            chrome.runtime.sendMessage({ 
                                type: "downloadVideo", 
                                url: videoInfo.url, 
                                filename: `youtube_video_${videoInfo.quality || 'download'}.mp4` 
                            });
                        };

                        videoItem.appendChild(urlInfo);
                        videoItem.appendChild(downloadButton);
                        videoListDiv.appendChild(videoItem);
                    });
                } else {
                    noUrlsMessageDiv.style.display = 'block';
                    statusMessageDiv.textContent = "YouTube動画を再生してください...";
                }
            });
        });
    }

    // ポップアップが開かれたときにURLリストを取得
    getAndDisplayUrls();

    // バックグラウンドスクリプトからのURL更新通知を受け取る
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.type === "urlUpdate") {
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                if (tabs.length > 0 && tabs[0].id === request.tabId) {
                    getAndDisplayUrls();
                }
            });
        } else if (request.type === "downloadStarted") {
            statusMessageDiv.textContent = "ダウンロードを開始しました！";
        } else if (request.type === "downloadFailed") {
            statusMessageDiv.textContent = `ダウンロード失敗: ${request.message}`;
        }
    });
});
