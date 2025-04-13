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

document.addEventListener("DOMContentLoaded", function() {
  // ===== 移除已存在的 sidenote =====
  document.querySelectorAll('.' + SIDENOTE_CLASS).forEach(el => el.remove());
  document.querySelectorAll('.' + SIDENOTE_CONTAINER_CLASS).forEach(el => el.remove());

  // ===== 创建 sidenote 容器 =====
  const content = document.querySelector('#content');
  if (!content) return;
  const sidenoteContainer = document.createElement('div');
  sidenoteContainer.className = SIDENOTE_CONTAINER_CLASS;
  content.appendChild(sidenoteContainer);

  // ===== 工具函数 =====

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
    let lastBottom = 0;
    refs.forEach(function(ref, idx) {
      const sidenote = sidenoteContainer.querySelector(`.${SIDENOTE_CLASS}[data-ref-index="${idx}"]`);
      if (!sidenote) return;
      // 先重置高度，避免内容变化导致高度不准
      sidenote.style.top = '0px';
      sidenote.style.right = '0';
      sidenote.style.left = 'auto';
      sidenote.style.position = 'absolute';
      // 计算目标 top
      const refParent = ref.parentElement;
      const rect = refParent.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();
      let top = rect.top - contentRect.top + content.scrollTop;
      // 避免重叠
      if (top < lastBottom + 8) { // 8px 间距
        top = lastBottom + 8;
      }
      sidenote.style.top = `${top}px`;
      // 更新 lastBottom
      lastBottom = top + sidenote.offsetHeight;
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
});
