// popup.js

document.addEventListener('DOMContentLoaded', function() {
    const urlsContainer = document.getElementById('urls-container');
    
    // 現在のタブIDを取得
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs.length === 0) {
            urlsContainer.innerHTML = '<p>タブが見つかりません。</p>';
            console.log("No tabs found. Displaying 'タブが見つかりません。'"); // ★デバッグ用ログ
            return;
        }
        const currentTabId = tabs[0].id;
        console.log("Current Tab ID:", currentTabId); // ★デバッグ用ログ
        
        // background.jsにURLの取得をリクエスト
        chrome.runtime.sendMessage({ type: "getUrlsForTab", tabId: currentTabId }, function(response) {
            console.log("Received response from background:", response); // ★デバッグ用ログ: これが最も重要
            urlsContainer.innerHTML = ''; // コンテナをクリア

            if (response && response.urls && response.urls.length > 0) {
                console.log("URLs found in response:", response.urls); // ★デバッグ用ログ
                // 取得したURLと品質情報でボタンを生成
                response.urls.forEach(function(item) {
                    console.log("Processing item:", item); // ★デバッグ用ログ: itemの内容を確認

                    // nullエラーを回避するための追加チェック
                    if (!item || typeof item.quality === 'undefined' || typeof item.url === 'undefined') {
                        console.error("Invalid item or missing 'quality'/'url' property, skipping:", item); // ★デバッグ用ログ
                        return; // 無効なアイテムはスキップ
                    }

                    const button = document.createElement('button');
                    button.textContent = `Download ${item.quality}`;
                    button.classList.add('download-button');
                    button.addEventListener('click', function() {
                        // background.jsにダウンロードをリクエスト
                        chrome.runtime.sendMessage({
                            type: "downloadVideo",
                            url: item.url,
                            // 注意: document.titleはポップアップを開いた時点のタブのタイトルです。
                            // より正確な動画タイトルが必要な場合、background.jsで取得し、
                            // itemオブジェクトに含めて渡す必要があります。
                            filename: `${document.title || 'video'}_${item.quality}.mp4` 
                        });
                        window.close(); // ポップアップを閉じる
                    });
                    urlsContainer.appendChild(button);
                    console.log(`Added button for: ${item.quality}`); // ★デバッグ用ログ
                });
            } else {
                console.log("No URLs found in response or response is empty. Displaying 'YouTube動画を再生してください。'"); // ★デバッグ用ログ
                urlsContainer.innerHTML = '<p>YouTube動画を再生してください。</p>';
            }
        });
    });
});
