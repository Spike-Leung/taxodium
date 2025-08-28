const GiscusTheme = {
  // for debug
  // auto: "https://localhost:3000/styles/giscus/preferred-color-scheme.css",
  // light: "https://localhost:3000/styles/giscus/light-high-contrast.css",
  // dark: "https://localhost:3000/styles/giscus/dark-high-contrast.css",
  auto: "https://taxodium.ink/styles/giscus/preferred-color-scheme.css",
  light: "https://taxodium.ink/styles/giscus/light-high-contrast.css",
  dark: "https://taxodium.ink/styles/giscus/dark-high-contrast.css",
};

/**
 * 切换 Gitcus 的主题
 * @param { ColorSchemeMode } mode - 当前主题模式
 */
function switchGiscusTheme(mode) {
  try {
    const iframe = document.querySelector("iframe.giscus-frame");

    // @link: https://github.com/giscus/giscus/issues/336
    function sendMessage(message) {
      if (!iframe) return;
      iframe.contentWindow.postMessage({ giscus: message }, "https://giscus.app");
    }
    function setGisSrc(theme) {
      if (!iframe) return;
      const iframeSrc = iframe.src;
      const iframeUrl = new URL(iframeSrc);
      const iframeSearchParams = iframeUrl.searchParams;
      iframeSearchParams.set('theme', theme);

      iframe.src = iframeUrl.toString();
    };

    // Giscus doesn't accept messages if it's not loaded
    if (iframe?.classList.contains('giscus-frame--loading')) {
      setGisSrc(GiscusTheme[mode]);
    } else {
      sendMessage({
        setConfig: {
          theme: GiscusTheme[mode],
        },
      });
    }
  } catch (err) {
    console.error(err);
  }
}

/**
 * 初始化 Giscus 主题
 * @param { ColorSchemeMode } mode - 当前主题模式
 */
function initGiscusTheme(mode) {
  let giscusAttributes = {
    "src": "https://giscus.app/client.js",
    "data-repo": "Spike-Leung/taxodium",
    "data-repo-id": "MDEwOlJlcG9zaXRvcnkzOTYyNDQwMzk=",
    "data-category": "Announcements",
    "data-category-id": "DIC_kwDOF540R84Ci61D",
    "data-mapping": "pathname",
    "data-strict": "0",
    "data-reactions-enabled": "1",
    "data-emit-metadata": "0",
    "data-input-position": "top",
    "data-theme": GiscusTheme[mode],
    "data-lang": "zh-CN",
    "data-loading": "lazy",
    "crossorigin": "anonymous",
    "async": "",
  };

  let giscusScript = document.createElement("script");
  Object.entries(giscusAttributes).forEach(([key, value]) => giscusScript.setAttribute(key, value));
  document.body.appendChild(giscusScript);
}

document.addEventListener("DOMContentLoaded", () => {
  let colorScheme = localStorage.getItem("color-scheme") || "auto";
  if (typeof getSavedColorScheme === 'function') {
    colorScheme = getSavedColorScheme();
  }
  initGiscusTheme(colorScheme);
});
