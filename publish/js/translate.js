document.addEventListener("DOMContentLoaded", function () {
  document.querySelector('#kagi-translate').addEventListener('click', (e) => {
    window.open(`https://translate.kagi.com/${window.location.href}`, "_blank")
  });
})
