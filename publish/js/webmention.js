async function loadWebmentionCount() {
  try {
    const target = getTargetUrl();
    const response = await fetch(
      `https://webmention.io/api/count?target=${target}`,
    );
    const { count = 0 } = await response.json();
    document.querySelector(".webmention-count").innerText = `(${count})`;
  } catch (err) {
    console.error(err);
  }
}

async function loadWebmentionContent() {
  try {
    const target = getTargetUrl();
    const response = await fetch(
      `https://webmention.io/api/mentions.jf2?target=${target}`,
    );
    const feed = await response.json();
    const container = document.querySelector(".webmention-content-list");
    renderWebmentions(feed, container);
  } catch (err) {
    console.error(err);
  }
}

function getTargetUrl() {
  const { href, hostname, pathname } = location;

  if (hostname !== "taxodium.ink") {
    return `https://taxodium.ink${pathname}`;
  }

  return href;
}

function renderWebmentions(feed, container) {
  if (!feed || !Array.isArray(feed.children) || !container) return;

  const frag = document.createDocumentFragment();

  for (const entry of feed.children) {
    if (entry.type !== "entry") continue;
    if (entry["wm-private"] === true) continue;

    const li = document.createElement("li");

    // author info
    const divAuthor = document.createElement("div");
    divAuthor.className = "webmention-author-container"

    const { name, url, photo } = entry.author || {}

    const imgAvatar = document.createElement("img");
    imgAvatar.className = "webmention-avatar"
    imgAvatar.src = photo || "/images/common/no-profile-photo.png"

    const wmSourceUrl = new URL(entry["wm-source"])

    const aAuthor = document.createElement("a");
    aAuthor.href = url || wmSourceUrl.origin
    aAuthor.className = "webmention-author"
    aAuthor.textContent = name || "Unknown"

    const aHomeUrl = document.createElement("a");
    aHomeUrl.href = url || wmSourceUrl.origin
    aHomeUrl.className = "webmention-home-url"
    aHomeUrl.textContent = wmSourceUrl.host


    Array.from([imgAvatar, aAuthor, aHomeUrl]).forEach((child) => divAuthor.appendChild(child))

    // content
    const divContent = document.createElement("div");
    divContent.className = "webmention-content"
    divContent.innerHTML = he.escape(entry.content?.html) || ""

    // meta info
    const divMeta = document.createElement("div");
    divMeta.className = "webmention-meta"
    const aSource = document.createElement("a");
    const pReceived = document.createElement("p");

    aSource.href = wmSourceUrl.href
    aSource.textContent = "Source"

    pReceived.textContent = new Intl.DateTimeFormat("zh-CN", {
      dateStyle: "full",
      timeStyle: "long",
      timeZone: "Asia/Shanghai",
    }).format(new Date(entry["wm-received"]))
    pReceived.className = "webmention-date"

    Array.from([aSource, pReceived]).forEach((child) => divMeta.appendChild(child))
    Array.from([divAuthor, divContent, divMeta]).forEach((child) => li.appendChild(child))
    frag.appendChild(li);
  }

  container.appendChild(frag);
}

function initFormTargetUrl() {
  const target = getTargetUrl();
  document.querySelector(".webmention-container form input[name='target']").value = target;
}

document.addEventListener("DOMContentLoaded", function () {
  loadWebmentionCount();
  loadWebmentionContent();
  initFormTargetUrl();
});
