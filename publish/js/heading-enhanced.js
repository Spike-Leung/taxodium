document.addEventListener("DOMContentLoaded", function () {
  function positionHeading(heading) {
    heading.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    history.pushState(null, null, '#' + heading.id);
  }

  document.querySelectorAll('h2[id], h3[id], h4[id], h5[id], h6[id]').forEach(heading => {
    heading.tabIndex = 0;

    heading.addEventListener('click', (e) => {
      if (e.target.nodeName === "A") return

      positionHeading(heading)
    });

    heading.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        positionHeading(heading)
      }
    });
  });
})
