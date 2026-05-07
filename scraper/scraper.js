const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const examData = {
    exam: 'AP EAPCET',
    dates: [],
    updates: []
  };

  // =========================
  // 🔹 IMPORTANT DATES PAGE
  // =========================
  await page.goto('https://cets.apsche.ap.gov.in/EAPCET/EapcetHomepages/ImportantDates.aspx', {
    waitUntil: 'domcontentloaded'
  });

  await page.waitForTimeout(3000);

  const dates = await page.evaluate(() => {
    const items = [];
    const rows = document.querySelectorAll('table tr');

    rows.forEach(row => {
      const cols = Array.from(row.querySelectorAll('td')).map(col => col.innerText.trim()).filter(Boolean);

      if (cols.length >= 2) {
        const [event, ...dateParts] = cols;
        const date = dateParts.join(' ');

        if (event && date && !/^s\.?no/i.test(event)) {
          items.push({ event, date });
        }
      }
    });

    return items;
  });

  examData.dates = dates;

  // =========================
  // 🔹 HOMEPAGE (optional updates)
  // =========================
  await page.goto('https://cets.apsche.ap.gov.in/EAPCET/Eapcet/EAPCET_HomePage', {
    waitUntil: 'domcontentloaded'
  });

  await page.waitForTimeout(3000);

  const updates = await page.evaluate(() => {
    const items = [];

    document.querySelectorAll('a').forEach(el => {
      const text = el.innerText.trim();

      if (
        text.length > 10 &&
        (
          text.includes('Notification') ||
          text.includes('Application') ||
          text.includes('Result') ||
          text.includes('Hall Ticket')
        )
      ) {
        items.push({
          title: text,
          link: el.href,
          date: new Date().toISOString().split('T')[0]
        });
      }
    });

    return items;
  });

  examData.updates = updates;

  await browser.close();

  fs.writeFileSync('data/exams.json', JSON.stringify([examData], null, 2));
})();
