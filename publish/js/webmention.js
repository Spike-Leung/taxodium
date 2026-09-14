(function () {
  const TargetFragments = {
    'https://taxodium.ink/43.html': ['#82F4E24E-345E-48C9-9A3B-567A81BC40A0']
  }
  const TargetQueries = ['ref=powrss.com']

  async function loadWebmentionContent() {
    try {
      const target = getTargetUrl();
      const targetUrl = new URL(target)
      const baseTarget = `${targetUrl.origin}${targetUrl.pathname}`
      const targetsWithFragments = TargetFragments[target] ? TargetFragments[target].map((hash) => `${target}${hash}`) : []
      const targetsWithQueries = TargetQueries.map((q) => `${target}?${q}`)
      const allTarget = [baseTarget, target, ...targetsWithFragments, ...targetsWithQueries];
      const searchParams = allTarget.map((t) => `target[]=${encodeURIComponent(t)}`).join("&")
      const response = await fetch(`https://webmention.io/api/mentions.jf2?${searchParams}`,);
      const feed = await response.json();
      const feedList = feed?.children?.filter((c) => c["wm-target"].indexOf(baseTarget) !== -1)
      document.querySelector(".webmention__count").innerText = `(${feedList.length})`;
      const container = document.querySelector(".webmention__list");
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
      li.className = "webmention__item"

      // author info
      const divProfile = document.createElement("div");
      divProfile.className = "webmention__profile"

      const { name, url, photo } = entry.author || {}

      const imgAvatar = document.createElement("img");
      imgAvatar.className = "webmention__avatar"
      imgAvatar.src = photo || "/images/common/no-profile-photo.png"

      const wmSourceUrl = new URL(entry["wm-source"])

      const aAuthor = document.createElement("a");
      aAuthor.href = url || wmSourceUrl.origin
      aAuthor.className = "webmention__author"
      aAuthor.textContent = name || wmSourceUrl.host || "Unknown"

      let textFragments = ''
      let quotes
      if (entry.content && entry.content.html) {
        const match = entry.content.html.match(/(.{2})<a.*href=.*taxodium.ink[^>]*>([^<]*)<\/a>(.{2})/)
        if (match && match[1]) {
          const [prefixText, matchText, suffixText] = match.slice(1)
          const originalText = entry.content.text
          const index = originalText.indexOf(prefixText + matchText + suffixText)

          if (index !== -1) {
            const matchTextIndex = index + prefixText.length
            const offset = 100
            const contextBefore = originalText.slice(Math.max(0, matchTextIndex - offset), matchTextIndex)
            const contextAfter = originalText.slice(matchTextIndex + matchText.length, Math.min(matchTextIndex + matchText.length + offset, originalText.length))
            quotes = `[...]${contextBefore}<mark>${matchText}</mark>${contextAfter}[...]`

            // @see: https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment/Text_fragments#syntax
            const fragments = `${encodeURIComponent(prefixText)}-,${encodeURIComponent(matchText)}`
            textFragments = `#:~:text=${fragments}`
          }
        }
      }

      // fallback to full content
      if (!quotes) {
        quotes = entry?.content?.html || entry?.content?.text
      }

      const aSource = document.createElement("a");
      aSource.href = wmSourceUrl.href + textFragments
      aSource.textContent = entry.name || wmSourceUrl.href
      aSource.rel = "noopener"

      const pSource = document.createElement("p")
      pSource.className ="webmention__source"
      pSource.innerText = "原文："
      pSource.appendChild(aSource)

      Array.from([imgAvatar, aAuthor, pSource]).forEach((child) => divProfile.appendChild(child))

      // content
      const divContent = document.createElement("blockquote");
      divContent.className = "webmention__content"
      divContent.innerHTML = DOMPurify.sanitize(quotes) || ""

      const pReceivedDate = document.createElement("p");
      pReceivedDate.textContent = new Intl.DateTimeFormat("zh-CN", {
        dateStyle: "full",
        timeStyle: "long",
        timeZone: "Asia/Shanghai",
      }).format(new Date(entry["wm-received"]))
      pReceivedDate.className = "webmention__date"

      Array.from([divProfile, divContent, pReceivedDate]).forEach((child) => li.appendChild(child))
      frag.appendChild(li);
    }

    container.appendChild(frag);
  }

  function initFormTargetUrl() {
    const target = getTargetUrl();
    document.querySelector(".webmention form input[name='target']").value = target;
  }

  document.addEventListener("DOMContentLoaded", function () {
    loadWebmentionContent();
    initFormTargetUrl();
  });

})();
