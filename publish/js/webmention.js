async function loadWebmentionCount() {
  try {
    const target = location.href
    const response = await fetch(`https://webmention.io/api/count?target=${target}`)
    const { count = 0 } = await response.json()
    document.querySelector('.webmention-count').innerText = `(${count})`
  } catch (err) {
    console.error(err)
  }
}

async function loadWebmentionContent() {
  try {
    const target = location.href
    const response = await fetch(`https://webmention.io/api/mentions.jf2?target=${target}`)
    const responseJson = await response.json()
    const container = document.querySelector('.webmention-content-list')
    renderWebmentions(feed, container)
  } catch (err) {
    console.error(err)
  }
}

function renderWebmentions(feed, container) {
  const CONTENT_MAX_LENGTH = 500;

  if (!feed || !Array.isArray(feed.children) || !container) return;

  const frag = document.createDocumentFragment();

  for (const entry of feed.children) {
    if (entry.type !== 'entry') continue;
    if (entry['wm-private'] === true) continue;

    const li = document.createElement('li');

    const pLink = document.createElement('p');
    const a = document.createElement('a');
    const author = entry.author && entry.author.name ? entry.author.name : 'Unknown';
    a.href = entry.url || entry['wm-source'] || '#';
    a.textContent = `${entry.name || a.href} | ${author}`;
    pLink.appendChild(a);

    li.appendChild(pLink);

    // blockquote
    const blockquote = document.createElement('blockquote');

    // content text
    const pContent = document.createElement('p');
    let contentText = '';
    if (entry.content) {
      if (typeof entry.content === 'string') {
        contentText = entry.content;
      } else {
        contentText = entry.content.text || '';
      }
    }
    pContent.textContent = contentText.slice(0, CONTENT_MAX_LENGTH);
    blockquote.appendChild(pContent);

    li.appendChild(blockquote);
    frag.appendChild(li);
  }

  container.appendChild(frag);
}

document.addEventListener("DOMContentLoaded", function() {
  loadWebmentionCount()
  loadWebmentionContent()
});
