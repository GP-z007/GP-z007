# Gokul Prasath — Hermes-inspired portfolio

A standalone portfolio landing page inspired by the visual language and page rhythm of the Hermes Agent website, but with Gokul Prasath / GP-z007 content.

## Run it

No npm install is required.

```bash
cd gokul-hermes-portfolio
python3 -m http.server 8080
```

Open:

```text
http://localhost:8080
```

You can also deploy the folder directly to Vercel, Netlify, GitHub Pages, Cloudflare Pages, or any static host.

## Files

```text
.
├── index.html
├── styles.css
├── app.js
└── README.md
```

## Live data

The GitHub profile statistics and recent repository list are fetched client-side from the public GitHub API for:

```text
GP-z007
```

If GitHub rate-limits an unauthenticated browser request, the page gracefully falls back to a link to the profile.

## Visual reference

The layout and aesthetic are based on:

- https://hermes-agent.nousresearch.com/
- https://github.com/NousResearch/hermes-agent/tree/main/website

The page references Hermes landing-page artwork from Nous Research's public web asset host to preserve the requested visual language. Branding, copy, profile data, navigation, projects, and portfolio content are Gokul's.
