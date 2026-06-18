const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    if (['node_modules', 'scripts', '.git'].includes(f)) continue;
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (f.endsWith('.html')) files.push(p);
  }
  return files;
}

function depth(file) {
  return path.relative(ROOT, file).split(path.sep).length - 1;
}

function prefix(d) {
  return d === 0 ? '' : '../'.repeat(d);
}

function navHtml(d, active = '') {
  const p = prefix(d);
  const links = [
    ['Central Govt', 'central-govt-jobs/index.html', 'central'],
    ['AP Jobs', 'ap-state-jobs/index.html', 'ap'],
    ['Entrance Exams', 'entrance-exams/index.html', 'entrance'],
    ['Search', 'search/index.html', 'search'],
    ['About', 'about/index.html', 'about'],
    ['Contact', 'contact/index.html', 'contact', true],
  ];
  const items = links.map(([label, href, key, cta]) => {
    const cls = cta ? 'nav-cta' : (active === key ? 'active' : '');
    return `<a href="${p}${href}" class="${cls}">${label}</a>`;
  }).join('\n            ');
  return `<a href="#main-content" class="skip-link">Skip to main content</a>
    <nav class="site-nav" aria-label="Main navigation">
        <div class="nav-inner">
            <a href="${p}index.html" class="site-logo" aria-label="EasyApplications Home">
                <span class="logo-icon" aria-hidden="true">EA</span>
                EasyApplications
            </a>
            <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-menu" aria-label="Open menu">
                <span></span><span></span><span></span>
            </button>
            <div class="nav-links" id="nav-menu" role="navigation">
            ${items}
            </div>
        </div>
    </nav>`;
}

function footerHtml(d) {
  const p = prefix(d);
  return `<footer class="site-footer" role="contentinfo">
        <div class="footer-inner">
            <div class="footer-brand">
                <h4>EasyApplications</h4>
                <p>Govt jobs, SSC, RRB, APPSC &amp; entrance exam alerts for India.</p>
            </div>
            <div class="footer-col">
                <h5>Categories</h5>
                <ul>
                    <li><a href="${p}central-govt-jobs/index.html">Central Govt Jobs</a></li>
                    <li><a href="${p}ap-state-jobs/index.html">AP State Jobs</a></li>
                    <li><a href="${p}entrance-exams/index.html">Entrance Exams</a></li>
                </ul>
            </div>
            <div class="footer-col">
                <h5>Company</h5>
                <ul>
                    <li><a href="${p}about/index.html">About</a></li>
                    <li><a href="${p}contact/index.html">Contact</a></li>
                    <li><a href="${p}privacy/index.html">Privacy Policy</a></li>
                    <li><a href="${p}terms/index.html">Terms of Use</a></li>
                    <li><a href="${p}sitemap.html">Sitemap</a></li>
                </ul>
            </div>
            <div class="footer-col">
                <h5>Contact</h5>
                <ul><li><a href="mailto:help@easyapplications.in">help@easyapplications.in</a></li></ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2026 Easy Applications. Not an official government website.</p>
        </div>
    </footer>`;
}

function upgradeFile(file) {
  let html = fs.readFileSync(file, 'utf8');
  const d = depth(file);
  const p = prefix(d);
  const rel = path.relative(ROOT, file);
  let changed = false;

  // Remove Tailwind CDN + inline config
  const tailwindRemoved = html.replace(/<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>\s*<script>[\s\S]*?tailwind\.config[\s\S]*?<\/script>\s*/g, '');
  if (tailwindRemoved !== html) { html = tailwindRemoved; changed = true; }

  // Remove material icons font (performance)
  const noMaterial = html.replace(/<link href="https:\/\/fonts\.googleapis\.com\/icon\?family=Material\+Icons\+Round"[^>]*>\s*/g, '');
  if (noMaterial !== html) { html = noMaterial; changed = true; }

  // Simplify google fonts to Outfit only
  html = html.replace(
    /href="https:\/\/fonts\.googleapis\.com\/css2\?family=Lora[^"]+"/g,
    'href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap"'
  );

  // Add preconnect + built tailwind if exam-style page uses tailwind classes
  if (html.includes('class="font-body') || html.includes('class="flex ') || html.includes('bg-primary-bg')) {
    if (!html.includes('tailwind.min.css')) {
      html = html.replace(
        /<link rel="stylesheet" href="[^"]*theme\.css">/,
        `<link rel="preconnect" href="https://fonts.googleapis.com">\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n    <link rel="stylesheet" href="${p}css/theme.css">\n    <link rel="stylesheet" href="${p}css/tailwind.min.css">`
      );
      if (!html.includes('theme.css')) {
        html = html.replace('</head>', `    <link rel="stylesheet" href="${p}css/theme.css">\n    <link rel="stylesheet" href="${p}css/tailwind.min.css">\n</head>`);
      }
      changed = true;
    }
  } else if (!html.includes('theme.css')) {
    html = html.replace('</head>', `    <link rel="stylesheet" href="${p}css/theme.css">\n</head>`);
    changed = true;
  }

  // Add manifest + favicon sizes
  if (!html.includes('manifest.json')) {
    html = html.replace(
      /<link rel="icon"[^>]*>/,
      `<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">\n    <link rel="apple-touch-icon" href="/logo.png">\n    <link rel="manifest" href="/manifest.json">`
    );
    changed = true;
  }

  // WebP picture for hero images
  html = html.replace(
    /<img src="(\.\.\/)(ap-[a-z0-9-]+-hero)\.png"([^>]*)>/g,
    (m, pre, base, rest) => {
      if (m.includes('<picture')) return m;
      changed = true;
      return `<picture><source srcset="${pre}${base}.webp" type="image/webp"><img src="${pre}${base}.png"${rest}></picture>`;
    }
  );

  // Replace old site-nav or add nav after body
  const active = rel.includes('central-govt') ? 'central' : rel.includes('ap-state') ? 'ap' : rel.includes('entrance-exam') ? 'entrance' : rel.includes('search') ? 'search' : rel.includes('about') ? 'about' : rel.includes('contact') ? 'contact' : '';

  if (html.includes('class="site-nav"')) {
    // Upgrade existing nav to include toggle
    if (!html.includes('nav-toggle')) {
      html = html.replace(
        /<nav class="site-nav"[\s\S]*?<\/nav>/,
        navHtml(d, active)
      );
      changed = true;
    }
    if (!html.includes('skip-link')) {
      html = html.replace(/<body[^>]*>/, m => m + '\n    ' + navHtml(d, active).split('\n').slice(1).join('\n    ').replace(navHtml(d, active).split('\n')[0], ''));
      // simpler: prepend skip link
      html = html.replace(/<body([^>]*)>/, `<body$1>\n    <a href="#main-content" class="skip-link">Skip to main content</a>`);
      changed = true;
    }
  } else if (!rel.includes('404')) {
    // Exam pages: insert nav after body
    html = html.replace(/<body([^>]*)>/, `<body$1>\n    ${navHtml(d, 'entrance')}`);
    changed = true;
  }

  // Add id="main-content" to main
  if (!html.includes('id="main-content"')) {
    html = html.replace(/<main(\s|>)/, '<main id="main-content"$1');
    if (!html.includes('id="main-content"')) {
      html = html.replace(/<div class="min-h-screen/, '<main id="main-content"><div class="min-h-screen');
      // close main before footer on exam pages - tricky
    }
    changed = true;
  }

  // Replace bulky old footers on exam pages with unified footer
  if (html.includes('bg-gray-900 text-white mt-16') && html.includes('Exam Sections')) {
    html = html.replace(/<footer class="w-full bg-gray-900[\s\S]*?<\/footer>/, footerHtml(d));
    changed = true;
  }

  // Add site.js defer
  if (!html.includes('site.js')) {
    html = html.replace('</body>', `    <script src="${p}js/site.js" defer></script>\n</body>`);
    changed = true;
  }

  // Defer gtag - move to end (performance)
  if (html.includes('googletagmanager') && html.indexOf('gtag') < html.indexOf('</head>')) {
    const gtag = html.match(/<script async src="https:\/\/www\.googletagmanager\.com[^<]+<\/script>\s*<script>[\s\S]*?gtag\('config'[\s\S]*?<\/script>/);
    if (gtag) {
      html = html.replace(gtag[0], '');
      html = html.replace('</body>', gtag[0] + '\n</body>');
      changed = true;
    }
  }

  // Ticker accessibility
  html = html.replace(
    /<div class="ticker-wrap"([^>]*)>/g,
    '<div class="ticker-wrap"$1 role="region" aria-label="Latest notifications">'
  );

  if (changed) {
    fs.writeFileSync(file, html);
    console.log('Upgraded:', rel);
  }
}

walk(ROOT).forEach(upgradeFile);
console.log('Done.');