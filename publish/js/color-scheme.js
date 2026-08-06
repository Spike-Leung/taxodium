(function () {
  const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');

  function getSavedColorScheme() {
    return localStorage.getItem("color-scheme");
  }

  /**
   * 主题下拉框切换事件，切换主题
   * @param { boolean } isInit - 是否是页面初始化
   */
  function switchMode(isInit = false) {
    try {
      const { scheme, mode } = convertColorScheme(isInit);

      if (!document.startViewTransition) {
        setColorScheme();
        return;
      }

      function setColorScheme() {
        colorSchemeMeta.setAttribute("content", scheme);
        localStorage.setItem("color-scheme", mode);
        mode && setBodyClass(mode);
        switchIframeColorScheme();
      }

      isInit ? setColorScheme() : document.startViewTransition(setColorScheme);
    } catch (err) {
      console.error(err);
    }
  }

  function setBodyClass(mode) {
    if (document.body) {
      document.body.classList.remove("light", "dark");
      document.body.classList.add(mode);
    }
  }

  /**
   * 切换页面所有 iframe 的 color-scheme
   */
  function switchIframeColorScheme() {
    const iframes = document.querySelectorAll("iframe");

    iframes.forEach((iframe) => {
      const setColorScheme = () => {
        try {
          const iframeDocument = iframe.contentWindow.document;
          if (iframeDocument) {
            iframeDocument.documentElement.style.colorScheme =
              colorSchemeMeta.getAttribute("content");
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

  function convertColorScheme(isInit) {
    const savedMode = getSavedColorScheme();
    const isSystemLight = window.matchMedia(
      "(prefers-color-scheme: light)",
    ).matches;
    const isSystemDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const system = {
      scheme: "light dark",
      mode: undefined,
    };
    const dark = {
      scheme: "dark",
      mode: "dark",
    };
    const light = {
      scheme: "light",
      mode: "light",
    };

    // 如果不是用户點擊的，則原來是什麼就是什麼
    if (isInit) {
      switch (savedMode) {
        case "light":
          return light;
        case "dark":
          return dark;
        default:
          return system;
      }
    }

    // 如果是用户點擊的，則要進行切換
    // 切換時，如果和系統一致，則還原成系統點認
    if (savedMode === "light") {
      return isSystemDark ? system : dark;
    }

    if (savedMode === "dark") {
      return isSystemLight ? system : light;
    }

    return isSystemLight ? dark : light;
  }

  /**
   * 初始化主题
   */
  function initColorScheme() {
    try {
      switchMode(true);
    } catch (err) {
      console.error(err);
    }
  }

  // 马上执行，避免页面切换导致的闪烁
  initColorScheme();

  function setSafariFlag() {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isSafari) {
      document.body.classList.add("is-safari");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const themeBtn = document.querySelector("#lightdark");
    /* 等待 iframe 加载完成 */
    setTimeout(() => {
      switchIframeColorScheme();
    }, 500);

    setSafariFlag();
    themeBtn?.addEventListener("click", () => switchMode());
  });
})();
