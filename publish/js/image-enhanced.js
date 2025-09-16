document.addEventListener('DOMContentLoaded', () => {
  if (window.matchMedia('(min-width: 768px)').matches) {
    const images = document.querySelectorAll('#content img');

    images.forEach(img => {
      if (img.closest('a')) {
        return;
      }

      img.style.cursor = 'pointer';
      img.addEventListener('click', () => {
        window.open(img.src, '_self', 'noopener,noreferrer');
      });
    });
  }
});
