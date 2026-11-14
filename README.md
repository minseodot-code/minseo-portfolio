# minseo-portfolio
Instagram-style portfolio. Static HTML, no build step. Deploy to Vercel (Framework: Other).

## Files
- `index.html`: page shell (top bar, profile, highlights, tabs, contact)
- `style.css`: all styles
- `data/posts.json`: grid tiles (`grid`) and feed posts (`posts`). Edit content here.
- `script.js`: reads `data/posts.json` and renders the grid and feed

Text fields in `posts.json` are inserted as HTML, so `<b>` and `<br>` work.

## Local preview
`fetch` does not work on `file://`, so serve the folder instead of opening `index.html` directly:

    python3 -m http.server 8000
