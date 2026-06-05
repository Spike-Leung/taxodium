document.addEventListener("DOMContentLoaded", function() {
  const backToTopButton = document.createElement("button");
  backToTopButton.id = "back-to-top";
  backToTopButton.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" aria-label="返回頂部按钮">
  <path d="M203.3 116.7C200.2 113.6 196.1 112 192 112S183.8 113.6 180.7 116.7l-144 144c-6.25 6.25-6.25 16.38 0 22.62s16.38 6.25 22.62 0L176 166.6V464c0 8.844 7.156 16 16 16s16-7.156 16-16V166.6l116.7 116.7c6.25 6.25 16.38 6.25 22.62 0s6.25-16.38 0-22.62L203.3 116.7zM368 32h-352C7.156 32 0 39.16 0 48S7.156 64 16 64h352C376.8 64 384 56.84 384 48S376.8 32 368 32z"></path>
</svg>`;
  document.body.appendChild(backToTopButton);

  let idleTimer;
  window.addEventListener("scroll", () => {
    clearTimeout(idleTimer);
    if (window.scrollY > 500) {
      backToTopButton.classList.add("show");
      // On small screens, hide the button after 2 seconds of inactivity
      if (window.matchMedia("(max-width: 768px)").matches) {
        idleTimer = setTimeout(() => {
          backToTopButton.classList.remove("show");
        }, 1000);
      }
    } else {
      backToTopButton.classList.remove("show");
    }
  });

  backToTopButton.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
});
