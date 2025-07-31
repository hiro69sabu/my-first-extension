// background.js - 最終形態

chrome.runtime.onInstalled.addListener(() => {
  console.log('My First Extension - Background script installed.');
});

chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    // URLに ".m3u8" という文字列が含まれている場合のみ、コンソールに出力する
    if (details.url.includes(".m3u8")) {
      console.log("!!!!!!!! M3U8 Found !!!!!!!!");
      console.log(details.url);
      console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    }
  },
  {
    urls: ["<all_urls>"] // すべてのURLを対象とする
  }
);
