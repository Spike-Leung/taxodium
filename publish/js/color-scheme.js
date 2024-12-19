const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');

function getSavedColorScheme() {
  return localStorage.getItem("color-scheme") || "auto";
}

/**
 * 主题下拉框切换事件，切换主题
 * @param { 'auto' | 'dark' | 'light' } mode - 当前主题模式
 * @param {boolean} isInit - 是否是页面初始化
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
      switchGiscusTheme(mode);
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
 * @param { 'auto' | 'dark' | 'light' } mode - 当前主题模式
 */
function setModeSelectValue(mode) {
  const modeSelect = document.querySelector("#lightdark");
  modeSelect && (modeSelect.value = mode);
}

/**
 * 切换 Gitcus 的主题
 * @param { 'auto' | 'dark' | 'light' } mode - 当前主题模式
 */
function switchGiscusTheme(mode) {
  const theme = {
    auto: "preferred_color_scheme",
    light: "light_high_contrast",
    dark: "dark_high_contrast",
  };

  try {
    // {@link https://github.com/giscus/giscus/issues/336}
    function sendMessage(message) {
      const iframe = document.querySelector("iframe.giscus-frame");
      if (!iframe) return;
      iframe.contentWindow.postMessage({ giscus: message }, "https://giscus.app");
    }

    sendMessage({
      setConfig: {
        theme: theme[mode],
      },
    });
  } catch (err) {
    console.error(err);
  }
}

/**
 * 初始化 Giscus 主题
 * @param { 'auto' | 'dark' | 'light' } mode - 当前主题模式
 */
function initGiscusTheme(mode) {
  const interval = setInterval(() => {
    // 因为 giscus 是加载 script 后动态渲染，DOMContentLoaded 时可能还没能拿到，增加一定的定时等待
    const iframe = document.querySelector("iframe.giscus-frame");
    if (!iframe) return;
    iframe.addEventListener("load", () => {
      switchGiscusTheme(mode);
    });
    clearInterval(interval);
  }, 1000);
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


initColorScheme();

document.addEventListener("DOMContentLoaded", () => {
  const savedMode = getSavedColorScheme();
  initGiscusTheme(savedMode)
  setModeSelectValue(savedMode);
});
