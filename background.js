// このファイルは拡張機能のバックグラウンドで動作するスクリプトです。

// 拡張機能がインストールされた、またはアップデートされた時に一度だけ実行されるイベント
chrome.runtime.onInstalled.addListener(() => {
  console.log('My First Extension - Background script installed.');
});

// すべての通信リクエストを監視するイベントリスナー
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    // リクエストの詳細の中から、URLだけをコンソールに出力する
    console.log("Request URL:", details.url);
  },
  {
    urls: ["<all_urls>"] // すべてのURLを対象とする
  }
);
