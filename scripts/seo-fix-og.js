const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const compactExams = ['ap-edcet-2026', 'ap-lawcet-2026', 'ap-pecet-2026'];

compactExams.forEach(slug => {
  const file = path.join(ROOT, slug, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes('og:title')) return;

  const title = html.match(/<title>([^<]+)<\/title>/)?.[1] || slug;
  const desc = html.match(/<meta name="description"\s+content="([^"]+)"/)?.[1] || title;
  const url = `https://easyapplications.in/${slug}/`;
  const img = `https://easyapplications.in/${slug}-hero.png`;

  const og = `    <meta property="og:title" content="${title.replace(/"/g, '&quot;')}">\n    <meta property="og:description" content="${desc.replace(/"/g, '&quot;')}">\n    <meta property="og:url" content="${url}">\n    <meta name="twitter:card" content="summary_large_image">\n    <meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}">\n    <meta name="twitter:description" content="${desc.replace(/"/g, '&quot;')}">\n    <meta name="twitter:image" content="${img}">\n`;

  html = html.replace(/(<meta property="og:image"[^>]*>)/, `$1\n${og}`);
  fs.writeFileSync(file, html);
  console.log('OG fixed:', slug);
});

// search hreflang
const search = path.join(ROOT, 'search', 'index.html');
let sh = fs.readFileSync(search, 'utf8');
if (!sh.includes('hreflang')) {
  sh = sh.replace(
    /<link rel="canonical" href="https:\/\/easyapplications.in\/search\/">/,
    `<link rel="canonical" href="https://easyapplications.in/search/">\n    <link rel="alternate" hreflang="en-IN" href="https://easyapplications.in/search/">\n    <link rel="alternate" hreflang="en" href="https://easyapplications.in/search/">\n    <link rel="alternate" hreflang="x-default" href="https://easyapplications.in/search/">`
  );
  fs.writeFileSync(search, sh);
  console.log('Search hreflang fixed');
}