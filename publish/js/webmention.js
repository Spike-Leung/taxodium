(function () {
  const TargetQueries = ["ref=powrss.com"];
  const webmentionList = document.querySelector(".webmention__list")

  async function fetchWebmentionFeedList() {
    const target = getTargetUrl();
    const targetsWithQueries = TargetQueries.map((q) => `${target}?${q}`);
    const allTarget = [
      target,
      ...targetsWithQueries,
    ];
    const searchParams = allTarget
      .map((t) => `target[]=${encodeURIComponent(t)}`)
      .join("&");
    const response = await fetch(
      `https://webmention.io/api/mentions.jf2?${searchParams}`,
    );
    const feed = await response.json();

    return feed?.children || [];
  }

  function getTargetUrl() {
    let { origin, pathname } = location;

    if (origin !== "https://taxodium.ink") {
      origin = "https://taxodium.ink"
    }

    return origin + pathname;
  }

  function generateWebmenionItemHTMLFragments(entry) {
    const { name, photo } = entry.author || {};
    const wmSourceUrl = new URL(entry["wm-source"]);
    const authorName = name || wmSourceUrl.host || "Unknown";

    let avatar;

    if (photo) {
      avatar = document.createElement("img");
      avatar.className = "webmention__avatar";
      avatar.src = photo;
      avatar.loading = "lazy";
      avatar.alt = authorName;
    } else {
      avatar = document.createElement("span");
      avatar.className = "webmention__avatar";
      avatar.textContent = authorName[0].toUpperCase();
    }

    const aSource = document.createElement("a");
    aSource.href = wmSourceUrl.href;
    aSource.title = authorName;
    aSource.rel = "noopener noreferrer";
    aSource.appendChild(avatar);

    const li = document.createElement("li")
    li.appendChild(aSource)

    return li;
  }

  function renderWebmentions(feedList = []) {
    if (feedList.length === 0 || !webmentionList) return;

    const frag = document.createDocumentFragment();

    for (const entry of feedList) {
      if (entry.type !== "entry") continue;
      if (entry["wm-private"] === true) continue;

      const webmentionItem = generateWebmenionItemHTMLFragments(entry);
      frag.appendChild(webmentionItem);
    }

    webmentionList.appendChild(frag);
  }

  async function loadWebmentionContent() {
    try {
      webmentionList.setAttribute('aria-busy', 'true');
      const feedList = await fetchWebmentionFeedList();
      document.querySelector(".webmention__count").innerText =
        `(${feedList.length})`;
      renderWebmentions(feedList);
      webmentionList.setAttribute('aria-busy', 'false');
    } catch (err) {
      console.error(err);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    loadWebmentionContent();
  });
})();
