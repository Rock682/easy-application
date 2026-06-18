const fs = require('fs');
const path = require('path');

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (f.endsWith('.html')) files.push(p);
  }
  return files;
}

const ROOT = path.join(__dirname, '..');
const files = walk(ROOT).filter(f => !f.includes('scripts'));
let score = 0, max = 0, issues = [];

files.forEach(file => {
  const html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);
  const checks = [
    ['title', /<title>[^<]+<\/title>/],
    ['description', /<meta name="description"/],
    ['canonical', /<link rel="canonical"/],
    ['robots', /<meta name="robots"/],
    ['h1', /<h1[^>]*>/],
    ['og:title', /<meta property="og:title"|<meta name="og:title"/],
    ['schema', /application\/ld\+json/],
    ['hreflang', /hreflang/],
  ];
  checks.forEach(([name, re]) => {
    max++;
    if (re.test(html)) score++;
    else issues.push(`${rel}: missing ${name}`);
  });
});

console.log(`SEO Audit: ${score}/${max} checks passed (${((score/max)*10).toFixed(1)}/10)`);
if (issues.length) {
  console.log('\nIssues:');
  issues.forEach(i => console.log(' -', i));
} else {
  console.log('All pages pass core SEO checks.');
}