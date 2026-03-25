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
      `https://webmention.io/api/mentions.jf2?domain=taxodium.ink&token=qcwPCX61g9khbvZWp3U0qg`,
    );
    const feed = await response.json();
    const feedList = feed?.children?.filter((c) => c["wm-target"].indexOf(target) !== -1)
    document.querySelector(".webmention-count").innerText = `(${feedList.length})`;
    const container = document.querySelector(".webmention-content-list");
    renderWebmentions(feedList, container);
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

function renderWebmentions(feedList = [], container) {
  if (feedList.length === 0 || !container) return;

  const frag = document.createDocumentFragment();

  for (const entry of feedList) {
    if (entry.type !== "entry") continue;
    if (entry["wm-private"] === true) continue;

    const li = document.createElement("li");
    li.className = "webmention-card"

    // author info
    const divAuthorContainer = document.createElement("div");
    divAuthorContainer.className = "webmention-author-container"
    const divSourceInfo = document.createElement("div");
    divSourceInfo.className = "webmention-source-info"

    const { name, url, photo } = entry.author || {}

    const imgAvatar = document.createElement("img");
    imgAvatar.className = "webmention-avatar"
    imgAvatar.src = photo || "/images/common/no-profile-photo.png"

    const wmSourceUrl = new URL(entry["wm-source"])

    const aAuthor = document.createElement("a");
    aAuthor.href = url || wmSourceUrl.origin
    aAuthor.className = "webmention-author"
    aAuthor.textContent = name || wmSourceUrl.host || "Unknown"

    let textFragments = ''
    let quotes
    if (entry.content && entry.content.html) {
      const match = entry.content.html.match(/<a.*href=.*taxodium.ink[^>]*>([^<]*)<\/a>/)
      if (match && match[1]) {
        const matchText = match[1].trim()
        const originalText = entry.content.text
        const index = originalText.indexOf(matchText)

        if (index !== -1) {
          const offset = 100
          const contextBefore = originalText.slice(Math.max(0, index - offset), index)
          const contextAfter = originalText.slice(index + matchText.length, Math.min(index + matchText.length + offset, originalText.length))
          quotes = `[...]${contextBefore}<mark>${matchText}</mark>${contextAfter}[...]`
          const encodedMatch = encodeURIComponent(matchText)

          textFragments = `#:~:text=${encodedMatch}`
        }
      }
    }

    // fallback to full content
    if (!quotes) {
      quotes = entry?.content?.html || entry?.content?.text
    }

    const aSource = document.createElement("a");
    aSource.href = wmSourceUrl.href + textFragments
    aSource.className = "webmention-source-url"
    aSource.textContent = entry.name || wmSourceUrl.href
    aSource.rel = "noopener"

    const pSourceContainer = document.createElement("p")
    pSourceContainer.className ="webmention-source"
    pSourceContainer.innerText = "原文："
    pSourceContainer.appendChild(aSource)

    Array.from([aAuthor, pSourceContainer]).forEach((child) => divSourceInfo.appendChild(child))

    Array.from([imgAvatar, divSourceInfo]).forEach((child) => divAuthorContainer.appendChild(child))

    // content
    const divContent = document.createElement("blockquote");
    divContent.className = "webmention-content"
    divContent.innerHTML = DOMPurify.sanitize(quotes) || ""

    // meta info
    const divMeta = document.createElement("div");
    divMeta.className = "webmention-meta"

    const pReceived = document.createElement("p");

    pReceived.textContent = new Intl.DateTimeFormat("zh-CN", {
      dateStyle: "full",
      timeStyle: "long",
      timeZone: "Asia/Shanghai",
    }).format(new Date(entry["wm-received"]))
    pReceived.className = "webmention-date"

    Array.from([pReceived]).forEach((child) => divMeta.appendChild(child))
    Array.from([divAuthorContainer, divContent, divMeta]).forEach((child) => li.appendChild(child))
    frag.appendChild(li);
  }

  container.appendChild(frag);
}

function initFormTargetUrl() {
  const target = getTargetUrl();
  document.querySelector(".webmention-container form input[name='target']").value = target;
}

document.addEventListener("DOMContentLoaded", function () {
  // loadWebmentionCount();
  loadWebmentionContent();
  initFormTargetUrl();
});
