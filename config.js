import dotenv from 'dotenv';
dotenv.config();
const CONFIG = {
   
    NEWS_API_KEY: process.env.NEWS_API_KEY, // Get your free API key from https://newsapi.org/
    NEWS_API_URL: 'https://newsapi.org/v2/top-headlines',
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} 