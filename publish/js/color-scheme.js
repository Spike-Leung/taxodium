const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');

function getSavedColorScheme() {
  return localStorage.getItem("color-scheme") || "auto";
}

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

function switchGiscusTheme(mode) {
  const iframe = document.querySelector("iframe.giscus-frame");
  const theme = {
    auto: "preferred_color_scheme",
    light: "light_high_contrast",
    dark: "dark_high_contrast",
  };

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
}

function initColorScheme() {
  try {
    const savedMode = getSavedColorScheme();
    setModeSelectValue(savedMode);
    switchMode(savedMode, true);
  } catch (err) {
    console.error(err);
  }
}

function setModeSelectValue(mode) {
  const modeSelect = document.querySelector("#lightdark");
  modeSelect && (modeSelect.value = mode);
}

initColorScheme();

document.addEventListener("DOMContentLoaded", () => {
  const savedMode = getSavedColorScheme();
  setTimeout(() => {
    // 因为 giscus 是加载 script 后动态渲染，DOMContentLoaded 时可能还没能拿到，增加一定的定时等待
    const iframe = document.querySelector("iframe.giscus-frame");
    iframe.addEventListener("load", () => {
      switchGiscusTheme(savedMode);
    });
  }, 1000);
  setModeSelectValue(savedMode);
});
