const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const EXAM_SLUGS = fs.readdirSync(ROOT).filter(
  d => (d.startsWith('ap-') && d.endsWith('-2026')) || d === 'apset-2026'
).filter(d => fs.existsSync(path.join(ROOT, d, 'index.html')) && d !== 'ap-state-jobs');

const AD_TOP = `<aside class="ad-slot ad-slot--responsive" data-ad-key="ARTICLE_TOP" data-ad-format="auto" aria-label="Advertisement">
            <p class="ad-label">Advertisement</p>
            <div class="ad-container"></div>
        </aside>`;

const AD_MID = `<aside class="ad-slot ad-slot--infeed" data-ad-key="ARTICLE_MID" data-ad-format="auto" aria-label="Advertisement">
            <p class="ad-label">Advertisement</p>
            <div class="ad-container"></div>
        </aside>`;

function cleanHtml(chunk) {
  if (!chunk) return '';
  return chunk
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<aside class="ad-slot[\s\S]*?<\/aside>/gi, '')
    .replace(/<div class="bg-red-50[\s\S]*?<\/div>\s*/i, '')
    .replace(/<span aria-hidden="true" class="icon-inline">[^<]*<\/span>/gi, '')
    .replace(/<span class="material-icons-round[^"]*">[^<]*<\/span>/gi, '')
    .replace(/<h2[^>]*>\s*<span[^>]*><\/span>\s*[^<]+\s*<\/h2>/gi, '')
    .replace(/<span>\s*✔\s*<\/span>/gi, '')
    .replace(/expand_more/gi, '')
    .replace(/\sclass="[^"]*"/gi, '')
    .replace(/<h2[^>]*>/gi, '<h2>')
    .replace(/<h3[^>]*>/gi, '<h3>')
    .replace(/<h4[^>]*>/gi, '<h4>')
    .replace(/<h5[^>]*>/gi, '<h5>')
    .replace(/<p\s*>/gi, '<p>')
    .replace(/<table>/gi, '<table class="info-table">')
    .replace(/<a\s+/gi, '<a ')
    .replace(/<div>\s*<a href="([^"]+)"[^>]*>[\s\S]*?Apply[\s\S]*?<\/a>[\s\S]*?<\/div>/gi,
      '<a href="$1" class="apply-btn" target="_blank" rel="noopener noreferrer">Apply on Official Website →</a>')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function firstMatch(html, re) {
  const m = html.match(re);
  return m ? m[1] : '';
}

function extractSectionById(html, id) {
  const re = new RegExp(`<section[^>]*id="${id}"[^>]*>([\\s\\S]*?)<\\/section>`, 'i');
  return html.match(re)?.[1] || '';
}

function sliceBetween(html, startId, endPattern) {
  const startRe = new RegExp(`<(?:section|h2)[^>]*id="${startId}"[^>]*>`, 'i');
  const start = html.search(startRe);
  if (start < 0) return '';
  const rest = html.slice(start);
  const end = rest.search(endPattern);
  return end > 0 ? rest.slice(0, end) : rest;
}

function simplifyH2Block(html, id, nextIds) {
  const stops = [
    ...nextIds.map(n => `<h2[^>]*id="${n}"`),
    '</article>',
    '<section id="faq"',
    '<section class="featured-banner"'
  ].join('|');
  const re = new RegExp(`<h2[^>]*id="${id}"[^>]*>([\\s\\S]*?)(?=${stops})`, 'i');
  const m = html.match(re);
  if (!m) return '';
  return cleanHtml(m[1].replace(/<\/h2>/i, ''));
}

function extractIntro(html) {
  const p = html.match(/<p[^>]*first-letter[^>]*>([\s\S]*?)<\/p>/i)
    || html.match(/<p[^>]*>\s*The <strong[^>]*>[\s\S]*?<\/p>/i)
    || html.match(/<article[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
  if (!p) return '';
  const full = p[0] || `<p>${p[1]}</p>`;
  return cleanHtml(full.replace(/<strong[^>]*>/gi, '<strong>').replace(/<\/strong>/gi, '</strong>'));
}

function extractApplyUrl(html) {
  return firstMatch(html, /href="(https:\/\/cets\.apsche\.ap\.gov\.in[^"]+)"/i)
    || firstMatch(html, /href="(https:\/\/[^"]*apsche[^"]+)"/i)
    || firstMatch(html, /href="(https:\/\/[^"]+)"/i);
}

function extractRelated(html) {
  const block = html.match(/<section[^>]*id="related"[^>]*>([\s\S]*?)<\/section>/i);
  if (!block) return '';
  const links = [...block[1].matchAll(/<a href="([^"]+)"[^>]*>[\s\S]*?<h3[^>]*>([^<]+)<\/h3>[\s\S]*?<p[^>]*>([^<]+)/gi)];
  if (!links.length) return '';
  const items = links.map(([, href, title, desc]) =>
    `<a href="${href}" class="related-exam-card"><strong>${title.trim()}</strong><span>${desc.trim()}</span></a>`
  ).join('\n                    ');
  return `<section class="related-exams-section">
                <h2>Related Exam Guides</h2>
                <div class="related-exams-grid">${items}</div>
            </section>`;
}

function extractFaq(html) {
  const block = html.match(/<section[^>]*id="faq"[^>]*>([\s\S]*?)<\/section>/i);
  if (!block) return '';
  const details = [...block[1].matchAll(/<details[^>]*>[\s\S]*?<summary[^>]*>([\s\S]*?)<\/summary>[\s\S]*?<div[^>]*>([\s\S]*?)<\/div>[\s\S]*?<\/details>/gi)];
  if (!details.length) return '';
  const items = details.map(([, q, a]) => {
    const question = stripTags(q);
    const answer = cleanHtml(a);
    return `<details class="faq-details"><summary class="faq-summary">${question}</summary><div class="faq-answer">${answer}</div></details>`;
  }).join('\n                ');
  return `<section id="faq">
                <h2>Frequently Asked Questions</h2>
                <div class="faq-accordion">${items}</div>
            </section>`;
}

function extractExtraSchemas(html) {
  const keep = new Set(['FAQPage', 'Event']);
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)]
    .filter(m => {
      try {
        const type = JSON.parse(m[1].replace(/[\n\r]/g, ' '))['@type'];
        return keep.has(type);
      } catch { return false; }
    })
    .map(m => m[0])
    .join('\n    ');
}

function extractHeadMeta(html) {
  const head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1] || '';
  return head
    .replace(/<style>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*src="[^"]*tailwindcss[^"]*"[^>]*><\/script>/gi, '')
    .replace(/<script>\s*tailwind\.config[\s\S]*?<\/script>/gi, '')
    .replace(/<script[^>]*googletagmanager[^>]*><\/script>/gi, '')
    .replace(/<script>[\s\S]*?gtag\([\s\S]*?<\/script>/gi, '')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, '')
    .replace(/<link rel="stylesheet" href="[^"]*tailwind\.min\.css">/gi, '')
    .replace(/<link rel="stylesheet" href="[^"]*article\.css">/gi, '')
    .replace(/<link rel="stylesheet" href="[^"]*theme\.css">/gi, '')
    .replace(/<link rel="stylesheet" href="[^"]*ads\.css">/gi, '')
    .replace(/<link[^>]*fonts\.googleapis\.com[^>]*>\s*/gi, '')
    .replace(/<link rel="preconnect"[^>]*>\s*/gi, '')
    .replace(/<link rel="icon" href="\/favicon\.png"[^>]*>/gi, '<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">')
    .replace(/content="index, follow"(\s*\/?>)/gi, 'content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"$1')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

function buildCoreSchemas(title, desc, slug, image) {
  const short = title.split(':')[0].split('|')[0].trim();
  return `    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "${title.replace(/"/g, '\\"')}",
      "description": "${desc.replace(/"/g, '\\"')}",
      "image": "${image}",
      "author": { "@type": "Organization", "name": "Easy Applications" },
      "publisher": { "@type": "Organization", "name": "Easy Applications", "logo": { "@type": "ImageObject", "url": "https://easyapplications.in/logo.png" } },
      "datePublished": "2026-01-18",
      "dateModified": "2026-06-18",
      "mainEntityOfPage": "https://easyapplications.in/${slug}/"
    }
    </script>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://easyapplications.in/" },
        { "@type": "ListItem", "position": 2, "name": "Entrance Exams", "item": "https://easyapplications.in/entrance-exams/" },
        { "@type": "ListItem", "position": 3, "name": "${short.replace(/"/g, '\\"')}", "item": "https://easyapplications.in/${slug}/" }
      ]
    }
    </script>`;
}

function buildJumpNav(ids) {
  const labels = {
    highlights: 'Highlights',
    understanding: 'Overview',
    dates: 'Important Dates',
    application: 'How to Apply',
    eligibility: 'Eligibility',
    pattern: 'Exam Pattern',
    preparation: 'Preparation',
    universities: 'Colleges',
    faq: 'FAQs'
  };
  const links = ids
    .filter(id => labels[id])
    .map(id => `<a href="#${id}">${labels[id]}</a>`)
    .join('\n                ');
  return `<nav class="exam-jump-nav" aria-label="On this page">${links}</nav>`;
}

function wrapSection(id, title, body) {
  if (!body || stripTags(body).length < 20) return '';
  let inner = cleanHtml(body);
  inner = inner.replace(/<h2>[^<]*<\/h2>/gi, '').trim();
  if (title) {
    inner = `<h2>${title}</h2>\n                ${inner}`;
  }
  return `<section id="${id}">\n                ${inner}\n            </section>`;
}

function buildHighlightsTable(html, examName) {
  const highlights = extractSectionById(html, 'highlights');
  if (highlights) {
    const rows = [...highlights.matchAll(/<span[^>]*>([^<]+)<\/span>\s*<span[^>]*>([^<]+)<\/span>/gi)]
      .filter(([, k]) => k.length < 40 && !k.includes('Confirmed'))
      .slice(0, 8);
    if (rows.length >= 3) {
      const trs = rows.map(([, k, v]) => `<tr><th>${k.trim()}</th><td>${v.trim()}</td></tr>`).join('\n                    ');
      return `<section id="highlights">
                <h2>${examName} — Key Details</h2>
                <table class="info-table">${trs}</table>
            </section>`;
    }
    return wrapSection('highlights', `${examName} — Key Details`, highlights);
  }

  const understanding = extractSectionById(html, 'understanding');
  if (understanding) {
    const pairs = [...understanding.matchAll(/<h4[^>]*>([^<]+)<\/h4>\s*<p[^>]*>([^<]+)<\/p>/gi)];
    if (pairs.length) {
      const trs = pairs.map(([, k, v]) => `<tr><th>${k.trim()}</th><td>${v.trim()}</td></tr>`).join('\n                    ');
      const introP = understanding.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] || '';
      const introClean = introP ? `<p>${stripTags(introP)}</p>` : '';
      return `<section id="highlights">
                <h2>${examName} — Key Details</h2>
                ${introClean}
                <table class="info-table">${trs}</table>
            </section>`;
    }
    return wrapSection('highlights', `${examName} — Overview`, understanding);
  }
  return '';
}

function convertDatesSection(html, examName) {
  const tableSection = extractSectionById(html, 'dates');
  if (tableSection && tableSection.includes('<table')) {
    const table = tableSection.match(/<table[\s\S]*?<\/table>/i)?.[0] || '';
    const cleaned = table
      .replace(/\sclass="[^"]*"/gi, '')
      .replace(/<table/i, '<table class="info-table dates-table"');
    const apply = extractApplyUrl(html);
    const btn = apply
      ? `<a href="${apply}" class="apply-btn" target="_blank" rel="noopener noreferrer">Apply on Official Website →</a>`
      : '';
    return `<section id="dates">
                <h2>${examName} — Important Dates</h2>
                ${btn}
                <div class="table-scroll">${cleaned}</div>
            </section>`;
  }

  const block = simplifyH2Block(html, 'dates', ['eligibility', 'application', 'pattern']);
  if (block) {
    const apply = extractApplyUrl(html);
    const btn = apply
      ? `<a href="${apply}" class="apply-btn" target="_blank" rel="noopener noreferrer">Apply on Official Website →</a>`
      : '';
    return `<section id="dates">
                <h2>${examName} — Important Dates</h2>
                ${btn}
                ${block}
            </section>`;
  }
  return '';
}

function rebuildPage(slug, html) {
  const title = firstMatch(html, /<meta property="og:title" content="([^"]+)"/i)
    || firstMatch(html, /<title>([^<|]+)/i)
    || slug;
  const shortName = title.split(':')[0].split('|')[0].trim();
  const applyUrl = extractApplyUrl(html);

  const highlights = buildHighlightsTable(html, shortName);
  let intro = extractIntro(html);
  if (highlights && intro && stripTags(intro).length > 80 && highlights.includes(stripTags(intro).slice(0, 60))) {
    intro = '';
  }
  const dates = convertDatesSection(html, shortName);

  let eligibility = extractSectionById(html, 'eligibility');
  if (!eligibility) eligibility = simplifyH2Block(html, 'eligibility', ['application', 'pattern', 'preparation', 'universities']);
  eligibility = wrapSection('eligibility', 'Eligibility Criteria', eligibility);

  let application = extractSectionById(html, 'application');
  if (!application) application = simplifyH2Block(html, 'application', ['pattern', 'eligibility', 'preparation']);
  application = wrapSection('application', 'How to Apply', application);
  if (application && applyUrl && !application.includes('apply-btn')) {
    application = application.replace(
      '<section id="application">',
      `<section id="application">\n                <a href="${applyUrl}" class="apply-btn" target="_blank" rel="noopener noreferrer">Apply on Official Website →</a>`
    );
  }

  let pattern = extractSectionById(html, 'pattern');
  if (!pattern) pattern = simplifyH2Block(html, 'pattern', ['faq', 'preparation']);
  pattern = wrapSection('pattern', 'Exam Pattern & Syllabus', pattern);

  const preparation = wrapSection('preparation', 'Preparation Tips', extractSectionById(html, 'preparation'));
  const universities = wrapSection('universities', 'Participating Universities', extractSectionById(html, 'universities'));
  const faq = extractFaq(html);
  const related = extractRelated(html);

  const sections = [highlights, dates, eligibility, application, pattern, preparation, universities, faq, related]
    .filter(Boolean);

  const jumpIds = sections.map(s => s.match(/id="([^"]+)"/)?.[1]).filter(Boolean);
  const jumpNav = buildJumpNav(jumpIds);

  let body = sections.join('\n\n            ');
  const midInsert = body.indexOf('<section id="eligibility">');
  if (midInsert > 0) {
    body = body.slice(0, midInsert) + AD_MID + '\n\n            ' + body.slice(midInsert);
  }

  const desc = firstMatch(html, /<meta name="description"\s+content="([^"]+)"/i) || title;
  const image = firstMatch(html, /<meta property="og:image" content="([^"]+)"/i) || `https://easyapplications.in/${slug}-hero.png`;
  const headMeta = extractHeadMeta(html);
  const coreSchemas = buildCoreSchemas(title, desc, slug, image);
  const extraSchemas = extractExtraSchemas(html);

  const nav = `    <a href="#main-content" class="skip-link">Skip to main content</a>
    <nav class="site-nav" aria-label="Main navigation">
        <div class="nav-inner">
            <a href="../index.html" class="site-logo" aria-label="EasyApplications Home">
                <span class="logo-icon" aria-hidden="true">EA</span>
                EasyApplications
            </a>
            <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-menu" aria-label="Open menu">
                <span></span><span></span><span></span>
            </button>
            <div class="nav-links" id="nav-menu" role="navigation">
                <a href="../central-govt-jobs/index.html">Central Govt</a>
                <a href="../ap-state-jobs/index.html">AP Jobs</a>
                <a href="../entrance-exams/index.html" class="active">Entrance Exams</a>
                <a href="../search/index.html">Search</a>
                <a href="../about/index.html">About</a>
                <a href="../contact/index.html" class="nav-cta">Contact</a>
            </div>
        </div>
    </nav>`;

  const footer = `    <footer class="site-footer"><div class="footer-bottom" style="border:none;padding-top:0;margin:0 auto;max-width:1200px;">
        <p>&copy; 2026 Easy Applications. <a href="../privacy/index.html">Privacy Policy</a> · <a href="../terms/index.html">Terms</a> · <a href="../index.html" style="color:#94a3b8;">Home</a></p>
    </div></footer>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    ${headMeta}
    <link rel="stylesheet" href="../css/theme.css">
    <link rel="stylesheet" href="../css/article.css">
    <link rel="stylesheet" href="../css/ads.css">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
    ${coreSchemas}
    ${extraSchemas}
</head>
<body>
${nav}

    <main id="main-content" role="main">
        <div class="article-wrap exam-guide">
            <nav class="breadcrumb" aria-label="Breadcrumb">
                <a href="../index.html">Home</a><span>/</span>
                <a href="../entrance-exams/index.html">Entrance Exams</a><span>/</span>
                <span>${shortName}</span>
            </nav>

            <h1>${title.replace(/&amp;/g, '&')}</h1>
            <div class="content-banner"><strong>Verified guide</strong> — official dates, eligibility, and apply link. Always confirm on the APSCHE portal before applying.</div>
            <div class="article-meta">
                <span>Category: Entrance Exams</span>
                <span>Updated: June 2026</span>
            </div>
            <p class="last-updated" role="status">📅 Last updated: June 18, 2026 — verified against official notification</p>

            ${AD_TOP}

            ${intro}

            ${jumpNav}

            ${body}

            <section class="disclaimer-section">
                <h2>Disclaimer</h2>
                <p>EasyApplications is an independent informational portal and is <strong>not affiliated with APSCHE or any conducting university</strong>. Notification details may change — always verify on the official website before applying.</p>
            </section>
        </div>
    </main>

${footer}
    <script src="../js/site.js" defer></script>
    <script src="../js/ads-config.js" defer></script>
    <script src="../js/ads.js" defer></script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-0NTMP9DDBZ"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-0NTMP9DDBZ');</script>
</body>
</html>`;
}

// Backup originals on first run for re-extraction
const BACKUP = path.join(ROOT, 'scripts', '.exam-backup');
if (!fs.existsSync(BACKUP)) fs.mkdirSync(BACKUP, { recursive: true });

EXAM_SLUGS.forEach(slug => {
  const file = path.join(ROOT, slug, 'index.html');
  const backupFile = path.join(BACKUP, `${slug}.html`);
  let html = fs.readFileSync(file, 'utf8');
  if (!fs.existsSync(backupFile) && !html.includes('class="article-wrap exam-guide"')) {
    fs.writeFileSync(backupFile, html);
  } else if (fs.existsSync(backupFile)) {
    html = fs.readFileSync(backupFile, 'utf8');
  }
  const rebuilt = rebuildPage(slug, html);
  fs.writeFileSync(file, rebuilt);
  console.log('Restructured:', slug);
});

console.log('Exam page restructure complete.');