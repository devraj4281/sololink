import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, 'src/components');

function replaceDeep(file) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const replacePatterns = [
    { from: /from\s+['"]\.\.\/store\//g, to: 'from "../../store/' },
    { from: /from\s+['"]\.\.\/hooks\//g, to: 'from "../../hooks/' },
    { from: /from\s+['"]\.\.\/lib\//g, to: 'from "../../lib/' },
    { from: /from\s+['"]\.\.\/utils\//g, to: 'from "../../lib/' },
    { from: /from\s+['"]\.\.\/\.\.\/utils\//g, to: 'from "../../lib/' } // in case it was already double relative
  ];

  replacePatterns.forEach(({from, to}) => {
    if (from.test(content)) {
      content = content.replace(from, to);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Updated imports in ${file}`);
  }
}

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      processDir(full);
    } else if (full.endsWith('.jsx') || full.endsWith('.js')) {
      replaceDeep(full);
    }
  }
}

processDir(srcDir);
