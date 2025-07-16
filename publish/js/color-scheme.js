/**
 * color scheme mode
 * @typedef { 'auto' | 'dark' | 'light' } ColorSchemeMode
 */

const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');

const GiscusTheme = {
  // for debug
  // auto: "https://localhost:3000/styles/giscus/preferred-color-scheme.css",
  // light: "https://localhost:3000/styles/giscus/light-high-contrast.css",
  // dark: "https://localhost:3000/styles/giscus/dark-high-contrast.css",
  auto: "https://taxodium.ink/styles/giscus/preferred-color-scheme.css",
  light: "https://taxodium.ink/styles/giscus/light-high-contrast.css",
  dark: "https://taxodium.ink/styles/giscus/dark-high-contrast.css",
};

function getSavedColorScheme() {
  return localStorage.getItem("color-scheme") || "auto";
}

/**
 * 主题下拉框切换事件，切换主题
 * @param { ColorSchemeMode } mode - 当前主题模式
 * @param { boolean } isInit - 是否是页面初始化
 */
function switchMode(mode, isInit = false) {
  try {
    const scheme = mode === "auto" ? "light dark" : mode;

    if (!document.startViewTransition) {
      setColorScheme();
      return;
    }

    function setColorScheme() {
      colorSchemeMeta.setAttribute("content", scheme);
      localStorage.setItem("color-scheme", mode);
      setBodyClass(mode);
      switchGiscusTheme(mode);
      switchIframeColorScheme(mode);
    }

    isInit
      ? setColorScheme()
      : document.startViewTransition(() => setColorScheme());
  } catch (err) {
    console.error(err);
  }
}

/**
 * 设置主题模式下拉框的值
 * @param { ColorSchemeMode } mode - 当前主题模式
 */
function setModeSelectValue(mode) {
  const modeSelect = document.querySelector("#lightdark");
  modeSelect && (modeSelect.value = mode);
}

function setBodyClass(mode) {
  // Set body class for color scheme
  if (document.body) {
    document.body.classList.remove("light", "dark");
    if (mode === "light" || mode === "dark") {
      document.body.classList.add(mode);
    }
  }
}

/**
 * 切换 Gitcus 的主题
 * @param { ColorSchemeMode } mode - 当前主题模式
 */
function switchGiscusTheme(mode) {
  try {
    const iframe = document.querySelector("iframe.giscus-frame");

    // @link: https://github.com/giscus/giscus/issues/336
    function sendMessage(message) {
      console.log({ iframe })
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
 * 切换页面所有 iframe 的 color-scheme
 * @param { ColorSchemeMode } mode - 当前主题模式
 */
function switchIframeColorScheme(mode) {
  const iframes = document.querySelectorAll("iframe");

  iframes.forEach((iframe) => {
    if (iframe.classList.contains("giscus-frame")) {
      return;
    }

    const setColorScheme = () => {
      try {
        const iframeDocument = iframe.contentWindow.document;
        if (iframeDocument) {
          iframeDocument.documentElement.style.colorScheme =
            mode === "auto" ? "light dark" : mode;
        }
      } catch (error) {
        console.warn(`Unable to set color-scheme for iframe:`, iframe, error);
      }
    };

    // 如果 iframe 已经加载完成，直接设置 color-scheme
    if (iframe.contentDocument?.readyState === "complete") {
      setColorScheme();
    } else {
      // 等待 iframe 加载完成再设置
      iframe.addEventListener("load", setColorScheme, { once: true });
    }
  });
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

/**
 * 初始化主题
 */
function initColorScheme() {
  try {
    const savedMode = getSavedColorScheme();
    setModeSelectValue(savedMode);
    switchMode(savedMode, true);
  } catch (err) {
    console.error(err);
  }
}

// 马上执行，避免页面切换导致的闪烁
initColorScheme();

document.addEventListener("DOMContentLoaded", () => {
  const savedMode = getSavedColorScheme();
  initGiscusTheme(savedMode);
  setModeSelectValue(savedMode);
  setBodyClass(savedMode);
  requestAnimationFrame(() => switchIframeColorScheme(savedMode));
});
