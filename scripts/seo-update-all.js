const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const OG = 'https://easyapplications.in/easy-app-og.png';
const ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

function injectAfterCanonical(html, canonicalUrl, extra) {
  const re = new RegExp(`(<link rel="canonical" href="${canonicalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>)`);
  if (!html.includes('hreflang') && re.test(html)) {
    html = html.replace(re, `$1\n    <link rel="alternate" hreflang="en-IN" href="${canonicalUrl}">\n    <link rel="alternate" hreflang="en" href="${canonicalUrl}">\n    <link rel="alternate" hreflang="x-default" href="${canonicalUrl}">`);
  }
  return html + ''; // placeholder
}

function ensureOgTwitter(html, title, desc, url) {
  if (!html.includes('og:image')) {
    const block = `
    <meta property="og:image" content="${OG}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="EasyApplications">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${desc}">
    <meta name="twitter:image" content="${OG}">`;
    html = html.replace(/(<meta name="robots"[^>]*>)/, block + '\n    $1');
  }
  if (!html.includes('og:url')) {
    html = html.replace(/(<meta property="og:title"[^>]*>)/, `<meta property="og:url" content="${url}">\n    $1`);
  }
  return html;
}

function patchJobPage(file, canonical, webPageName) {
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<meta name="robots" content="index, follow">/, `<meta name="robots" content="${ROBOTS}">`);
  html = ensureOgTwitter(html, webPageName, webPageName + ' guide on EasyApplications', canonical);
  if (!html.includes('hreflang')) {
    html = html.replace(
      new RegExp(`(<link rel="canonical" href="${canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>)`),
      `$1\n    <link rel="alternate" hreflang="en-IN" href="${canonical}">\n    <link rel="alternate" hreflang="en" href="${canonical}">\n    <link rel="alternate" hreflang="x-default" href="${canonical}">`
    );
  }
  if (!html.includes('"@type": "WebPage"')) {
    const wp = `    <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","name":"${webPageName}","url":"${canonical}","inLanguage":"en-IN","isPartOf":{"@type":"WebSite","name":"EasyApplications","url":"https://easyapplications.in/"},"dateModified":"2026-06-18"}</script>\n`;
    html = html.replace(/<link rel="stylesheet"/, wp + '    <link rel="stylesheet"');
  }
  fs.writeFileSync(file, html);
  console.log('Job:', path.basename(path.dirname(file)));
}

const jobs = [
  ['ssc-cgl-2026', 'SSC CGL 2026'],
  ['ssc-chsl-2026', 'SSC CHSL 2026'],
  ['rrb-ntpc-2026', 'RRB NTPC 2026'],
  ['rrb-group-d-2026', 'RRB Group D 2026'],
  ['upsc-civil-services', 'UPSC Civil Services 2026'],
  ['ibps-po-2026', 'IBPS PO 2026'],
  ['appsc-group-1-2026', 'APPSC Group 1 2026'],
  ['ap-police-constable', 'AP Police Constable 2026'],
  ['ap-dsc-2026', 'AP DSC 2026'],
  ['ap-grama-sachivalayam', 'AP Grama Sachivalayam Jobs'],
];

jobs.forEach(([slug, name]) => {
  const file = path.join(ROOT, 'jobs', slug, 'index.html');
  patchJobPage(file, `https://easyapplications.in/jobs/${slug}/`, name);
});

// Hub pages
const hubs = [
  ['central-govt-jobs', 'Central Government Jobs 2026', 'Latest SSC, RRB, UPSC and IBPS central government job notifications in India.'],
  ['ap-state-jobs', 'Andhra Pradesh Government Jobs 2026', 'Latest APPSC, AP Police, DSC and Sachivalayam recruitment in Andhra Pradesh.'],
  ['entrance-exams', 'AP Entrance Exams 2026', 'Complete guides for AP EAPCET, ICET, ECET, POLYCET and all APSCHE entrance exams.'],
];

hubs.forEach(([slug, title, desc]) => {
  const file = path.join(ROOT, slug, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  const url = `https://easyapplications.in/${slug}/`;
  html = ensureOgTwitter(html, title, desc, url);
  html = html.replace(/<meta name="robots" content="index, follow">/, `<meta name="robots" content="${ROBOTS}">`);
  if (!html.includes('hreflang')) {
    html = html.replace(/(<link rel="canonical"[^>]*>)/, `$1\n    <link rel="alternate" hreflang="en-IN" href="${url}">\n    <link rel="alternate" hreflang="en" href="${url}">\n    <link rel="alternate" hreflang="x-default" href="${url}">`);
  }
  if (!html.includes('twitter:card')) {
    html = html.replace(/(<meta property="og:type"[^>]*>)/, `$1\n    <meta name="twitter:card" content="summary_large_image">\n    <meta name="twitter:title" content="${title}">\n    <meta name="twitter:description" content="${desc}">\n    <meta name="twitter:image" content="${OG}">`);
  }
  if (!html.includes('og:description')) {
    html = html.replace(/(<meta property="og:title"[^>]*>)/, `$1\n    <meta property="og:description" content="${desc}">\n    <meta property="og:image" content="${OG}">\n    <meta property="og:site_name" content="EasyApplications">`);
  }
  fs.writeFileSync(file, html);
  console.log('Hub:', slug);
});

console.log('All patches done.');