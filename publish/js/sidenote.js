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

/**
 * Dynamically load a CSS file if not already loaded.
 */
function loadCSS(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Dynamically load a JS file if not already loaded, returns a Promise.
 */
function loadJS(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.type = 'application/javascript';
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

let littlefootInstance = null;
let littlefootLoaded = false;

async function ensureLittlefootMounted() {
  if (!littlefootLoaded) {
    loadCSS('https://unpkg.com/littlefoot/dist/littlefoot.css');
    await loadJS('https://unpkg.com/littlefoot/dist/littlefoot.js');
    littlefootLoaded = true;
  }
  if (!window.littlefoot) return;
  if (!littlefootInstance) {
    littlefootInstance = window.littlefoot.littlefoot({
      anchorPattern: /#(fn|footnote|note)[:\-\._\d]/gi,
      footnoteSelector: 'div',
      buttonTemplate: `<button
  aria-label="脚注 <% number %>"
  class="littlefoot__button"
  id="<% reference %>"
  title="查看脚注 <% number %>"
/>
  <% number %>
</button>`
    });
  }
}

function unmountLittlefoot() {
  if (littlefootInstance && littlefootInstance.unmount) {
    littlefootInstance.unmount();
    littlefootInstance = null;
  }
}

function isSidenoteVisible() {
  return window.matchMedia('(min-width: 1921px)').matches;
}

function handleFootnoteMode() {
  if (isSidenoteVisible()) {
    unmountLittlefoot();
    mountSidenotes();
  } else {
    unmountSidenotes();
    ensureLittlefootMounted();
  }
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

  function highlightRef(refParent, highlight) {
    if (!refParent) return;
    if (highlight) {
      refParent.classList.add(SIDENOTE_REF_HIGHLIGHT_CLASS);
    } else {
      refParent.classList.remove(SIDENOTE_REF_HIGHLIGHT_CLASS);
    }
  }

  function createSidenote(ref, footnote, idx) {
    const refParent = ref.parentElement; // sup element
    const footnoteNumber = ref.textContent;

    if (!refParent.id) {
      refParent.id = `sidenote-ref-${idx}`;
    }

    // 创建编号链接
    const noteLink = document.createElement('a');
    noteLink.href = `#${refParent.id || ''}`;
    noteLink.className = SIDENOTE_NUM_CLASS;
    noteLink.textContent = footnoteNumber;

    // hover 高亮正文脚注引用
    noteLink.addEventListener('mouseenter', function() {
      highlightRef(refParent, true);
    });
    noteLink.addEventListener('mouseleave', function() {
      highlightRef(refParent, false);
    });
    refParent.addEventListener('mouseenter', function() {
      const sidenoteLink = document.querySelector(`a.sidenote-num[href*=${refParent.id}]`)
      highlightRef(refParent, true);
      highlightRef(sidenoteLink, true);
    });
    refParent.addEventListener('mouseleave', function() {
      const sidenoteLink = document.querySelector(`a.sidenote-num[href*=${refParent.id}]`)
      highlightRef(refParent, false);
      highlightRef(sidenoteLink, false);
    });

    // 创建 sidenote
    const sidenote = document.createElement('div');
    sidenote.className = SIDENOTE_CLASS;
    sidenote.dataset.refIndex = idx;

    // 插入编号链接和内容
    sidenote.appendChild(noteLink);
    const contentSpan = document.createElement('span');
    contentSpan.className = SIDENOTE_CONTENT_CLASS;
    contentSpan.innerHTML = footnote.innerHTML;
    sidenote.appendChild(contentSpan);

    // 记录 ref 元素
    refParent.dataset.sidenoteIndex = idx;

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
      const prevSidenote = sidenoteContainer.querySelector(`.${SIDENOTE_CLASS}[data-ref-index="${idx - 2}"]`);

      if (!sidenote) return;

      // 如果是 details 内的 sidenote，为展开则不展示
      const detailsParent = ref.closest('details');
      if (detailsParent && !detailsParent.open) {
        sidenote.style.display = 'none';
        return;
      }
      sidenote.style.display = '';

      const padding = '1.5em';
      const sidenoteGap = 8;

      // 先重置高度，避免内容变化导致高度不准
      sidenote.style.top = '0px';
      sidenote.style.position = 'absolute';
      const refParent = ref.parentElement;
      const rect = refParent.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();
      let top = rect.top - contentRect.top + content.scrollTop;

      // 将 sidenote 分布到内容的两边
      if (idx % 2 === 1) {
        sidenote.style.paddingInlineStart = padding;
        sidenote.style.left = '100%';
      } else {
        sidenote.style.paddingInlineEnd = padding;
        sidenote.style.justifyContent = 'flex-end';
        sidenote.style.left = `${-1 * sidenote.getBoundingClientRect().width}px`;
      }

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

  sidenoteCleanup = function() {
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
  handleFootnoteMode();
  window.addEventListener('resize', handleFootnoteMode);
});
