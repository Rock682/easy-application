const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    if (['node_modules', 'scripts'].includes(f)) continue;
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (f.endsWith('.html')) files.push(p);
  }
  return files;
}

walk(ROOT).forEach(file => {
  let html = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (html.includes('<main') && !html.includes('role="main"')) {
    html = html.replace(/<main id="main-content"/, '<main id="main-content" role="main"');
    html = html.replace(/<main>/, '<main id="main-content" role="main">');
    changed = true;
  }

  // Replace material icon spans with accessible text/emoji
  html = html.replace(/<span class="material-icons-round[^"]*">([^<]*)<\/span>/g, '<span aria-hidden="true" class="icon-inline">$1</span>');
  html = html.replace(/<span class="material-icons-round[^"]*"><\/span>/g, '<span aria-hidden="true" class="icon-inline">•</span>');

  if (!html.includes('aria-live') && html.includes('ticker-wrap')) {
    html = html.replace(/class="ticker"/, 'class="ticker" aria-live="off"');
    changed = true;
  }

  if (changed) fs.writeFileSync(file, html);
  console.log('A11y:', path.relative(ROOT, file));
});