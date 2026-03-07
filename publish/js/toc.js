document.addEventListener('DOMContentLoaded', function() {
  const navLinks = document.querySelectorAll('#text-table-of-contents a[href^="#"]');

  const sections = Array.from(navLinks).map(link => {
    const id = link.getAttribute('href').slice(1);
    return document.getElementById(`outline-container-${id}`);
  }).filter(Boolean);

  // 追踪当前所有可见的 section IDs
  const visibleSectionIds = new Set();

  const observerOptions = {
    root: null,
    // 调整：顶部 -10% 让触发提前，底部 20% 让 section 更晚才被视为不可见
    rootMargin: '-10% 0px 20% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    // 更新可见 section 集合
    entries.forEach(entry => {
      const match = entry.target.id.match(/outline-container-(.*)/);
      if (!match) return;
      const id = match[1];

      if (entry.isIntersecting) {
        visibleSectionIds.add(id);
      } else {
        visibleSectionIds.delete(id);
      }
    });

    // 在 sections 数组（文档顺序）中找到第一个可见的 section
    // 这样向上滚动时，上方的 section 会优先被高亮
    let activeId = null;
    for (const section of sections) {
      const match = section.id.match(/outline-container-(.*)/);
      if (!match) continue;
      const id = match[1];

      if (visibleSectionIds.has(id)) {
        activeId = id;
        break; // 找到文档顺序中最靠前的可见 section
      }
    }

    // 更新高亮
    if (activeId) {
      navLinks.forEach(link => link.classList.remove('active'));
      const activeLink = document.querySelector(`a[href="#${CSS.escape(activeId)}"]`);
      if (activeLink) {
        activeLink.classList.add('active');
      }
    }
  }, observerOptions);

  sections.forEach(section => observer.observe(section));

  // 平滑滚动
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').slice(1);
      const targetSection = document.getElementById(`outline-container-${targetId}`);

      if (targetSection) {
        targetSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});
