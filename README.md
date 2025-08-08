## AABHI TAK – News Aggregator

Customizable, responsive news dashboard. Frontend is a static site. Backend is a small Node/Express proxy that securely calls NewsAPI with your server-side key (no secrets in the browser).

### Features
- 📰 Real-time top headlines via NewsAPI (through backend proxy)
- 🧩 Enrichment fallback to increase article volume (category bundle + “everything” when needed)
- 🗞️ BBC RSS fallback if API unavailable
- 🔍 Search and category filters
- 🎨 Theme, font, layout, and size customization
- 🌙 Dark/light mode

### Project structure
```
ABHITAK/
  Backend/            # Express proxy server (keeps API key on server)
    server.js
    config.js         # loads NEWS_API_KEY from environment
    package.json
    .gitignore        # ignores Backend/.env and node_modules
  index.html          # static frontend
  config.js           # client config (no secrets here)
  script.js           # app logic
  style.css, variables.css
```

### Quick start (local)
1) Backend
- cd Backend
- Create `.env` with your key:
  - `NEWS_API_KEY=your_real_key`
- Install and run:
  - `npm install`
  - `npm start` (defaults to http://localhost:3000)

2) Frontend
- Ensure `config.js` has the proxy URL:
  - `NEWS_API_PROXY_URL: 'http://localhost:3000/api/news'`
- Serve the static files (any simple server):
  - `python3 -m http.server 8000` (or VSCode Live Server, etc.)
  - Open `http://localhost:8000`

Note: Do not put API keys in `config.js`. The browser cannot keep secrets. The key belongs only in Backend/.env or your hosting provider’s environment settings.

### Deployment
Backend (Render recommended)
- Create new Web Service from this repo, set root directory to `Backend`
- Build command: `npm install`
- Start command: `npm start`
- Add environment variable `NEWS_API_KEY`
- Deploy and note the URL, e.g. `https://<your-service>.onrender.com`

Frontend (Vercel recommended)
- Import this repo into Vercel (Framework: “Other”)
- Build command: none
- Output directory: root
- Ensure `config.js` uses your Render URL, e.g.:
  - `NEWS_API_PROXY_URL: 'https://<your-service>.onrender.com/api/news'`
- Deploy

### Configuration (client `config.js`)
- `NEWS_API_KEY`: leave empty on the client
- `NEWS_API_PROXY_URL`: URL of your backend `/api/news`
- `NEWS_API_COUNTRY`: e.g. `us`, `in`, `gb`
- `ARTICLES_PER_PAGE`: requested size (NewsAPI caps at 100)
- Other UI options: refresh interval, caching, theme settings

### API behavior and limits
- NewsAPI free tier has request and endpoint limitations.
- Top headlines are limited by country/category; using enrichment (“bundle” + “everything”) helps increase count and freshness.
- “Everything” endpoint may have additional restrictions on production usage—volume depends on plan.
- BBC RSS fallback is included if API requests fail.

### Troubleshooting
- Few or older articles: try a different `NEWS_API_COUNTRY`, and rely on enrichment via the backend. Volume depends on NewsAPI plan and current headlines.
- 401/Unauthorized: ensure `NEWS_API_KEY` is set on the backend (Render/Backend/.env) and not expired.
- 429/Too Many Requests: you hit rate limits; wait or upgrade plan.
- CORS: the backend sets permissive CORS for the frontend; always call NewsAPI through the backend from the browser.

### License
MIT