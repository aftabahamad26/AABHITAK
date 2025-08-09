import express from 'express';
import { apiKey } from './config.js';

const app = express();

app.get('/api/news', async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    const mode = (req.query.mode || 'top-headlines').toString();
    const country = (req.query.country || 'us').toString();
    const pageSize = (req.query.pageSize || '1000').toString();
    const language = (req.query.language || 'en').toString();
    const query = (req.query.q || 'news').toString();

    let url;
    if (mode === 'everything') {
      const from = new Date(Date.now() - 10*24 * 60 * 60 * 1000).toISOString();
      url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=${encodeURIComponent(language)}&from=${encodeURIComponent(from)}&sortBy=publishedAt&pageSize=${encodeURIComponent(pageSize)}`;
    } else if (mode === 'bundle') {
      // Aggregate across multiple categories to increase volume
      const categoriesParam = (req.query.categories || 'business,technology,sports,entertainment,health,science').toString();
      const categories = categoriesParam.split(',').map(c => c.trim()).filter(Boolean);
      const perCategory = Math.max(5, Math.floor(Number(pageSize) / Math.max(1, categories.length)));

      const requests = categories.map(cat => {
        const endpoint = `https://newsapi.org/v2/top-headlines?country=${encodeURIComponent(country)}&category=${encodeURIComponent(cat)}&pageSize=${encodeURIComponent(perCategory)}`;
        return fetch(endpoint, { headers: { 'Accept': 'application/json', 'X-Api-Key': apiKey } })
          .then(r => r.text().then(t => ({ status: r.status, body: t })))
          .catch(() => ({ status: 500, body: '' }));
      });

      const results = await Promise.all(requests);
      const articles = [];
      const seen = new Set();
      for (const r of results) {
        if (r.status !== 200) continue;
        try {
          const json = JSON.parse(r.body);
          const arr = Array.isArray(json.articles) ? json.articles : [];
          for (const a of arr) {
            const key = a.url || a.title;
            if (!key || seen.has(key)) continue;
            seen.add(key);
            articles.push(a);
            if (articles.length >= Number(pageSize)) break;
          }
          if (articles.length >= Number(pageSize)) break;
        } catch {}
      }

      return res.status(200).json({ status: 'ok', articles });
    } else {
      url = `https://newsapi.org/v2/top-headlines?country=${encodeURIComponent(country)}&pageSize=${encodeURIComponent(pageSize)}`;
    }
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': apiKey,
      },
    });

    const text = await response.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { status: 'error', message: 'Upstream returned non-JSON', raw: text.slice(0, 500) }; }

    res.status(response.status).json(json);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
