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

exams.forEach(({ slug, name }) => {
  const file = path.join(ROOT, slug, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  const url = `https://easyapplications.in/${slug}/`;

  html = html.replace(/property="twitter:/g, 'name="twitter:');

  if (!html.includes('hreflang')) {
    html = html.replace(
      /(<link rel="canonical" href="[^"]+">)/,
      `$1\n    <link rel="alternate" hreflang="en-IN" href="${url}">\n    <link rel="alternate" hreflang="en" href="${url}">\n    <link rel="alternate" hreflang="x-default" href="${url}">`
    );
  }

  html = html.replace(
    /<meta name="robots" content="index, follow">/,
    '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">'
  );

  if (!html.includes('og:site_name')) {
    html = html.replace(
      /(<meta property="og:image"[^>]*>)/,
      '$1\n    <meta property="og:site_name" content="EasyApplications">\n    <meta property="og:locale" content="en_IN">'
    );
  }

  html = html.replace(/"dateModified": "[^"]+"/g, '"dateModified": "2026-06-18"');

  const breadcrumbBlock = `<script type="application/ld+json">
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

  if (html.includes('"@type": "BreadcrumbList"')) {
    html = html.replace(
      /<script type="application\/ld\+json">[\s\S]*?"@type": "BreadcrumbList"[\s\S]*?<\/script>/,
      breadcrumbBlock
    );
  } else {
    html = html.replace(/<\/head>/, breadcrumbBlock + '\n</head>');
  }

  if (!html.includes('"@type": "WebPage"')) {
    const webPage = `<script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "${name} Notification Guide",
      "description": "Complete ${name} guide with eligibility, important dates, fees and official apply link.",
      "url": "${url}",
      "inLanguage": "en-IN",
      "isPartOf": { "@type": "WebSite", "name": "EasyApplications", "url": "https://easyapplications.in/" },
      "dateModified": "2026-06-18"
    }
    </script>\n`;
    html = html.replace('</head>', webPage + '</head>');
  }

  html = html.replace(
    /<img src="(\.\.\/[^"]+-hero\.png)" alt="/g,
    '<img src="$1" loading="lazy" decoding="async" width="1200" height="480" alt="'
  );

  fs.writeFileSync(file, html);
  console.log('Patched:', slug);
});