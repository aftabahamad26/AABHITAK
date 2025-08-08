import express from 'express';
import { apiKey } from './config.js';

const app = express();

app.get('/api/news', async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    const country = req.query.country || 'us';
    const pageSize = req.query.pageSize || '100';

    const url = `https://newsapi.org/v2/top-headlines?country=${encodeURIComponent(country)}&pageSize=${encodeURIComponent(pageSize)}`;
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
