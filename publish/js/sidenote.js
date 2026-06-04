(function () {
  const SIDENOTE_CLASS = "sidenote";
  const SIDENOTE_REF_HIGHLIGHT_CLASS = "sidenote-ref-highlight";

  function handleFootnoteMode() {
    mountSidenotes();
    document.querySelector("#footnotes").style.display = "none";
  }

  function mountSidenotes() {
    const footrefList = Array.from(document.querySelectorAll(".footref"))

    footrefList.forEach(function renderSidenote(footrefElement) {
      const footrefHash = footrefElement.hash.slice(1)
      const footrefSupElement = footrefElement.parentElement
      const footnoteElement = document.querySelector(`.footdef:has(a[id*=${CSS.escape(footrefHash)}])`).cloneNode(true)

      const button = document.createElement('button')
      button.innerText = footrefElement.innerText
      button.classList.add('sidenote-toggle-trigger')
      button.removeEventListener("click", toggleSidenote)
      button.addEventListener("click", toggleSidenote)

      footrefSupElement.insertAdjacentElement('beforebegin', button)
      footrefSupElement.insertAdjacentElement('afterend', footnoteElement)
      footnoteElement.classList.add(SIDENOTE_CLASS)
    })

    arrangeSidenotePosition()
    highlightRefPair()
  }

  function arrangeSidenotePosition() {
    const isShowAsSidenote = matchMedia("(width >= 1620px)").matches

    const footrefList = Array.from(document.querySelectorAll(".footref"))
    footrefList.forEach((footrefElement) => {
      const footrefHash = footrefElement.hash.slice(1)
      const footnoteElements = document.querySelectorAll(`.footdef:has(a[id*=${CSS.escape(footrefHash)}])`)
      const isFootnoteRefNearInlineStart =
            footrefElement.getBoundingClientRect().left < window.innerWidth / 2;

      Array.from(footnoteElements).forEach((footnoteElement) => {
        const footnoteContentWidth = footnoteElement.getBoundingClientRect().width
        const FootnoteOffset = footnoteElement.closest('details') ? 55 : 10

        if (isShowAsSidenote) {
          ['inline-start', 'inline-end']
            .forEach((classname) => footnoteElement.classList.remove(classname))
          const margin = -1 * (footnoteContentWidth + FootnoteOffset) + "px"
          if (isFootnoteRefNearInlineStart) {
            footnoteElement.classList.add('inline-start')
            footnoteElement.style.marginInlineStart = margin
          } else {
            footnoteElement.classList.add('inline-end')
            footnoteElement.style.marginInlineEnd = margin
          }
          footnoteElement.style.removeProperty('display');
        } else {
          ['margin-inline-start', 'margin-inline-end']
            .forEach((prop) => footnoteElement.style.removeProperty(prop))
        }
      })
    })
  }

  function highlightRefPair() {
    Array.from(document.querySelectorAll("a[role=doc-backlink]")).forEach((element) => {
      element.removeEventListener('mouseenter', highlight)
      element.removeEventListener('mouseleave', cancelHighlight)
      element.addEventListener('mouseenter', highlight)
      element.addEventListener('mouseleave', cancelHighlight)
    })
  }

  function highlight(event) {
    const { hash } = event.target;
    event.target.classList.add(SIDENOTE_REF_HIGHLIGHT_CLASS);
    document.querySelector(`#${CSS.escape(hash.slice(1))}`).classList.add(SIDENOTE_REF_HIGHLIGHT_CLASS);
  }

  function cancelHighlight(event) {
    const { hash } = event.target;
    event.target.classList.remove(SIDENOTE_REF_HIGHLIGHT_CLASS);
    document.querySelector(`#${CSS.escape(hash.slice(1))}`).classList.remove(SIDENOTE_REF_HIGHLIGHT_CLASS);
  }

  function toggleSidenote(event) {
    const sidenote = event.target.nextElementSibling.nextElementSibling
    sidenote.style.display = getComputedStyle(sidenote).display === 'none' ? 'grid' : 'none'
  }

  document.addEventListener("DOMContentLoaded", function () {
    handleFootnoteMode();
    setTimeout(arrangeSidenotePosition, 100)

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
