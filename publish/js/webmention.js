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
  const CONTENT_MAX_LENGTH = 500;

  if (!feed || !Array.isArray(feed.children) || !container) return;

  const frag = document.createDocumentFragment();

  for (const entry of feed.children) {
    if (entry.type !== "entry") continue;
    if (entry["wm-private"] === true) continue;

    const li = document.createElement("li");

    const pLink = document.createElement("p");
    const a = document.createElement("a");
    const author =
      entry.author && entry.author.name ? entry.author.name : "Unknown";
    a.href = entry.url || entry["wm-source"] || "#";
    a.textContent = `${entry.name || a.href} | ${author}`;
    pLink.appendChild(a);

    const pDate = document.createElement("p");
    pDate.className = "webmention-date";
    const wmReceived = new Date(entry["wm-received"]);
    const parts = new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(wmReceived);
    const y = parts.find((p) => p.type === "year").value;
    const m = parts.find((p) => p.type === "month").value;
    const day = parts.find((p) => p.type === "day").value;
    pDate.textContent = `${y}-${m}-${day}`;

    const blockquote = document.createElement("blockquote");
    const pContent = document.createElement("p");
    let contentText = "";
    if (entry.content) {
      if (typeof entry.content === "string") {
        contentText = entry.content;
      } else {
        contentText = entry.content.text || "";
      }
    }

    if (contentText.length > CONTENT_MAX_LENGTH) {
      contentText = contentText.slice(0, CONTENT_MAX_LENGTH);
      contentText += "[...]";
    }

    pContent.textContent = contentText;
    blockquote.appendChild(pContent);

    li.appendChild(pLink);
    li.appendChild(pDate);
    li.appendChild(blockquote);
    frag.appendChild(li);
  }

  container.appendChild(frag);
}

document.addEventListener("DOMContentLoaded", function () {
  loadWebmentionCount();
  loadWebmentionContent();
});
