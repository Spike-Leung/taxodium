document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll('h2[id], h3[id], h4[id], h5[id], h6[id]').forEach(heading => {
    heading.addEventListener('click', (e) => {
      // click on ::before
      if (e.offsetX < 0) {
        location.hash = heading.id;
      }
    });
  });
})
