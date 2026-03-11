/**
 * Enhance <pre class="src"> code blocks:
 * 1. Add a copy button at the top-right to copy code.
 * 2. Enable auto-scroll when mouse is near the left/right edge.
 */
document.addEventListener("DOMContentLoaded", function () {
  // 1. Add copy button to each pre.src
  document.querySelectorAll("div.org-src-container").forEach(function (container) {
    const pre = container.querySelector("pre.src");
    if (!pre) return;

    // Create copy button
    const btn = document.createElement("button");
    btn.textContent = "Copy";
    btn.className = "code-copy-btn";

    // Copy code on click
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      const code = pre.textContent;
      navigator.clipboard.writeText(code).then(
        () => {
          btn.textContent = "Copied!";
          setTimeout(() => (btn.textContent = "Copy"), 1200);
        },
        () => {
          btn.textContent = "Failed";
          setTimeout(() => (btn.textContent = "Copy"), 1200);
        }
      );
    });

    // Insert button into container, after <pre>
    pre.insertAdjacentElement('afterend', btn);
  });



  // 2. Auto-scroll pre.src and pre.example when mouse is near left/right edge
  document.querySelectorAll("pre.src, pre.example").forEach(function (pre) {
    let scrollDirection = 0; // -1 for left, 1 for right, 0 for none
    let rafId = null;

    function smoothScroll() {
      if (scrollDirection !== 0) {
        pre.scrollLeft += scrollDirection * 5; // Adjust speed here
        rafId = requestAnimationFrame(smoothScroll);
      }
    }

    pre.addEventListener("mousemove", function (e) {
      const rect = pre.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const edgeSize = 15; // px

      if (x < edgeSize) {
        scrollDirection = -1;
        if (!rafId) smoothScroll();
      } else if (x > rect.width - edgeSize) {
        scrollDirection = 1;
        if (!rafId) smoothScroll();
      } else {
        scrollDirection = 0;
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }
    });

    pre.addEventListener("mouseleave", function () {
      scrollDirection = 0;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    });
  });

});
