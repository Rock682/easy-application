const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const META = '<meta name="google-adsense-account" content="ca-pub-4594881398958191">';

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
  if (html.includes('google-adsense-account')) return;

  if (html.includes('<meta charset="UTF-8">')) {
    html = html.replace('<meta charset="UTF-8">', `<meta charset="UTF-8">\n    ${META}`);
  } else if (html.includes('<head>')) {
    html = html.replace('<head>', `<head>\n    ${META}`);
  } else return;

  fs.writeFileSync(file, html);
  console.log('Added AdSense meta:', path.relative(ROOT, file));
});

console.log('AdSense verification meta injection complete.');