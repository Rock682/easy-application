const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://easyapplications.in';
const TODAY = new Date().toISOString().slice(0, 10);

const SKIP_DIRS = new Set(['node_modules', 'scripts', '.git']);
const SKIP_FILES = new Set(['404.html']);

function walkPages(dir, base = '') {
  const pages = [];
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    if (!fs.statSync(full).isDirectory()) continue;

    const indexFile = path.join(full, 'index.html');
    if (fs.existsSync(indexFile)) {
      const rel = base ? `${base}/${name}` : name;
      pages.push({ rel, file: indexFile });
      if (name === 'jobs') {
        for (const job of fs.readdirSync(full)) {
          const jobIndex = path.join(full, job, 'index.html');
          if (fs.existsSync(jobIndex)) {
            pages.push({ rel: `${rel}/${job}`, file: jobIndex });
          }
        }
      }
    } else if (base === '') {
      pages.push(...walkPages(full, name));
    }
  }
  if (base === '' && fs.existsSync(path.join(dir, 'index.html'))) {
    pages.unshift({ rel: '', file: path.join(dir, 'index.html') });
  }
  if (base === '' && fs.existsSync(path.join(dir, 'sitemap.html'))) {
    pages.push({ rel: 'sitemap.html', file: path.join(dir, 'sitemap.html') });
  }
  return pages;
}

function toUrl(rel) {
  if (!rel || rel === 'index.html') return `${SITE}/`;
  if (rel === 'sitemap.html') return `${SITE}/sitemap.html`;
  return `${SITE}/${rel}/`;
}

function pageTitle(file) {
  const html = fs.readFileSync(file, 'utf8');
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1] || '';
  return title.split('|')[0].split('—')[0].trim() || path.basename(path.dirname(file));
}

function isNoindex(file) {
  const html = fs.readFileSync(file, 'utf8');
  return /<meta[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(html);
}

function meta(file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (rel === 'sitemap.html') {
    return { changefreq: 'weekly', priority: '0.5', group: 'legal' };
  }
  const urlPath = rel.replace(/\/index\.html$/, '').replace(/^index\.html$/, '');

  if (urlPath === '' || urlPath === 'index.html') {
    return { changefreq: 'daily', priority: '1.0', group: 'main' };
  }
  if (urlPath === 'sitemap.html') {
    return { changefreq: 'weekly', priority: '0.5', group: 'legal' };
  }
  if (['central-govt-jobs', 'ap-state-jobs', 'entrance-exams'].includes(urlPath)) {
    return { changefreq: 'daily', priority: '0.95', group: 'hubs' };
  }
  if (urlPath.startsWith('jobs/')) {
    const apJobs = ['appsc-group-1-2026', 'ap-police-constable', 'ap-dsc-2026', 'ap-grama-sachivalayam'];
    const job = urlPath.replace('jobs/', '');
    return {
      changefreq: 'weekly',
      priority: '0.9',
      group: apJobs.includes(job) ? 'ap-jobs' : 'central-jobs'
    };
  }
  if (/^ap-.*-2026$/.test(urlPath) || urlPath === 'apset-2026') {
    return { changefreq: 'weekly', priority: '0.9', group: 'exams' };
  }
  if (['privacy', 'terms'].includes(urlPath)) {
    return { changefreq: 'monthly', priority: '0.5', group: 'legal' };
  }
  if (['about', 'contact'].includes(urlPath)) {
    return { changefreq: 'monthly', priority: '0.6', group: 'main' };
  }
  if (urlPath === 'search') {
    return { changefreq: 'weekly', priority: '0.8', group: 'main' };
  }
  return { changefreq: 'monthly', priority: '0.5', group: 'main' };
}

const allPages = walkPages(ROOT)
  .filter(p => !SKIP_FILES.has(path.basename(p.file)))
  .filter(p => !isNoindex(p.file));

const entries = allPages.map(p => {
  const rel = p.rel === '' ? '' : p.rel;
  const isSitemapHtml = rel === 'sitemap.html';
  const urlPath = isSitemapHtml ? 'sitemap.html' : rel;
  const m = meta(p.file);
  return {
    url: isSitemapHtml ? `${SITE}/sitemap.html` : toUrl(urlPath),
    label: pageTitle(p.file),
    file: p.file,
    urlPath,
    ...m
  };
}).sort((a, b) => {
  const order = { main: 0, hubs: 1, 'central-jobs': 2, 'ap-jobs': 3, exams: 4, legal: 5 };
  const g = order[a.group] - order[b.group];
  if (g !== 0) return g;
  return a.url.localeCompare(b.url);
});

// ── sitemap.xml ──
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(e => `  <url>
    <loc>${e.url}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);

// ── sitemap.html sections ──
const groups = {
  main: 'Main Pages',
  hubs: 'Category Hubs',
  'central-jobs': 'Central Govt Jobs',
  'ap-jobs': 'AP State Jobs',
  exams: 'Entrance Exams',
  legal: 'Legal &amp; Info'
};

function href(urlPath) {
  if (!urlPath) return 'index.html';
  if (urlPath === 'sitemap.html') return 'sitemap.html';
  return `${urlPath}/index.html`;
}

const sections = Object.entries(groups).map(([key, title]) => {
  const items = entries.filter(e => e.group === key);
  if (!items.length) return '';
  const lis = items.map(e => {
    const label = e.label.replace(/&amp;/g, '&').replace(/&/g, '&amp;').replace(/</g, '&lt;');
    return `            <li><a href="${href(e.urlPath)}">${label}</a></li>`;
  }).join('\n');
  return `        <section class="exam-hub-section"><h2>${title}</h2><ul>\n${lis}\n        </ul></section>`;
}).filter(Boolean).join('\n\n');

const sitemapHtml = fs.readFileSync(path.join(ROOT, 'sitemap.html'), 'utf8');
const updatedHtml = sitemapHtml.replace(
  /<div class="page-header">[\s\S]*?<\/main>/,
  `<div class="page-header">
            <nav class="breadcrumb"><a href="index.html">Home</a><span>/</span><span>Sitemap</span></nav>
            <h1>Site Map</h1>
            <p>All <strong>${entries.length} pages</strong> on EasyApplications.in — submit <a href="sitemap.xml">sitemap.xml</a> to <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer">Google Search Console</a>.</p>
            <p style="font-size:0.88rem;color:var(--text-muted);margin-top:0.5rem;">Last updated: ${TODAY}</p>
        </div>
${sections}
        <aside class="ad-slot ad-slot--responsive" data-ad-key="LIST_MID" data-ad-format="auto" aria-label="Advertisement">
            <p class="ad-label">Advertisement</p>
            <div class="ad-container"></div>
        </aside>

    </main>`
);

fs.writeFileSync(path.join(ROOT, 'sitemap.html'), updatedHtml);

console.log(`Sitemap generated: ${entries.length} URLs (lastmod ${TODAY})`);
entries.forEach(e => console.log(`  ${e.url}`));