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

    // 🔥 Target only visible notification sections
    const sections = document.querySelectorAll('ul, table');

    sections.forEach(section => {
      section.querySelectorAll('a').forEach(el => {
        const text = el.innerText.trim();

        if (
          text.length > 10 &&
          (
            text.includes('Notification') ||
            text.includes('Application') ||
            text.includes('Exam') ||
            text.includes('Result') ||
            text.includes('Hall Ticket')
          )
        ) {
          items.push({
            exam: "AP EAPCET",
            title: text,
            link: el.href,
            date: new Date().toISOString().split('T')[0]
          });
        }
      });
    });

    return items;
  });

  await browser.close();

  fs.writeFileSync('data/exams.json', JSON.stringify(data, null, 2));
})();
