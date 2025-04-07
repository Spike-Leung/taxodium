const fs = require('fs');
const path = require('path');
const { parse } = require('node-html-parser');

// Configuration
const CONFIG = {
  feedTitle: 'Taxodium',
  feedSubtitle: 'That the powerful play goes on, and you may contribute a verse',
  feedAuthor: 'Spike Leung',
  feedAuthorEmail: 'l-yanlei@hotmail.com',
  feedId: 'https://taxodium.ink',
  feedLink: 'https://taxodium.ink/atom.xml',
  feedUpdated: new Date().toISOString(),
  postsToInclude: 15,
  postsSource: path.join(__dirname, 'post/index.org'),
  postsDir: path.join(__dirname, 'publish'),
  outputFile: path.join(__dirname, 'publish/rss.xml')
};

function parseDateString(dateStr) {
  // Handle formats like "2025-04-07 Mon" or "2025-04-07 Mon 15:09"
  const parts = dateStr.split(' ');
  const datePart = parts[0]; // Get YYYY-MM-DD

  // If time is included (HH:MM)
  let timePart = '00:00:00';
  if (parts.length >= 3 && /^\d{2}:\d{2}$/.test(parts[2])) {
    timePart = `${parts[2]}:00`;
  }

  const date = new Date(`${datePart}T${timePart}Z`);

  // Validate date
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date string: ${dateStr}`);
    return null;
  }

  return date.toISOString();
}

function parseOrgIndex(orgContent) {
  const lines = orgContent.split('\n');
  const entries = [];

  for (const line of lines) {
    const match = line.match(/\[\[file:([^\]]+)\]\[([^\]]+)\]\]\s+<([^>]+)>/);
    if (match) {
      const [, file, title, dateStr] = match;
      const htmlFile = file.replace(/\.org$/, '.html');

      // Parse date
      const date = parseDateString(dateStr);
      if (!date) {
        console.warn(`Skipping invalid date for post: ${title}`);
        continue;
      }

      entries.push({
        title,
        file: htmlFile,
        date: date
      });
    }
  }

  return entries;
}

async function processPost(entry) {
  try {
    const filePath = path.join(CONFIG.postsDir, entry.file);
    const htmlContent = fs.readFileSync(filePath, 'utf8');
    const root = parse(htmlContent);

    // Extract main content
    const contentDiv = root.querySelector('#content');
    if (!contentDiv) {
      console.warn(`No content div found in ${entry.file}`);
      return null;
    }

    // Remove navigation and other non-content elements
    // const toRemove = contentDiv.querySelectorAll('nav, #preamble, #postamble');
    // toRemove.forEach(el => el.remove());

    // Extract and parse dates more reliably
    let updatedDate = entry.date;

    // Try to get Last Modified date if available
    const lastModifiedElements = root.querySelectorAll('p.date');
    for (const el of lastModifiedElements) {
      const text = el.textContent.trim();
      if (text.startsWith('Last Modified:')) {
        const dateStr = text.replace('Last Modified:', '').trim();
        const parsedDate = parseDateString(dateStr);
        if (parsedDate) {
          updatedDate = parsedDate;
          break;
        }
      }
    }

    return {
      ...entry,
      content: contentDiv.toString(),
      updated: updatedDate
    };
  } catch (error) {
    console.error(`Error processing ${entry.file}:`, error);
    return null;
  }
}

function generateAtomFeed(entries) {
  const feedUpdated = new Date().toISOString();

  let feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${CONFIG.feedTitle}</title>
  <subtitle>${CONFIG.feedSubtitle}</subtitle>
  <link href="${CONFIG.feedLink}" rel="self" />
  <link href="${CONFIG.feedId}" />
  <id>${CONFIG.feedId}</id>
  <updated>${feedUpdated}</updated>
  <author>
    <name>${CONFIG.feedAuthor}</name>
    <email>${CONFIG.feedAuthorEmail}</email>
  </author>
  <follow_challenge>
    <feedId>58021783497765889</feedId>
    <userId>72185894417953792</userId>
  </follow_challenge>
  <follow_challenge>
    <feedId>63132271001948160</feedId>
    <userId>72185894417953792</userId>
  </follow_challenge>
\n`;

  // Sort entries by date (newest first)
  entries.sort((a, b) => new Date(b.updated) - new Date(a.updated));

  for (const entry of entries) {
    if (!entry) continue;

    // Ensure URLs are properly encoded
    const entryUrl = `${CONFIG.feedId}/${encodeURI(entry.file)}`;

    feed += `  <entry>
    <title>${entry.title}</title>
    <link href="${entryUrl}" />
    <id>${entryUrl}</id>
    <updated>${entry.updated}</updated>
    <published>${entry.date}</published>
    <content type="html"><![CDATA[${entry.content}]]></content>
  </entry>\n`;
  }

  feed += `</feed>`;
  return feed;
}

async function generateFeed() {
  try {
    // 1. Read and parse the index file
    const indexContent = fs.readFileSync(CONFIG.postsSource, 'utf8');

    // 2. Extract post links
    const entries = parseOrgIndex(indexContent);

    // 3. Get content for each post
    const processedEntries = [];
    for (const entry of entries.slice(0, CONFIG.postsToInclude)) {
      const processed = await processPost(entry);
      if (processed) {
        processedEntries.push(processed);
      }
    }

    // 4. Generate Atom XML
    const feed = generateAtomFeed(processedEntries);

    // 5. Save output
    fs.writeFileSync(CONFIG.outputFile, feed);
    console.log(`Feed generated with ${processedEntries.length} entries at ${CONFIG.outputFile}`);
  } catch (error) {
    console.error('Error generating feed:', error);
    process.exit(1);
  }
}

generateFeed();
