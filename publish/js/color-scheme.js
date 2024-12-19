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

    isInit ? setColorScheme() : document.startViewTransition(() => setColorScheme());
  } catch (err) {
    console.error(err);
  }
}

function switchGiscusTheme(mode) {
  const iframe = document.querySelector('.giscus-frame');
  const theme = {
    auto: 'preferred_color_scheme',
    light: 'light_high_contrast',
    dark: 'dark_high_contrast'
  };

  if (iframe) {
    const url = new URL(iframe.src);
    url.searchParams.set('theme', theme[mode]);
    iframe.src = url.toString();
  }
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
  const modeSelect = document.querySelector('#lightdark');
  modeSelect && (modeSelect.value = mode);
}

initColorScheme();

document.addEventListener("DOMContentLoaded", () => {
  const savedMode = getSavedColorScheme();
  switchGiscusTheme(savedMode);
  setModeSelectValue(savedMode);
});
