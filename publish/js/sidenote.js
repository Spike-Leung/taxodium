(function(){
  /**
   * Sidenote 脚注浮边栏脚本
   * - 复用 className 常量
   * - 提取主要逻辑为函数
   * - 优化变量命名和注释
   */

  const SIDENOTE_CLASS = 'sidenote';
  const SIDENOTE_CONTAINER_CLASS = 'sidenote-container';
  const SIDENOTE_NUM_CLASS = 'sidenote-num';
  const SIDENOTE_CONTENT_CLASS = 'sidenote-content';
  const SIDENOTE_REF_HIGHLIGHT_CLASS = 'sidenote-ref-highlight';

  function isSidenoteVisible() {
    return window.matchMedia('(min-width: 1500px)').matches;
  }

  function handleFootnoteMode() {
    if (isSidenoteVisible()) {
      mountSidenotes();
    } else {
      unmountSidenotes();
    }
  }

  function recenterFootnoteSup(e) {
    e.preventDefault();
    e.target.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
    history.pushState(null, null, location.origin + location.pathname + '#' + e.target.id);
  }

  let sidenoteCleanup = null;
  function mountSidenotes() {
    if (sidenoteCleanup) return;

    const content = document.querySelector('#content');
    if (!content) return;

    // remove all sidenotes
    document.querySelectorAll('.' + SIDENOTE_CLASS).forEach(el => el.remove());
    document.querySelectorAll('.' + SIDENOTE_CONTAINER_CLASS).forEach(el => el.remove());

    // setup sidenote container
    const sidenoteContainer = document.createElement('div');
    sidenoteContainer.className = SIDENOTE_CONTAINER_CLASS;
    content.appendChild(sidenoteContainer);
    content.style.position = 'relative';

    function highlightRef(footnoteSup, highlight) {
      if (!footnoteSup) return;
      if (highlight) {
        footnoteSup.classList.add(SIDENOTE_REF_HIGHLIGHT_CLASS);
      } else {
        footnoteSup.classList.remove(SIDENOTE_REF_HIGHLIGHT_CLASS);
      }
    }

    function createSidenote(ref, footnote, idx) {
      const footnoteSup = ref.parentElement; // sup element
      const footnoteNumber = ref.textContent;

      if (!footnoteSup.id) {
        footnoteSup.id = `sidenote-ref-${idx}`;
      }

      // 创建编号链接
      const noteLink = document.createElement('a');
      noteLink.href = `#${footnoteSup.id || ''}`;
      noteLink.className = SIDENOTE_NUM_CLASS;
      noteLink.textContent = footnoteNumber;

      // hover 高亮正文脚注引用
      noteLink.addEventListener('mouseenter', function() {
        highlightRef(footnoteSup, true);
      });
      noteLink.addEventListener('mouseleave', function() {
        highlightRef(footnoteSup, false);
      });

      function highlightFootnoteSup() {
        const sidenoteLink = document.querySelector(`a.sidenote-num[href*=${footnoteSup.id}]`)
        highlightRef(footnoteSup, true);
        highlightRef(sidenoteLink, true);
      }

      function cancelHighlightFootnoteSup() {
        const sidenoteLink = document.querySelector(`a.sidenote-num[href*=${footnoteSup.id}]`)
        highlightRef(footnoteSup, false);
        highlightRef(sidenoteLink, false);
      }

      footnoteSup.removeEventListener('mouseenter', highlightFootnoteSup)
      footnoteSup.removeEventListener('mouseleave', cancelHighlightFootnoteSup)
      footnoteSup.addEventListener('click', recenterFootnoteSup)
      footnoteSup.addEventListener('mouseenter', highlightFootnoteSup);
      footnoteSup.addEventListener('mouseleave', cancelHighlightFootnoteSup);

      // 创建 sidenote
      const sidenote = document.createElement('aside');
      sidenote.className = SIDENOTE_CLASS;
      sidenote.role = "note";
      sidenote.dataset.refIndex = idx;

      // 插入编号链接和内容
      sidenote.appendChild(noteLink);
      const contentSpan = document.createElement('span');
      contentSpan.className = SIDENOTE_CONTENT_CLASS;
      contentSpan.innerHTML = footnote.innerHTML;
      sidenote.appendChild(contentSpan);

      // 记录 ref 元素
      footnoteSup.dataset.sidenoteIndex = idx;

      return sidenote;
    }

    const refs = Array.from(document.querySelectorAll('sup > a.footref'));
    refs.forEach(function(ref, idx) {
      // footref: <a id="fnr.1" class="footref" href="#fn.1" role="doc-backlink">1</a>
      // footnoteLink: <a id="fn.1" class="footnum" href="#fnr.1" role="doc-backlink">1</a>
      const href = ref.getAttribute('href');
      if (!href || !href.startsWith('#fn.')) return;
      const footnoteId = href.slice(1);
      const footnoteLink = document.getElementById(footnoteId);
      if (!footnoteLink) return;

      // find footnote nearby footref
      let footnote = null;
      let parent = footnoteLink.parentElement;
      while (parent && !footnote) {
        footnote = parent.querySelector('.footpara');
        parent = parent.parentElement;
      }
      if (!footnote) return;

      const sidenote = createSidenote(ref, footnote, idx);
      sidenoteContainer.appendChild(sidenote);
    });

    function positionSidenotes() {
      let lastBottomRight = 0;
      let lastBottomLeft = 0;
      refs.forEach(function(ref, idx) {
        const sidenote = sidenoteContainer.querySelector(`.${SIDENOTE_CLASS}[data-ref-index="${idx}"]`);
        const prevSidenote = sidenoteContainer.querySelector(`.${SIDENOTE_CLASS}[data-ref-index="${idx - 1}"]`);

        if (!sidenote) return;

        // 如果是 details 内的 sidenote，为展开则不展示
        const detailsParent = ref.closest('details');
        if (detailsParent && !detailsParent.open) {
          sidenote.style.display = 'none';
          return;
        }
        sidenote.style.display = '';

        const padding = '.5em';
        const sidenoteGap = 8;

        // 先重置高度，避免内容变化导致高度不准
        sidenote.style.top = '0px';
        sidenote.style.position = 'absolute';
        const footnoteSup = ref.parentElement;
        const rect = footnoteSup.getBoundingClientRect();
        const contentRect = content.getBoundingClientRect();
        let top = rect.top - contentRect.top + content.scrollTop;

        sidenote.style.paddingInlineStart = padding;
        sidenote.style.left = '100%';

        // 避免 sidenote 重叠
        if (prevSidenote && prevSidenote.style.display !== 'none') {
          const { height: prevSidenoteHeight } = prevSidenote.getBoundingClientRect();
          const prevSidenoteTop = Number.parseInt(prevSidenote.style.top, 10);
          const prevSidenoteBottom = prevSidenoteTop + prevSidenoteHeight;

          if (top - prevSidenoteBottom < sidenoteGap) {
            top = prevSidenoteBottom + sidenoteGap
          }
        }

        sidenote.style.top = `${top}px`;
      });
      // 设置 sidenote-container 的 position
      sidenoteContainer.style.position = 'absolute';
      sidenoteContainer.style.top = '0';
      sidenoteContainer.style.pointerEvents = 'none';
    }

    positionSidenotes();
    window.addEventListener('resize', positionSidenotes);
    window.addEventListener('scroll', positionSidenotes, true);
    window.addEventListener('click', (e) => {
      if (e.target.nodeName === 'SUMMARY') {
        setTimeout(() => positionSidenotes(), 0)
      }
    });

    sidenoteCleanup = function() {
      const refs = Array.from(document.querySelectorAll('sup:has(a.footref)'));
      refs.forEach((footnoteSup) => {
        footnoteSup.removeEventListener('click', recenterFootnoteSup)
      });

      window.removeEventListener('resize', positionSidenotes);
      window.removeEventListener('scroll', positionSidenotes, true);
      if (sidenoteContainer.parentNode) {
        sidenoteContainer.parentNode.removeChild(sidenoteContainer);
      }
      sidenoteCleanup = null;
    };
  }

  function unmountSidenotes() {
    if (sidenoteCleanup) {
      sidenoteCleanup();
      sidenoteCleanup = null;
    }
  }

  document.addEventListener("DOMContentLoaded", function() {
    setTimeout(handleFootnoteMode, 500);
    window.addEventListener('resize', handleFootnoteMode);
  });

})()
