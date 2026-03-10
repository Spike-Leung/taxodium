import fs from "fs"
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LightThemeFilePath = path.join(__dirname, ".", "light.txt");
const DarkThemeFilePath = path.join(__dirname, ".", "dark.txt");
const OutputFilePath = path.join(__dirname, "..", "publish/styles/fontify-code.css");

function parseCSS(content) {
  const rules = {};
  // org- 对应的是 ox-html.el 中 `org-html-htmlize-font-prefix` 的值
  const ruleRegex = /\.org-[^{]+\{[^}]+\}/g;

  (content.match(ruleRegex) || []).forEach(rule => {
    const selector = rule.match(/(\.org-[\w-]+)/)[1];
    const block = rule.match(/\{([^}]+)\}/)[1];
    const props = {}, comments = {};
    let lastComment = null;

    block.split('\n').forEach(line => {
      line = line.trim();
      if (!line) return;
      if (line.startsWith('/*') && line.endsWith('*/')) {
        lastComment = line; return;
      }
      const m = line.match(/^([a-z-]+)\s*:\s*([^;]+)/);
      if (m) {
        props[m[1]] = m[2].trim();
      }
    });
    rules[selector] = { properties: props };
  });
  return rules;
}

function generate(light, dark) {
  const selectors = Array.from(new Set([...Object.keys(light), ...Object.keys(dark)])).sort();
  return selectors.map(sel => {
    const l = light[sel] || { properties: {} };
    const d = dark[sel] || { properties: {} };
    const props = [...new Set([...Object.keys(l.properties), ...Object.keys(d.properties)])];

    let block = `${sel}{`;

    props.forEach(prop => {
      const lv = l.properties[prop] || '', dv = d.properties[prop] || '';
      const isColor = /color|background|border|outline/.test(prop);

      if (isColor && lv && dv) {
        block += `${prop}:${lv};${prop}:light-dark(${lv},${dv});`;
      } else if (lv) {
        block += `${prop}:${lv};`;
      } else if (dv) {
        block += `${prop}:${dv};`;
      }
    });

    return block + '}';
  }).join('');
}

const light = parseCSS(fs.readFileSync(LightThemeFilePath, 'utf8'));
const dark = parseCSS(fs.readFileSync(DarkThemeFilePath, 'utf8'));
fs.writeFileSync(OutputFilePath, generate(light, dark));
console.log('Generated Finished');
