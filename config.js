// Configuration for News Aggregator (browser global)
const CONFIG = {
    // Do not put secrets in client config when committing. Leave blank.
    NEWS_API_KEY: '',
    NEWS_API_URL: 'https://newsapi.org/v2/top-headlines',
    // Optional: Your own proxy endpoint to call NewsAPI server-side (avoids CORS and keeps key safer)
    // Example: 'https://your-domain.com/api/news' or a Cloudflare Worker/Vercel function URL
    NEWS_API_PROXY_URL: 'http://localhost:3000/api/news',
    NEWS_API_COUNTRY: 'us',
    ARTICLES_PER_PAGE: 100, // Increased from 20 to 100
    AUTO_REFRESH_INTERVAL: 300000,
    CACHE_DURATION: 600000,
    USE_MOCK_DATA_AS_FALLBACK: true,
    SHOW_API_ERRORS: true,
    USE_FREE_API_AS_FALLBACK: true,
    API_HEADERS: {
        'Accept': 'application/json',
        'User-Agent': 'NewsAggregator/1.0'
    }
};