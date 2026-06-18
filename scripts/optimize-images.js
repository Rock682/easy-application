const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');

async function optimize() {
  const heroes = fs.readdirSync(ROOT).filter(f => f.endsWith('-hero.png'));
  for (const file of heroes) {
    const src = path.join(ROOT, file);
    const webp = path.join(ROOT, file.replace('.png', '.webp'));
    await sharp(src).webp({ quality: 78 }).resize(1200, null, { withoutEnlargement: true }).toFile(webp);
    const kb = (fs.statSync(webp).size / 1024).toFixed(1);
    console.log(`${file} → ${path.basename(webp)} (${kb} KB)`);
  }

  const fav = path.join(ROOT, 'favicon.png');
  const logo = path.join(ROOT, 'logo.png');
  await sharp(fav).resize(192, 192).png({ quality: 80 }).toFile(logo);
  await sharp(fav).resize(32, 32).png().toFile(path.join(ROOT, 'favicon-32.png'));
  console.log('logo.png and favicon-32.png created');
}

optimize().catch(e => { console.error(e); process.exit(1); });