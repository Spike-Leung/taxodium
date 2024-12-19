const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
const modeSelect = document.querySelector('#lightdark');

function switchMode(mode) {
  try {
    const scheme = mode === "auto" ? "light dark" : mode;

    if (!document.startViewTransition) {
      setColorScheme();
      return;
    }

    function setColorScheme() {
      colorSchemeMeta.setAttribute("content", scheme);
      localStorage.setItem("color-scheme", mode);
    }

    document.startViewTransition(() => setColorScheme());
  } catch (err) {
    console.error(err)
  }
}

function getSavedColorScheme() {
  return localStorage.getItem("color-scheme") || "auto";
}

function initColorScheme() {
  try {
    const savedMode = getSavedColorScheme();
    modeSelect && (modeSelect.value = savedMode)

    switchMode(savedMode);
  } catch (err) {
    console.error(err)
  }
}

initColorScheme()
