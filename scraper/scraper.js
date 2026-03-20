const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('https://cets.apsche.ap.gov.in/EAPCET/', {
    waitUntil: 'networkidle' // 🔥 FIXED HERE
  });

  // Extra wait for safety
  await page.waitForTimeout(3000);

  const data = await page.evaluate(() => {
    let items = [];

    document.querySelectorAll('a').forEach(el => {
      const text = el.innerText;

      if (text && (text.includes('Notification') || text.includes('Application'))) {
        items.push({
          exam: "AP EAPCET",
          title: text.trim(),
          link: el.href,
          date: new Date().toISOString().split('T')[0]
        });
      }
    });

    return items;
  });

  await browser.close();

  fs.writeFileSync('data/exams.json', JSON.stringify(data, null, 2));
})();
