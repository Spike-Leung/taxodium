/**
 * color scheme mode
 * @typedef { 'auto' | 'dark' | 'light' | 'light-retro' | 'dark-retro' } ColorSchemeMode
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
    const scheme = convertColorScheme(mode)

    if (!document.startViewTransition) {
      setColorScheme();
      return;
    }

    function setColorScheme() {
      colorSchemeMeta.setAttribute("content", scheme);
      localStorage.setItem("color-scheme", mode);
      setBodyClass(mode);
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
    document.body.classList.remove("light", "dark", "light-retro", "dark-retro", "auto");
    document.body.classList.add(mode);

    switch(mode) {
    case 'light-retro':
      document.body.classList.add('light');
      break;
    case 'dark-retro':
      document.body.classList.add('dark');
      break;
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
    const setColorScheme = () => {
      try {
        const iframeDocument = iframe.contentWindow.document;
        if (iframeDocument) {
          iframeDocument.documentElement.style.colorScheme = convertColorScheme(mode)

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

function convertColorScheme(mode) {
  if (mode === 'dark-retro') {
    return 'dark'
  }

  if (mode === 'light-retro') {
    return 'light'
  }

  if (mode === 'auto') {
    return 'light dark'
  }

  return mode
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

  document.querySelector("#lightdark").addEventListener('change', (event) => switchMode(event.target.value));
});
