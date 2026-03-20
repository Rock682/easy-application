const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('https://cets.apsche.ap.gov.in/EAPCET/', {
    waitUntil: 'domcontentloaded'
  });

  // wait for links to actually appear
  await page.waitForSelector('a', { timeout: 10000 });

  const links = await page.locator('a').all();

  let items = [];

  for (const link of links) {
    const text = (await link.innerText()).trim();
    const href = await link.getAttribute('href');

    if (
      text.length > 10 &&
      (
        text.toLowerCase().includes('notification') ||
        text.toLowerCase().includes('application') ||
        text.toLowerCase().includes('schedule') ||
        text.toLowerCase().includes('exam') ||
        text.toLowerCase().includes('result')
      ) &&
      !text.toLowerCase().includes('step') &&
      !text.toLowerCase().includes('login')
    ) {
      items.push({
        exam: "AP EAPCET",
        title: text,
        link: href,
        date: new Date().toISOString().split('T')[0]
      });
    }
  }

  await browser.close();

  fs.writeFileSync('data/exams.json', JSON.stringify(items, null, 2));
})();
