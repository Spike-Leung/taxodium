const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
const modeSelect = document.querySelector('#lightdark');

function switchMode(mode) {
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
}

function getSavedColorScheme() {
  return localStorage.getItem("color-scheme") || "auto";
}

const savedMode = getSavedColorScheme();
modeSelect.value = savedMode;
switchMode(savedMode);

modeSelect.addEventListener('change', (event) => {
  switchMode(event.target.value);
});
