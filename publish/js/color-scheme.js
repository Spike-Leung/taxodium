/**
 * color scheme mode
 * @typedef { 'auto' | 'dark' | 'light' } ColorSchemeMode
 */

const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');

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
      // from giscus.js
      switchGiscusTheme && switchGiscusTheme(mode);
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
  if (document.body) {
    document.body.classList.remove("light", "dark");
    if (mode === "light" || mode === "dark") {
      document.body.classList.add(mode);
    }
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
  setModeSelectValue(savedMode);
  setBodyClass(savedMode);
  requestAnimationFrame(() => switchIframeColorScheme(savedMode));
});
