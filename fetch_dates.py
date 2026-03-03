import urllib.request
import re

urls = [
    "https://cets.apsche.ap.gov.in/EAPCET/EapcetHomepages/ImportantDates",
    "https://cets.apsche.ap.gov.in/EDCET/EDCETHomePages/ImportantDates",
    "https://cets.apsche.ap.gov.in/ECET/UI/ImportantDates",
    "https://cets.apsche.ap.gov.in/ICET/ICETHomePages/ImportantDates",
    "https://cets.apsche.ap.gov.in/PGECET/UI/ImportantDates",
    "https://cets.apsche.ap.gov.in/PECET/PECETHomePages/ImportantDates",
    "https://cets.apsche.ap.gov.in/PGCET/PGCET/PGCET_HomePage",
    "https://cets.apsche.ap.gov.in/LAWCET/LAWCET/LAWCET_HomePage"
]

for url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8', errors='ignore')
        
        # crude extraction of table rows
        # find all <tr> tags
        trs = re.findall(r'<tr[^>]*>(.*?)</tr>', html, flags=re.DOTALL | re.IGNORECASE)
        print(f"\\n{'='*50}\\n{url}\\n{'='*50}")
        if trs:
            for tr in trs:
                # strip tags
                row_text = re.sub(r'<[^>]+>', ' ', tr)
                # clean whitespace
                row_text = ' '.join(row_text.split())
                if row_text and ('202' in row_text or 'Date' in row_text):
                    print(row_text)
        else:
            # Maybe it's not in a table format, just print lines with 2026 and surrounding context
            clean_text = ' '.join(re.sub(r'<[^>]+>', ' ', html).split())
            matches = re.finditer(r'(.{0,50})(2026\b|2025\b|Date)(.{0,50})', clean_text, flags=re.IGNORECASE)
            for m in matches:
                print(f"...{m.group(0)}...")
                
    except Exception as e:
        print(f"Error for {url}: {e}")
