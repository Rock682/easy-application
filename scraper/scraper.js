const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('https://cets.apsche.ap.gov.in/EAPCET/', {
    waitUntil: 'networkidle'
  });

  await page.waitForTimeout(4000);

  const data = await page.evaluate(() => {
    let items = [];

    // 🔥 Target LEFT SIDE panel (real notifications)
    const links = document.querySelectorAll('.panel-body a');

    links.forEach(el => {
      const text = el.innerText.trim();

      if (text.length > 5) {
        items.push({
          exam: "AP EAPCET",
          title: text,
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
