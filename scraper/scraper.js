const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('https://cets.apsche.ap.gov.in/EAPCET/', {
    waitUntil: 'networkidle'
  });

  await page.waitForTimeout(3000);

  const data = await page.evaluate(() => {
    let items = [];

    const validKeywords = [
      'notification',
      'application',
      'schedule',
      'exam',
      'result',
      'hall ticket',
      'last date',
      'rank card'
    ];

    const invalidKeywords = [
      'step',
      'login',
      'status',
      'print',
      'payment',
      'caste',
      'reservation',
      'scholarship'
    ];

    const examKeywords = [
      'eapcet',
      'eamcet',
      'cet'
    ];

    document.querySelectorAll('a').forEach(el => {
      const text = el.innerText.trim().toLowerCase();

      if (
        text.length > 15 &&
        validKeywords.some(k => text.includes(k)) &&
        !invalidKeywords.some(k => text.includes(k)) &&
        examKeywords.some(k => text.includes(k))
      ) {
        items.push({
          exam: "AP EAPCET",
          title: el.innerText.trim(),
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
