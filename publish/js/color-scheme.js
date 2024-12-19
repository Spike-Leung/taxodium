const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
const modeSelect = document.querySelector('#lightdark');

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
      switchGiscusTheme(mode)
    }

    // 如果不是通过 select 切换的，则不启用 vimw transition, 避免白色主题到黑色主题过渡时的闪烁。
    isInit ? setColorScheme() : document.startViewTransition(() => setColorScheme());
  } catch (err) {
    console.error(err)
  }
}

function getSavedColorScheme() {
  return localStorage.getItem("color-scheme") || "auto";
}

// Set Theme giscus theme
function switchGiscusTheme(mode) {
  const iframe = document.querySelector('.giscus-frame');
  const theme = {
    auto: 'preferred_color_scheme',
    light: 'light_high_contrast',
    dark: 'dark_high_contrast'
  }

  if (iframe) {
    const url = new URL(iframe.src);
    url.searchParams.set('theme', theme[mode]);
    iframe.src = url.toString();
  }
}

function initColorScheme() {
  try {
    const savedMode = getSavedColorScheme();
    modeSelect && (modeSelect.value = savedMode)

    switchMode(savedMode, true);
  } catch (err) {
    console.error(err)
  }
}

initColorScheme()

document.addEventListener("DOMContentLoaded", (event) => {
  switchGiscusTheme(getSavedColorScheme())
});
