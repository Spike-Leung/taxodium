document.addEventListener('DOMContentLoaded', function() {
  const mediaQuery = window.matchMedia("(width >= 1550px)");
  if (!mediaQuery.matches) return;

  const navLinks = document.querySelectorAll('#text-table-of-contents a[href^="#"]');

  const sections = [];
  navLinks.forEach(link => {
    const id = link.getAttribute('href').slice(1);
    const section = document.getElementById(`outline-container-${id}`);
    if (section) {
      sections.push({ id, section, link });
    }
  });

  if (sections.length === 0) return;

  const visibleSectionIds = new Set();
  let currentActiveId = null;
  let userSelectSectionId = null

  const observer = new IntersectionObserver((entries) => {
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

    let activeId = null;
    const scrollBottom = window.scrollY + window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    const isAtBottom = scrollBottom >= docHeight - 100;

    if (isAtBottom) {
      activeId = sections[sections.length - 1]?.id;
    }

    if (userSelectSectionId) {
      activeId = userSelectSectionId;
    }

    if (!activeId) {
      for (let i = sections.length - 1; i >= 0; i--) {
        const { id } = sections[i];
        if (visibleSectionIds.has(id)) {
          activeId = id;
          break;
        }
      }
    }

    if (activeId && activeId !== currentActiveId) {
      currentActiveId = activeId;

      navLinks.forEach(link => {
        link.classList.remove('active');
        const li = link.closest('li');
        if (li) li.classList.remove('active-parent');
      });

      const selector = `#text-table-of-contents a[href="#${CSS.escape(activeId)}"]`;
      const activeLinks = document.querySelectorAll(selector);

      activeLinks.forEach(link => {
        link.classList.add('active');

        let parent = link.parentElement;
        while (parent && parent.id !== 'text-table-of-contents') {
          if (parent.tagName === 'LI') {
            parent.classList.add('active-parent');
            const subUl = parent.querySelector('ul');
            if (subUl) subUl.style.display = 'block';
          }
          parent = parent.parentElement;
        }
      });
    }
  }, {
    root: null,
    rootMargin: '-10% 0px -55% 0px',
    threshold: 0
  });

  sections.forEach(({ section }) => observer.observe(section));

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollBottom = window.scrollY + window.innerHeight;
        if (scrollBottom >= document.documentElement.scrollHeight - 50) {
          const lastId = sections[sections.length - 1]?.id;
          if (lastId && lastId !== currentActiveId) {
            navLinks.forEach(link => {
              link.classList.remove('active');
              const li = link.closest('li');
              if (li) li.classList.remove('active-parent');
            });
            document.querySelectorAll(`a[href="#${CSS.escape(lastId)}"]`).forEach(link => {
              link.classList.add('active');
            });
            currentActiveId = lastId;
          }
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').slice(1);
      const targetSection = document.getElementById(`outline-container-${targetId}`);
      userSelectSectionId = targetId
      window.addEventListener('scrollend', () => {
        userSelectSectionId = null
      }, { once: true })
      if (targetSection) {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        targetSection.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      }
    });
  });
});
