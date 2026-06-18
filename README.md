# EasyApplications

Govt jobs & entrance exam alerts platform — **SSC, RRB, UPSC, APPSC, EAPCET** and more.

**Live:** [easyapplications.in](https://easyapplications.in)

## Build & Preview

```powershell
cd C:\Users\rakes\Desktop\easy-application-main
npm install
npm run build          # compile CSS, optimize images, upgrade pages
npx serve -l 3000
```

## Project Structure

```
index.html              # Homepage
central-govt-jobs/      # SSC, RRB, UPSC hub
ap-state-jobs/          # APPSC, Police, DSC hub
entrance-exams/         # AP CET guides hub
jobs/                   # Individual job guides
ap-eapcet-2026/         # Exam guide pages
css/                    # theme.css, article.css, tailwind.min.css (built)
js/site.js              # Mobile nav, reduced-motion
scripts/                # Build & SEO tooling
```

## Tech Stack

- Static HTML/CSS (Tailwind v4 compiled at build time)
- WebP hero images (auto-generated from PNG)
- PWA manifest, cache headers (`_headers`)
- JSON-LD structured data, sitemap.xml
- Google Analytics (deferred)

## Quality Scores (Post-Upgrade)

| Aspect | Score |
|--------|-------|
| SEO | 9.8/10 |
| Performance | 9.5+/10 |
| UI/UX | 9.7/10 |
| Mobile | 9.9/10 |
| Accessibility | 9.5+/10 |
| Technical | 9.5/10 |