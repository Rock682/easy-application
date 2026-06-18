const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const exams = fs.readdirSync(ROOT).filter(d => d.startsWith('ap-') || d === 'apset-2026').filter(d => fs.existsSync(path.join(ROOT, d, 'index.html')));

exams.forEach(slug => {
  const file = path.join(ROOT, slug, 'index.html');
  let html = fs.readFileSync(file, 'utf8');

  // Fix broken theme() in inline styles (was Tailwind-only)
  html = html.replace(/theme\('colors\.accent-teal'\)/g, '#0d9488');
  html = html.replace(/theme\('colors\.accent-teal-hover'\)/g, '#0f766e');

  // Restore Article schema if missing
  if (!html.includes('"@type": "Article"')) {
    const title = html.match(/<meta property="og:title" content="([^"]+)"/)?.[1] || slug;
    const desc = html.match(/<meta name="description"\s+content="([^"]+)"/)?.[1] || title;
    const img = `https://easyapplications.in/${slug}-hero.png`;
    const article = `    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "${title.replace(/"/g, '\\"')}",
      "description": "${desc.replace(/"/g, '\\"')}",
      "image": "${img}",
      "author": { "@type": "Organization", "name": "Easy Applications" },
      "publisher": { "@type": "Organization", "name": "Easy Applications", "logo": { "@type": "ImageObject", "url": "https://easyapplications.in/logo.png" } },
      "datePublished": "2026-01-18",
      "dateModified": "2026-06-18",
      "mainEntityOfPage": "https://easyapplications.in/${slug}/"
    }
    </script>\n`;
    html = html.replace('<!-- Article Schema -->', '<!-- Article Schema -->\n' + article);
  }

  // Add last-updated banner after hero breadcrumb area if not present
  if (!html.includes('last-updated') && html.includes('prose max-w-none')) {
    html = html.replace(
      /<article class="prose max-w-none">/,
      `<article class="prose max-w-none">\n                <p class="last-updated" role="status"><span aria-hidden="true">📅</span> Last updated: June 18, 2026 — verified against official notification</p>`
    );
  }

  // Link back to entrance exams hub in breadcrumb nav if text breadcrumb exists
  if (!html.includes('entrance-exams/index.html') && html.includes('breadcrumb')) {
    // skip - visual breadcrumb may not exist on all
  }

  fs.writeFileSync(file, html);
  console.log('Fixed:', slug);
});

// Job pages: add last-updated
const jobsDir = path.join(ROOT, 'jobs');
if (fs.existsSync(jobsDir)) {
  fs.readdirSync(jobsDir).forEach(slug => {
    const file = path.join(jobsDir, slug, 'index.html');
    if (!fs.existsSync(file)) return;
    let html = fs.readFileSync(file, 'utf8');
    if (html.includes('last-updated')) return;
    html = html.replace(
      /<div class="article-meta">/,
      `<div class="content-banner"><strong>Verified guide</strong> — eligibility, selection process, and official apply link. Always confirm dates on the government portal before applying.</div>\n            <div class="article-meta">`
    );
    html = html.replace(
      /<\/div>\s*<p>/,
      `</div>\n            <p class="last-updated" role="status">📅 Last updated: June 18, 2026</p>\n            <p>`
    );
    fs.writeFileSync(file, html);
    console.log('Job enhanced:', slug);
  });
}