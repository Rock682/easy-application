const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const exams = [
  { slug: 'ap-eapcet-2026', name: 'AP EAPCET 2026' },
  { slug: 'ap-ecet-2026', name: 'AP ECET 2026' },
  { slug: 'ap-edcet-2026', name: 'AP EdCET 2026' },
  { slug: 'ap-icet-2026', name: 'AP ICET 2026' },
  { slug: 'ap-lawcet-2026', name: 'AP LAWCET 2026' },
  { slug: 'ap-pecet-2026', name: 'AP PECET 2026' },
  { slug: 'ap-pgcet-2026', name: 'AP PGCET 2026' },
  { slug: 'ap-pgecet-2026', name: 'AP PGECET 2026' },
  { slug: 'ap-polycet-2026', name: 'AP POLYCET 2026' },
  { slug: 'apset-2026', name: 'APSET 2026' },
];

function patchExamPage(slug, name) {
  const file = path.join(ROOT, slug, 'index.html');
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, 'utf8');
  const url = `https://easyapplications.in/${slug}/`;

  // Fix Twitter meta property -> name
  html = html.replace(/property="twitter:/g, 'name="twitter:');

  // Add og:site_name if missing
  if (!html.includes('og:site_name')) {
    html = html.replace(
      /(<meta property="og:image"[^>]+>)/,
      `$1\n    <meta property="og:site_name" content="EasyApplications">`
    );
  }

  // Upgrade robots meta
  html = html.replace(
    /<meta name="robots" content="index, follow">/,
    '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">'
  );

  // Add hreflang if missing
  if (!html.includes('hreflang')) {
    html = html.replace(
      /(<link rel="canonical"[^>]+>)/,
      `$1\n    <link rel="alternate" hreflang="en-IN" href="${url}">\n    <link rel="alternate" hreflang="en" href="${url}">\n    <link rel="alternate" hreflang="x-default" href="${url}">`
    );
  }

  // Update breadcrumb to 3-level
  const breadcrumb = `    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [{
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://easyapplications.in/"
      },{
        "@type": "ListItem",
        "position": 2,
        "name": "Entrance Exams",
        "item": "https://easyapplications.in/entrance-exams/"
      },{
        "@type": "ListItem",
        "position": 3,
        "name": "${name}",
        "item": "${url}"
      }]
    }
    </script>`;

  html = html.replace(
    /<!-- Breadcrumb Schema -->[\s\S]*?<\/script>\s*(?=<link rel="preconnect")/,
    `<!-- Breadcrumb Schema -->\n${breadcrumb}\n`
  );

  // Update dateModified in Article schema
  html = html.replace(/"dateModified": "[^"]+"/, '"dateModified": "2026-06-18"');

  // Add WebPage schema before preconnect if missing
  if (!html.includes('"@type": "WebPage"')) {
    const webPage = `    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "${name} Guide",
      "description": "Complete ${name} notification guide with eligibility, important dates, fees and official apply link.",
      "url": "${url}",
      "inLanguage": "en-IN",
      "isPartOf": { "@type": "WebSite", "name": "EasyApplications", "url": "https://easyapplications.in/" },
      "about": { "@type": "EducationalOccupationalProgram", "name": "${name}" },
      "dateModified": "2026-06-18"
    }
    </script>\n`;
    html = html.replace(/<link rel="preconnect"/, webPage + '    <link rel="preconnect"');
  }

  // Lazy load hero images
  html = html.replace(
    /<img src="(\.\.\/[^"]+-hero\.png)" alt="/,
    '<img src="$1" loading="lazy" decoding="async" width="1200" height="480" alt="'
  );

  fs.writeFileSync(file, html);
  console.log('Updated:', slug);
}

exams.forEach(e => patchExamPage(e.slug, e.name));
console.log('Exam pages done.');