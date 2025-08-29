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
  // Sidenotes are hidden at max-width: 1600px
  return window.matchMedia('(min-width: 1921px)').matches;
}

function handleFootnoteMode() {
  if (isSidenoteVisible()) {
    // Sidenotes visible, unmount littlefoot, mount sidenotes
    unmountLittlefoot();
    mountSidenotes();
  } else {
    // Sidenotes hidden, unmount sidenotes, mount littlefoot
    unmountSidenotes();
    ensureLittlefootMounted();
  }
}

// ===== sidenote 生成/移除逻辑提取为函数 =====
let sidenoteCleanup = null;
function mountSidenotes() {
  if (sidenoteCleanup) return; // 已挂载
  // ===== 创建 sidenote 容器 =====
  const content = document.querySelector('#content');
  if (!content) return;
  // 移除已存在的 sidenote
  document.querySelectorAll('.' + SIDENOTE_CLASS).forEach(el => el.remove());
  document.querySelectorAll('.' + SIDENOTE_CONTAINER_CLASS).forEach(el => el.remove());

  const sidenoteContainer = document.createElement('div');
  sidenoteContainer.className = SIDENOTE_CONTAINER_CLASS;
  content.appendChild(sidenoteContainer);

  // 高亮/取消高亮正文脚注引用
  function highlightRef(refParent, highlight) {
    if (!refParent) return;
    if (highlight) {
      refParent.classList.add(SIDENOTE_REF_HIGHLIGHT_CLASS);
    } else {
      refParent.classList.remove(SIDENOTE_REF_HIGHLIGHT_CLASS);
    }
  }

  // 创建 sidenote 元素
  function createSidenote(ref, footnote, idx) {
    const refParent = ref.parentElement;
    const footnoteNumber = ref.textContent;

    // 若 refParent 没有 id，则分配唯一 id
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

  // ===== 收集所有脚注引用并创建 sidenote =====
  const refs = Array.from(document.querySelectorAll('sup > a.footref'));
  refs.forEach(function(ref, idx) {
    const href = ref.getAttribute('href');
    if (!href || !href.startsWith('#fn.')) return;
    const footnoteId = href.slice(1);
    const footnoteLink = document.getElementById(footnoteId);
    if (!footnoteLink) return;

    // 向上查找最近的 .footpara
    let footnote = null;
    let parent = footnoteLink.parentElement;
    while (parent && !footnote) {
      footnote = parent.querySelector('.footpara');
      parent = parent.parentElement;
    }
    if (!footnote) return;

    // 创建 sidenote 并添加到容器
    const sidenote = createSidenote(ref, footnote, idx);
    sidenoteContainer.appendChild(sidenote);
  });

  // ===== 定位 sidenote =====
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

      const padding = '3em';
      const sidenoteGap = 8;

      // 先重置高度，避免内容变化导致高度不准
      sidenote.style.top = '0px';
      sidenote.style.position = 'absolute';
      const refParent = ref.parentElement;
      const rect = refParent.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();
      let top = rect.top - contentRect.top + content.scrollTop;

      // 将 sidenote 分布到内容的两边
      if (idx % 2 === 0) {
        sidenote.style.left = '100%';
        sidenote.style.paddingInlineStart = padding;
      } else {
        sidenote.style.left = `${-1 * sidenote.getBoundingClientRect().width}px`;
        sidenote.style.paddingInlineEnd = padding;
        sidenote.style.justifyContent = 'flex-end';
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

  // 使 content 变为 relative，便于绝对定位
  content.style.position = 'relative';

  // ===== 初始定位 =====
  positionSidenotes();
  // 监听滚动和窗口变化
  window.addEventListener('resize', positionSidenotes);
  window.addEventListener('scroll', positionSidenotes, true);

  // 提供 cleanup 方法
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
