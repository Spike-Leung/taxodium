(function () {
  const SIDENOTE_CLASS = "sidenote";
  const SIDENOTE_REF_HIGHLIGHT_CLASS = "sidenote-ref-highlight";

  function handleFootnoteMode() {
    mountSidenotes();
    document.querySelector("#footnotes").style.display = "none";
  }

  function mountSidenotes() {
    const footrefList = Array.from(document.querySelectorAll(".footref"));

    footrefList.forEach(function renderSidenote(footrefElement) {
      const footrefHash = footrefElement.hash.slice(1);
      const footrefId = footrefElement.id;
      if (!footrefHash || !footrefId) return;

      footrefElement.dataset.footnoteId = footrefId;

      const footnoteElement = document.querySelector(
        `.footdef:has(a[id*=${CSS.escape(footrefHash)}])`,
      );
      if (!footnoteElement) return;

      const footnoteElementClone = footnoteElement.cloneNode(true);
      footnoteElementClone.classList.add(SIDENOTE_CLASS);
      footnoteElementClone.dataset.footnoteId = footrefId;

      const button = document.createElement("button");
      // text variant of `ℹ`
      button.innerText = "\u2139\uFE0E";
      button.ariaLabel = "脚注信息";
      button.classList.add("sidenote-toggle-trigger");
      button.dataset.footnoteId = footrefId;
      button.removeEventListener("click", toggleSidenote);
      button.addEventListener("click", toggleSidenote);

      const footrefSupElement = footrefElement.parentElement;
      footrefSupElement.insertAdjacentElement("beforebegin", button);
      footrefSupElement.insertAdjacentElement("afterend", footnoteElementClone);
    });

    arrangeSidenotePosition();
    highlightRefPair();
  }

  function arrangeSidenotePosition() {
    const isShowAsSidenote = matchMedia("(width >= 1620px)").matches;

    const footrefList = Array.from(document.querySelectorAll(".footref"));
    footrefList.forEach((footrefElement) => {
      const footrefHash = footrefElement.hash.slice(1);
      if (!footrefHash) return;

      const footnoteElements = document.querySelectorAll(
        `.footdef:has(a[id*=${CSS.escape(footrefHash)}])`,
      );
      if (footnoteElements.length === 0) return;

      const isFootnoteRefNearInlineStart =
        footrefElement.getBoundingClientRect().left < window.innerWidth / 2;

      Array.from(footnoteElements).forEach((footnoteElement) => {
        const footnoteContentWidth =
          footnoteElement.getBoundingClientRect().width;
        const FootnoteOffset = footnoteElement.closest("details") ? 55 : 10;

        if (isShowAsSidenote) {
          ["inline-start", "inline-end"].forEach((classname) =>
            footnoteElement.classList.remove(classname),
          );
          const margin = -1 * (footnoteContentWidth + FootnoteOffset) + "px";
          if (isFootnoteRefNearInlineStart) {
            footnoteElement.classList.add("inline-start");
            footnoteElement.style.marginInlineStart = margin;
          } else {
            footnoteElement.classList.add("inline-end");
            footnoteElement.style.marginInlineEnd = margin;
          }
          footnoteElement.style.removeProperty("display");
        } else {
          ["margin-inline-start", "margin-inline-end"].forEach((prop) =>
            footnoteElement.style.removeProperty(prop),
          );
        }
      });
    });
  }

  function highlightRefPair() {
    const elements = document.querySelectorAll("a[role=doc-backlink]");
    if (elements.length === 0) return;

    Array.from(elements).forEach((element) => {
      element.removeEventListener("mouseenter", highlight);
      element.removeEventListener("mouseleave", cancelHighlight);
      element.addEventListener("mouseenter", highlight);
      element.addEventListener("mouseleave", cancelHighlight);
    });
  }

  function highlight(event) {
    event.target.classList.add(SIDENOTE_REF_HIGHLIGHT_CLASS);

    const footnoteId = event.target.dataset.footnoteId;
    if (!footnoteId) return;

    const sidenoteSupLink = document.querySelector(
      `.${SIDENOTE_CLASS}[data-footnote-id="${CSS.escape(footnoteId)}"] sup a`,
    );
    if (sidenoteSupLink) sidenoteSupLink.classList.add(SIDENOTE_REF_HIGHLIGHT_CLASS);
  }

  function cancelHighlight(event) {
    event.target.classList.remove(SIDENOTE_REF_HIGHLIGHT_CLASS);

    const footnoteId = event.target.dataset.footnoteId;
    if (!footnoteId) return;

    const sidenoteSupLink = document.querySelector(
      `.${SIDENOTE_CLASS}[data-footnote-id="${CSS.escape(footnoteId)}"] sup a`,
    );
    if (sidenoteSupLink) sidenoteSupLink.classList.remove(SIDENOTE_REF_HIGHLIGHT_CLASS);
  }

  function toggleSidenote(event) {
    const footnoteId = event.target.dataset.footnoteId;
    const sidenote = document.querySelector(
      `.${SIDENOTE_CLASS}[data-footnote-id="${CSS.escape(footnoteId)}"]`,
    );

    if (!sidenote) return;

    sidenote.style.display =
      getComputedStyle(sidenote).display === "none" ? "grid" : "none";
  }

  document.addEventListener("DOMContentLoaded", function () {
    handleFootnoteMode();
    setTimeout(arrangeSidenotePosition, 100);

    let ticking = false;
    let debounceTimer;

    window.addEventListener("resize", () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          arrangeSidenotePosition();
          ticking = false;
        });
        ticking = true;
      }

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        arrangeSidenotePosition();
      }, 150);
    });
  });
})();
