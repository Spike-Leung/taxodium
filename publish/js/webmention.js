async function loadWebmentionCount() {
  try {
    const target = location.href
    const response = await fetch(`https://webmention.io/api/count?target=${target}/page/100`)
    const { count } = response.json()
    document.querySelector('.webmention-count').innerText = `(${count})`
  } catch (err) {
    console.error(err)
  }
}

async function loadWebmentionContent() {
  try {
    const target = location.href
    const response = await fetch(`https://webmention.io/api/mentions.jf2?target=${target}/page/100`)
    const responseJson = response.json()
    console.log({ responseJson })
  } catch (err) {
    console.error(err)
  }
}

document.addEventListener("DOMContentLoaded", function() {
  loadWebmentionCount()
  loadWebmentionContent()
});
