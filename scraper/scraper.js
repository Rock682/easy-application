const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  let results = [];

  // =========================
  // 🔹 IMPORTANT DATES PAGE
  // =========================
  await page.goto('https://cets.apsche.ap.gov.in/EAPCET/EapcetHomepages/ImportantDates', {
    waitUntil: 'domcontentloaded'
  });

  await page.waitForTimeout(3000);

  const dates = await page.evaluate(() => {
    let items = [];

    // Target table rows (important dates are in table)
    const rows = document.querySelectorAll('table tr');

    rows.forEach(row => {
      const cols = row.querySelectorAll('td');

      if (cols.length >= 2) {
        const title = cols[0].innerText.trim();
        const date = cols[1].innerText.trim();

        if (title && date) {
          items.push({
            exam: "AP EAPCET",
            type: "important_date",
            title: title,
            date: date,
            link: window.location.href
          });
        }
      }
    });

    return items;
  });

  results.push(...dates);

  // =========================
  // 🔹 HOMEPAGE (optional updates)
  // =========================
  await page.goto('https://cets.apsche.ap.gov.in/EAPCET/Eapcet/EAPCET_HomePage', {
    waitUntil: 'domcontentloaded'
  });

  await page.waitForTimeout(3000);

  const updates = await page.evaluate(() => {
    let items = [];

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
          exam: "AP EAPCET",
          type: "update",
          title: text,
          link: el.href,
          date: new Date().toISOString().split('T')[0]
        });
      }
    });

    return items;
  });

  results.push(...updates);

  await browser.close();

  fs.writeFileSync('data/exams.json', JSON.stringify(results, null, 2));
})();
