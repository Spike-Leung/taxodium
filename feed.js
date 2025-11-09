import fs from "fs";
import path from "path";
import { parse } from "node-html-parser";
import { fileURLToPath } from "url";
import pLimit from "p-limit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const CONFIG = {
  feedTitle: "Taxodium",
  feedSubtitle:
  "That the powerful play goes on, and you may contribute a verse.",
  feedAuthor: "Spike Leung",
  feedAuthorEmail: "l-yanlei@hotmail.com",
  feedId: "https://taxodium.ink/",
  feedLink: "https://taxodium.ink/rss.xml",
  feedIcon: "https://taxodium.ink/favicon.ico",
  feedUpdated: new Date().toISOString(),
  postsToInclude: 15,
  tagsToGenerateFeeds: [
    { name: "zine", count: 10 },
    { name: "emacs", count: 10 },
    { name: "nichijou", count: 10 },
    { name: "album", count: 10 }
  ],
  postsSource: path.join(__dirname, "posts/index.org"),
  orgPostsDir: path.join(__dirname, "posts"),
  postsDir: path.join(__dirname, "publish"),
  outputFile: path.join(__dirname, "publish/rss.xml"),
  // follows: [
  //   { feedId: '58021783497765889', userId: '72185894417953792' },
  //   { feedId: '63132271001948160', userId: '72185894417953792' }
  // ]
};

async function generateSummary(text) {
  if (!OPENROUTER_API_KEY) {
    console.warn("No OpenRouter API key set, skipping summary generation.");
    return "";
  }

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: `请为以下博客文章撰写一段简洁的概述，要求：
1. **长度**：100-150字左右
2. **内容要点**：
   - 文章的核心主题或观点
   - 主要讨论的问题或解决方案
   - 关键结论或价值点
3. **语言风格**：清晰易懂，避免过多专业术语
4. **目标读者**：让读者快速了解文章是否符合他们的需求
5. **不要包含**：
   - "本文介绍了..."、"作者讨论了..." 等套话
   - 过于细节的技术实现
   - 个人化的评论

请直接输出概述内容，不需要其他解释。
请阅读以下文章内容，并为我生成一份简明扼要的总结。

\n\n${text}`,
            },
          ],
          temperature: 1,
        }),
      },
    );

    const data = await response.json();
    return (
      data.choices?.[0]?.message?.content?.trim() ||
        "LLM 罢工啦，直接看原文吧 _​(:3 」∠)_​"
    );
  } catch (error) {
    console.warn("Error generating summary:", error);
    return "";
  }
}

function parseDateString(dateStr) {
  // Handle formats like "2025-04-07 Mon" or "2025-04-07 Mon 15:09"
  const parts = dateStr.split(" ");
  const datePart = parts[0]; // Get YYYY-MM-DD

  // If time is included (HH:MM)
  let timePart = "00:00:00";
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

async function processPost(entry) {
  try {
    const filePath = path.join(CONFIG.postsDir, entry.file);
    const htmlContent = fs.readFileSync(filePath, "utf8");
    const root = parse(htmlContent);

    // Extract main content
    const contentDiv = root.querySelector("#content");
    if (!contentDiv) {
      console.warn(`No content div found in ${entry.file}`);
      return null;
    }

    // Remove all <iframe> elements
    contentDiv.querySelectorAll("iframe").forEach((el) => el.remove());

    // Remove not allowed style attributes from all elements
    const notAllowedStyles = ["view-transition-name", "word-break"];
    contentDiv.querySelectorAll("[style]").forEach((el) => {
      const style = el.getAttribute("style");
      if (!style) return;
      // Remove all not allowed style properties, preserve others
      const newStyle = style
            .split(";")
            .map((s) => s.trim())
            .filter((s) => {
              return !notAllowedStyles.some((attr) =>
                new RegExp(`^${attr}\\s*:`).test(s),
              );
            })
            .filter(Boolean)
            .join("; ");
      if (newStyle) {
        el.setAttribute("style", newStyle);
      } else {
        el.removeAttribute("style");
      }
    });

    // Remove navigation and other non-content elements
    const toRemove = contentDiv.querySelectorAll("nav, #preamble, #postamble");
    toRemove.forEach((el) => el.remove());

    // Extract and parse dates more reliably
    let updatedDate = entry.date;

    // Try to get Last Modified date if available
    const lastModifiedElements = root.querySelectorAll("p.date");
    for (const el of lastModifiedElements) {
      const text = el.textContent.trim();
      if (text.startsWith("Last Modified:")) {
        const dateStr = text.replace("Last Modified:", "").trim();
        const parsedDate = parseDateString(dateStr);
        if (parsedDate) {
          updatedDate = parsedDate;
          break;
        }
      }
    }

    const contentHtml = contentDiv.toString();
    const plainText = contentDiv.textContent
          .trim()
          .replace(/\s+/g, " ")
          .slice(0, 2000); // limit prompt size
    // const summary = await generateSummary(plainText)

    return {
      ...entry,
      content: contentHtml,
      updated: updatedDate,
      // summary,
    };
  } catch (error) {
    console.error(`Error processing ${entry.file}:`, error);
    return null;
  }
}

const ALL_CATEGORIES = [
  { term: "blog", label: "博客" },
  { term: "weekly", label: "周记" },
  { term: "writing", label: "写作" },
  { term: "emacs", label: "Emacs" },
  { term: "music", label: "音乐" },
  { term: "frontend", label: "前端" },
];

function generateAtomFeed(entries, feedConfig = CONFIG) {
  const feedUpdated = new Date().toISOString();

  let feed = `<?xml version="1.0" encoding="utf-8"?>
<?xml-stylesheet href="/styles/pretty-feed-v3.xsl" type="text/xsl"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${feedConfig.feedTitle}</title>
  <subtitle>${feedConfig.feedSubtitle || ""}</subtitle>
  <link href="${feedConfig.feedLink}" rel="self" type="application/atom+xml" />
  <link href="${feedConfig.feedId}" rel="alternate" type="text/html" />
  <id>${feedConfig.feedId.endsWith("/") ? feedConfig.feedId : feedConfig.feedId + "/"}</id>
  <icon>${feedConfig.feedIcon}</icon>
  <updated>${feedUpdated}</updated>
  <author>
    <name>${feedConfig.feedAuthor}</name>
    <email>${feedConfig.feedAuthorEmail}</email>
  </author>
  <generator uri="https://github.com/Spike-Leung/taxodium/blob/org-publish/feed.js">Taxodium Feed Generator</generator>
${ALL_CATEGORIES.map((cat) => `  <category term="${cat.term}" label="${cat.label}" />`).join("\n")}
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
    const entryUrl = `${CONFIG.feedId}${encodeURI(entry.file)}`;
    const subtitle = entry.subtitle ? `- ${entry.subtitle}` : ''

    feed += `  <entry>
    <title>${entry.title} ${subtitle}</title>
    <link href="${entryUrl}" rel="alternate" type="text/html" />
    <id>${entryUrl}</id>
    <updated>${entry.updated}</updated>
    <published>${entry.date}</published>
    ${entry.summary ? `<summary><![CDATA[${entry.summary}]]></summary>` : ""}
    <content type="html" xml:lang="zh-CN" xml:base="${entryUrl}"><![CDATA[${entry.content}]]></content>
  </entry>\n`;
  }

  feed += `</feed>`;
  return feed;
}

async function generateFeed() {
  try {
    const entries = parseOrgIndex();
    const limit = pLimit(8);
    const limitedEntries = entries.slice(0, CONFIG.postsToInclude);
    const processingPromises = limitedEntries.map((entry) =>
      limit(() => processPost(entry)),
    );

    const processedResults = await Promise.all(processingPromises);
    const processedEntries = processedResults.filter(Boolean);

    const feed = generateAtomFeed(processedEntries);

    fs.writeFileSync(CONFIG.outputFile, feed);
    console.log(
      `Feed generated with ${processedEntries.length} entries at ${CONFIG.outputFile}`,
    );
  } catch (error) {
    console.error("Error generating feed:", error);
    process.exit(1);
  }
}

function getEntryFromOrgFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found, skipping: ${filePath}`);
    return { entry: null, content: null };
  }

  const content = fs.readFileSync(filePath, "utf8");

  const filetagsMatch = content.match(/#\+filetags:\s*(.*)/);
  if (filetagsMatch && filetagsMatch[1].includes(":draft:")) {
    return { entry: null, content: content };
  }

  const titleMatch = content.match(/#\+title:\s*(.*)/);
  const subtitleMatch = content.match(/#\+subtitle:\s*(.*)/);
  const exportFileMatch = content.match(/#\+export_file_name:\s*(.*)/);
  const dateMatch = content.match(/#\+date:\s*\[([^\]]+)\]/);

  if (titleMatch && exportFileMatch && dateMatch) {
    const htmlFile = `${exportFileMatch[1].trim()}.html`;
    const date = parseDateString(dateMatch[1]);

    if (date) {
      const entry = {
        title: escapeUnsafeChar(titleMatch[1].trim()),
        subtitle: escapeUnsafeChar(subtitleMatch ? subtitleMatch[1].trim() : ""),
        file: htmlFile,
        date: date,
      };
      return { entry, content };
    } else {
      console.warn(`Skipping post with invalid date in ${path.basename(filePath)}`);
    }
  }

  return { entry: null, content: content };
}

function escapeUnsafeChar(unsafeChar) {
  return unsafeChar.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

function parseOrgIndex() {
  return findOrgFilesByTag('published', CONFIG.orgPostsDir)
}

function findOrgFilesByTag(tag, postsDir) {
  const entries = [];
  const files = fs.readdirSync(postsDir).sort((a, b) => {
    if (a === b) return 0
    if (a < b ) return 1
    return -1
  });

  for (const file of files) {
    if (path.extname(file) !== ".org" || file === "index.org") {
      continue;
    }

    const filePath = path.join(postsDir, file);
    const { entry, content } = getEntryFromOrgFile(filePath);

    if (entry && content) {
      const filetagsMatch = content.match(/#\+filetags:\s*(.*)/);
      if (filetagsMatch && filetagsMatch[1].includes(`:${tag}:`)) {
        entries.push(entry);
      }
    }
  }
  return entries;
}

async function generateTagFeeds() {
  if (!CONFIG.tagsToGenerateFeeds || CONFIG.tagsToGenerateFeeds.length === 0) {
    return;
  }
  console.log("--- Generating tag-specific feeds ---");
  const limit = pLimit(8);

  for (const tagConfig of CONFIG.tagsToGenerateFeeds) {
    const tag = tagConfig.name;
    const count = tagConfig.count;

    try {
      let entries = findOrgFilesByTag(tag, CONFIG.orgPostsDir);
      if (entries.length === 0) {
        console.log(
          `No posts found for tag: ${tag}. Skipping feed generation.`,
        );
        continue;
      }

      entries.sort((a, b) => new Date(b.date) - new Date(a.date));

      if (count > 0) {
        entries = entries.slice(0, count);
      }

      console.log(`Found ${entries.length} posts for tag: ${tag}`);

      const processingPromises = entries.map((entry) =>
        limit(() => processPost(entry)),
      );
      const processedResults = await Promise.all(processingPromises);
      const processedEntries = processedResults.filter(Boolean);

      const tagFeedConfig = {
        ...CONFIG,
        feedTitle: `${CONFIG.feedTitle} - Tag: ${tag}`,
        feedLink: `${CONFIG.feedId}${tag}.xml`,
        feedId: `${CONFIG.feedId}tags/${tag}/`,
        feedSubtitle: `Posts tagged with '${tag}'`,
      };
      const feed = generateAtomFeed(processedEntries, tagFeedConfig);

      const outputFile = path.join(CONFIG.postsDir, `${tag}.xml`);
      fs.writeFileSync(outputFile, feed);
      console.log(
        `Feed for tag '${tag}' generated with ${processedEntries.length} entries at ${outputFile}`,
      );
    } catch (error) {
      console.error(`Error generating feed for tag '${tag}':`, error);
    }
  }
}


async function main() {
  await generateFeed();
  await generateTagFeeds();
}

await main();
