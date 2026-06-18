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

  const breadcrumb = `{
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [{
        "@type": "ListItem", "position": 1, "name": "Home", "item": "https://easyapplications.in/"
      },{
        "@type": "ListItem", "position": 2, "name": "Entrance Exams", "item": "https://easyapplications.in/entrance-exams/"
      },{
        "@type": "ListItem", "position": 3, "name": "${name}", "item": "${url}"
      }]
    }`;

  html = html.replace(
    /"@type": "BreadcrumbList"[\s\S]*?}\s*}\s*<\/script>/,
    breadcrumb + '\n    </script>'
  );

  if (!html.includes('"@type": "WebPage"')) {
    const wp = `    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "${name} Guide",
      "url": "${url}",
      "inLanguage": "en-IN",
      "isPartOf": { "@type": "WebSite", "name": "EasyApplications", "url": "https://easyapplications.in/" },
      "dateModified": "2026-06-18"
    }
    </script>\n`;
    html = html.replace(/<link rel="stylesheet"/, wp + '    <link rel="stylesheet"');
  }

  if (!html.includes('og:site_name')) {
    html = html.replace(/(<meta property="og:image"[^>]*>)/, '$1\n    <meta property="og:site_name" content="EasyApplications">');
  }

  if (!html.includes('name="twitter:card"')) {
    html = html.replace(/(<meta name="twitter:image"[^>]*>)/, '$1\n    <meta name="twitter:site" content="@easyapplication">');
  }

  fs.writeFileSync(file, html);
  console.log('Fixed:', slug);
});