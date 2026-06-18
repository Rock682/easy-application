const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const AD_SLOT = {
  homeTop: `<aside class="ad-slot ad-slot--responsive" data-ad-key="HOME_TOP" data-ad-format="auto" aria-label="Advertisement">
            <p class="ad-label">Advertisement</p>
            <div class="ad-container"></div>
        </aside>`,
  homeMid: `<aside class="ad-slot ad-slot--infeed" data-ad-key="HOME_MID" data-ad-format="auto" aria-label="Advertisement">
            <p class="ad-label">Advertisement</p>
            <div class="ad-container"></div>
        </aside>`,
  articleTop: `<aside class="ad-slot ad-slot--responsive" data-ad-key="ARTICLE_TOP" data-ad-format="auto" aria-label="Advertisement">
            <p class="ad-label">Advertisement</p>
            <div class="ad-container"></div>
        </aside>`,
  articleMid: `<aside class="ad-slot ad-slot--infeed" data-ad-key="ARTICLE_MID" data-ad-format="auto" aria-label="Advertisement">
            <p class="ad-label">Advertisement</p>
            <div class="ad-container"></div>
        </aside>`,
  listMid: `<aside class="ad-slot ad-slot--responsive" data-ad-key="LIST_MID" data-ad-format="auto" aria-label="Advertisement">
            <p class="ad-label">Advertisement</p>
            <div class="ad-container"></div>
        </aside>`,
};

function depth(file) {
  return path.relative(ROOT, file).split(path.sep).length - 1;
}

function prefix(d) {
  return d === 0 ? '' : '../'.repeat(d);
}

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    if (['node_modules', 'scripts'].includes(f)) continue;
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (f.endsWith('.html')) files.push(p);
  }
  return files;
}

function patchFooter(html, p) {
  const hasPrivacy = html.includes('privacy/index.html') || html.includes('href="../privacy/');
  const hasTerms = html.includes('terms/index.html') || html.includes('href="../terms/');
  if (hasPrivacy && hasTerms) return html;

  const legal = `<a href="${p}privacy/index.html">Privacy Policy</a> · <a href="${p}terms/index.html">Terms</a>`;

  if (html.includes('footer-bottom')) {
    return html.replace(
      /(<p>&copy; 2026 Easy Applications\.)([\s\S]*?)(<\/p>)/,
      (m, start, mid, end) => {
        if (mid.includes('Privacy Policy')) return m;
        const home = mid.includes('Back to Home')
          ? mid.replace(/<a[^>]*>.*?Home.*?<\/a>/, `<a href="${p}index.html" style="color:#94a3b8;">Home</a>`)
          : ` <a href="${p}index.html" style="color:#94a3b8;">Home</a>`;
        return `${start} ${legal} ·${home}${end}`;
      }
    );
  }

  return html.replace(
    /(<h5>Company<\/h5>\s*<ul>[\s\S]*?<li><a href="[^"]*contact\/index\.html">Contact<\/a><\/li>)/,
    `$1\n                    <li><a href="${p}privacy/index.html">Privacy Policy</a></li>\n                    <li><a href="${p}terms/index.html">Terms of Use</a></li>`
  );
}

walk(ROOT).forEach(file => {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (rel === '404.html') return;
  const isLegalPage = rel.startsWith('privacy/') || rel.startsWith('terms/');

  let html = fs.readFileSync(file, 'utf8');
  const d = depth(file);
  const p = prefix(d);
  let changed = false;

  if (!html.includes('ads.css')) {
    html = html.replace(
      /(<link rel="stylesheet" href="[^"]*theme\.css">)/,
      `$1\n    <link rel="stylesheet" href="${p}css/ads.css">`
    );
    changed = true;
  }

  if (!html.includes('ads-config.js')) {
    html = html.replace(
      /(<script src="[^"]*site\.js" defer><\/script>)/,
      `$1\n    <script src="${p}js/ads-config.js" defer></script>\n    <script src="${p}js/ads.js" defer></script>`
    );
    if (!html.includes('ads-config.js')) {
      html = html.replace('</body>', `    <script src="${p}js/ads-config.js" defer></script>\n    <script src="${p}js/ads.js" defer></script>\n</body>`);
    }
    changed = true;
  }

  const needsSlots = !isLegalPage && !html.includes('ad-slot');

  // Homepage
  if (needsSlots && rel === 'index.html') {
    html = html.replace(
      '</section>\n\n        <div class="trending-banner">',
      `</section>\n\n        ${AD_SLOT.homeTop}\n\n        <div class="trending-banner">`
    );
    html = html.replace(
      /            <\/div>\n        <\/section>\n\n        <section aria-label="Recent updates">/,
      `            </div>\n        </section>\n\n        ${AD_SLOT.homeMid}\n\n        <section aria-label="Recent updates">`
    );
    changed = true;
  }
  // Job pages
  else if (needsSlots && (rel.startsWith('jobs/') || rel.startsWith('jobs\\'))) {
    html = html.replace(
      /<p class="last-updated"[^>]*>[^<]*<\/p>\s*<p>/,
      m => m.replace('<p>', `${AD_SLOT.articleTop}\n            <p>`)
    );
    html = html.replace(/<h2>Selection Process<\/h2>/, `${AD_SLOT.articleMid}\n            <h2>Selection Process</h2>`);
    changed = true;
  }
  // Exam pages (ap-*-2026 folders, apset)
  else if (needsSlots && !rel.startsWith('ap-state-jobs/') && (/^ap-[a-z]+-20\d{2}\//.test(rel) || rel.startsWith('apset-'))) {
    if (html.includes('last-updated')) {
      html = html.replace(
        /<p class="last-updated"[^>]*>[\s\S]*?<\/p>/,
        m => m + '\n                ' + AD_SLOT.articleTop.replace(/\n/g, '\n                ')
      );
    } else if (html.includes('prose max-w-none')) {
      html = html.replace(
        /<article class="prose max-w-none">/,
        `<article class="prose max-w-none">\n                ${AD_SLOT.articleTop.replace(/\n/g, '\n                ')}`
      );
    }
    html = html.replace(/<h2 id="eligibility"/, `${AD_SLOT.articleMid.replace(/\n/g, '\n                ')}\n                <h2 id="eligibility"`);
    if (!html.includes('ad-slot')) {
      html = html.replace(/<h2 id="dates"/, `${AD_SLOT.articleTop.replace(/\n/g, '\n                ')}\n                <h2 id="dates"`);
    }
    // Legacy exam layout (ap-icet, ap-pgcet)
    if (!html.includes('ad-slot') && html.includes('<article class="lg:col-span-9')) {
      html = html.replace(
        /<article class="lg:col-span-9[^"]*">/,
        m => `${m}\n                ${AD_SLOT.articleTop.replace(/\n/g, '\n                ')}`
      );
      html = html.replace(
        /<!-- Section: Eligibility -->\s*<section id="eligibility"/,
        `<!-- Section: Eligibility -->\n                ${AD_SLOT.articleMid.replace(/\n/g, '\n                ')}\n                <section id="eligibility"`
      );
    }
    changed = true;
  }
  // Hub, list & info pages
  else if (needsSlots && (rel.includes('govt-jobs') || rel.includes('state-jobs') || rel.includes('entrance-exams') || rel === 'sitemap.html' || rel.startsWith('about/') || rel.startsWith('contact/') || rel.startsWith('search/'))) {
    html = html.replace(/(\s*)<\/main>/, `\n        ${AD_SLOT.listMid}\n$1</main>`);
    changed = true;
  }

  const footerPatched = patchFooter(html, p);
  if (footerPatched !== html) {
    html = footerPatched;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, html);
    console.log('Ads injected:', rel);
  }
});

console.log('Ad injection complete.');