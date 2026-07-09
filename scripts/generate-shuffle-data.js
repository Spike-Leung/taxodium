import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG = {
  orgPostsDir: path.join(__dirname, "..", "posts"),
  postsDir: path.join(__dirname, "..", "publish"),
  outputFile: path.join(__dirname, "..", "publish/shuffle.data.json"),
};

function generateShuffleData() {
  try {
    const pageUrls = parseOrgIndex()
      .filter(Boolean)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    fs.writeFileSync(CONFIG.outputFile, JSON.stringify(pageUrls, null, 2));
    console.log(
      `Shuffle data generated finish.`,
    );
  } catch (error) {
    console.error("Error generating shuffle data:", error);
    process.exit(1);
  }
}

function parseOrgIndex() {
  return getPageUrlsByTag("published", CONFIG.orgPostsDir);
}

function getPageUrlsByTag(tag, postsDir) {
  const pageUrls = [];
  const files = fs.readdirSync(postsDir).sort((a, b) => {
    if (a === b) return 0;
    if (a < b) return 1;
    return -1;
  });

  for (const file of files) {
    if (path.extname(file) !== ".org" || file === "index.org") {
      continue;
    }

    const filePath = path.join(postsDir, file);
    const pageUrl = getPageUrlFromOrgFile(tag, filePath);
    pageUrls.push(pageUrl);
  }
  return pageUrls;
}

function getPageUrlFromOrgFile(tag, filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found, skipping: ${filePath}`);
    return null;
  }

  const content = fs.readFileSync(filePath, "utf8");

  const filetagsMatch = content.match(/#\+filetags:\s*(.*)/);
  const exportFileMatch = content.match(/#\+export_file_name:\s*(.*)/);
  if (filetagsMatch && filetagsMatch[1].includes(":draft:")) {
    return null;
  }

  if (filetagsMatch && filetagsMatch[1].includes(`:${tag}:`) && exportFileMatch) {
     return `${exportFileMatch[1].trim()}.html`;
  }

  return null;
}

generateShuffleData();
