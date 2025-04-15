import fs from 'fs';
import path from 'path';
import { parse } from 'node-html-parser';
import { fileURLToPath } from 'url';
import pLimit from 'p-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const CONFIG = {
  feedTitle: 'Taxodium',
  feedSubtitle: 'That the powerful play goes on, and you may contribute a verse. (Claim Folo feed: feedId:63132271001948160+userId:72185894417953792)',
  feedAuthor: 'Spike Leung',
  feedAuthorEmail: 'l-yanlei@hotmail.com',
  feedId: 'https://taxodium.ink/',
  feedLink: 'https://taxodium.ink/rss.xml',
  feedIcon: 'https://taxodium.ink/favicon.ico',
  feedUpdated: new Date().toISOString(),
  postsToInclude: 15,
  postsSource: path.join(__dirname, 'post/index.org'),
  postsDir: path.join(__dirname, 'publish'),
  outputFile: path.join(__dirname, 'publish/rss.xml'),
  // follows: [
  //   { feedId: '58021783497765889', userId: '72185894417953792' },
  //   { feedId: '63132271001948160', userId: '72185894417953792' }
  // ]
};

async function generateSummary(text) {
  if (!OPENROUTER_API_KEY) {
    console.warn('No OpenRouter API key set, skipping summary generation.');
    return '';
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4.1-nano',
        messages: [
          {
            role: 'system',
            content: `
            你是一名专业、细致且善于提炼关键信息的语言模型。你擅长阅读各种类型的文章，并用简洁明了的方式总结其主要观点、核心内容、重要细节。

            请根据输入的文章内容，生成一段简明扼要、流畅自然的摘要：

            - 摘要应直接提炼文章的核心内容和亮点，用简洁有吸引力的语言表达。
            - 摘要应适合作为文章的预览，能够激发读者的兴趣。
            - 如有必要，可适当保留文章的独特视角或新颖观点。

            返回格式需要注意：
            1. 中文和英文之间要有间隔，例如：这是 English 的拼写。
            2. 避免很长的段落，如果内容比较多，可以尝试一句话一行。
            3. 返回的格式不要用 markdown，用纯文本，每一段文字不要太长，适当换行。
            `
          },
          {
            role: 'user',
            content: `请阅读以下文章内容，并为我生成一份简明扼要的总结。\n\n${text}`
          }
        ],
        max_tokens: 500,
        temperature: 0.8
      })
    });

    const data = await response.json();
    console.log('>>>>>>>>>>>>>>>>> LLM RESPONSE <<<<<<<<<<<<<<<<<<')
    console.log(data)
    return data.choices?.[0]?.message?.content?.trim() || 'LLM 罢工啦，直接看原文吧 _​(:3 」∠)_​';
  } catch (error) {
    console.warn('Error generating summary:', error);
    return '';
  }
}

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

    // Remove all <iframe> elements
    contentDiv.querySelectorAll('iframe').forEach(el => el.remove());

    // Remove not allowed style attributes from all elements
    const notAllowedStyles = ['view-transition-name', 'word-break'];
    contentDiv.querySelectorAll('[style]').forEach(el => {
      const style = el.getAttribute('style');
      if (!style) return;
      // Remove all not allowed style properties, preserve others
      const newStyle = style
        .split(';')
        .map(s => s.trim())
        .filter(s => {
          return !notAllowedStyles.some(attr => new RegExp(`^${attr}\\s*:`).test(s));
        })
        .filter(Boolean)
        .join('; ');
      if (newStyle) {
        el.setAttribute('style', newStyle);
      } else {
        el.removeAttribute('style');
      }
    });

    // Remove navigation and other non-content elements
    const toRemove = contentDiv.querySelectorAll('nav, #preamble, #postamble');
    toRemove.forEach(el => el.remove());

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

    const contentHtml = contentDiv.toString();
    const plainText = contentDiv.textContent.trim().replace(/\s+/g, ' ').slice(0, 2000); // limit prompt size
    const summary  = await generateSummary(plainText)

    return {
      ...entry,
      content: contentHtml,
      updated: updatedDate,
      summary
    };
  } catch (error) {
    console.error(`Error processing ${entry.file}:`, error);
    return null;
  }
}

const ALL_CATEGORIES = [
  { term: 'blog', label: '博客' },
  { term: 'weekly', label: '周记' },
  { term: 'writing', label: '写作' },
  { term: 'emacs', label: 'Emacs' },
  { term: 'music', label: '音乐' },
  { term: 'frontend', label: '前端' }
];

function generateAtomFeed(entries) {
  const feedUpdated = new Date().toISOString();

  let feed = `<?xml version="1.0" encoding="utf-8"?>
<?xml-stylesheet href="/styles/pretty-feed-v3.xsl" type="text/xsl"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${CONFIG.feedTitle}</title>
  <subtitle>${CONFIG.feedSubtitle}</subtitle>
  <link href="${CONFIG.feedLink}" rel="self" type="application/atom+xml" />
  <link href="${CONFIG.feedId}" rel="alternate" type="text/html" />
  <id>${CONFIG.feedId.endsWith('/') ? CONFIG.feedId : CONFIG.feedId + '/'}</id>
  <icon>${CONFIG.feedIcon}</icon>
  <updated>${feedUpdated}</updated>
  <author>
    <name>${CONFIG.feedAuthor}</name>
    <email>${CONFIG.feedAuthorEmail}</email>
  </author>
  <generator uri="https://github.com/Spike-Leung/taxodium/blob/org-publish/feed.js">Taxodium Feed Generator</generator>
${ALL_CATEGORIES.map(cat => `  <category term="${cat.term}" label="${cat.label}" />`).join('\n')}
`;

  // for (const follow of CONFIG.follows) {
  //   feed += `  <follow_challenge>
  //   <feedId>${follow.feedId}</feedId>
  //   <userId>${follow.userId}</userId>
  // </follow_challenge>\n`;
  // }

  // Sort entries by date (newest first)
  entries.sort((a, b) => new Date(b.date) - new Date(a.date));

  for (const entry of entries) {
    if (!entry) continue;

    // Ensure URLs are properly encoded
    const entryUrl = `${CONFIG.feedId}/${encodeURI(entry.file)}`;

    feed += `  <entry>
    <title>${entry.title}</title>
    <link href="${entryUrl}" rel="alternate" type="text/html" />
    <id>${entryUrl}</id>
    <updated>${entry.updated}</updated>
    <published>${entry.date}</published>
    ${entry.summary ? `<summary><![CDATA[${entry.summary}]]></summary>` : ''}
    <content type="html" xml:lang="zh-CN" xml:base="${entryUrl}"><![CDATA[${entry.content}]]></content>
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
    const limit = pLimit(8);

    const limitedEntries = entries.slice(0, CONFIG.postsToInclude);

    const processingPromises = limitedEntries.map(entry =>
      limit(() => processPost(entry))
    );

    const processedResults = await Promise.all(processingPromises);

    const processedEntries = processedResults.filter(Boolean);

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

await generateFeed();
