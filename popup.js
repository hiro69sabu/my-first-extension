// popup.js

document.addEventListener('DOMContentLoaded', function() {
    const urlsContainer = document.getElementById('urls-container');
    
    // 現在のタブIDを取得
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs.length === 0) {
            urlsContainer.innerHTML = '<p>タブが見つかりません。</p>';
            return;
        }
        const currentTabId = tabs[0].id;
        
        // background.jsにURLの取得をリクエスト
        chrome.runtime.sendMessage({ type: "getUrlsForTab", tabId: currentTabId }, function(response) {
            urlsContainer.innerHTML = ''; // コンテナをクリア

            if (response && response.urls && response.urls.length > 0) {
                // 取得したURLと品質情報でボタンを生成
                response.urls.forEach(function(item) {
                    const button = document.createElement('button');
                    button.textContent = `Download ${item.quality}`;
                    button.classList.add('download-button');
                    button.addEventListener('click', function() {
                        // background.jsにダウンロードをリクエスト
                        chrome.runtime.sendMessage({
                            type: "downloadVideo",
                            url: item.url,
                            filename: `${document.title}_${item.quality}.mp4`
                        });
                        window.close(); // ポップアップを閉じる
                    });
                    urlsContainer.appendChild(button);
                });
            } else {
                urlsContainer.innerHTML = '<p>YouTube動画を再生してください。</p>';
            }
        });
    });
});
