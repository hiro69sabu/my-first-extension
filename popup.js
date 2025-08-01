// popup.js

document.addEventListener('DOMContentLoaded', function() {
    const urlDisplay = document.getElementById('urlDisplay');
    const copyButton = document.getElementById('copyButton');
    const messageDiv = document.getElementById('message');

    // バックグラウンドスクリプトからURLを取得
    chrome.runtime.sendMessage({ type: "getM3u8Url" }, function(response) {
        if (response && response.url) {
            urlDisplay.textContent = response.url;
            copyButton.disabled = false;
        } else {
            urlDisplay.textContent = "現在ライブ配信のM3U8 URLは検出されていません。MixChannelのライブ配信ページを開いてみてください。";
            copyButton.disabled = true;
        }
    });

    // コピーボタンのクリックイベント
    copyButton.addEventListener('click', function() {
        const urlToCopy = urlDisplay.textContent;
        if (urlToCopy && urlToCopy !== "URLが検出されていません" && !copyButton.disabled) {
            navigator.clipboard.writeText(urlToCopy).then(() => {
                messageDiv.textContent = "URLをクリップボードにコピーしました！";
                setTimeout(() => messageDiv.textContent = "", 3000); // 3秒後にメッセージを消す
            }).catch(err => {
                messageDiv.textContent = "コピーに失敗しました: " + err;
                console.error('Failed to copy text: ', err);
            });
        }
    });
});
