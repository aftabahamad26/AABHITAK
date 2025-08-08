# News Aggregator

A customizable news aggregator that fetches real-time news from multiple sources.

## Features

- 📰 Real-time news from NewsAPI.org and BBC RSS feed
- 🎨 Customizable theme and colors
- 🔍 Search functionality
- 📱 Responsive design
- 🌙 Dark/Light theme toggle
- 📊 Category filtering
- ⚙️ Settings panel

## Setup Instructions

### 1. Get Free NewsAPI Key

1. Go to [https://newsapi.org](https://newsapi.org)
2. Click "Get API Key" 
3. Sign up for a free account
4. Copy your API key

### 2. Configure API Key

1. Open `config.js`
2. Replace `YOUR_NEWS_API_KEY_HERE` with your actual API key:

```javascript
NEWS_API_KEY: 'your_actual_api_key_here',
```

### 3. Run the Application

1. Open terminal in the project directory
2. Run: `python3 -m http.server 8000`
3. Open browser and go to: `http://localhost:8000`

## Data Sources

The app tries to fetch news in this order:

1. **NewsAPI.org** (Primary) - Requires API key
2. **BBC RSS Feed** (Fallback) - Free, no API key needed
3. **Mock Data** (Last resort) - Demo articles

## Troubleshooting

### If you see dummy data:

1. **Check API Key**: Make sure your NewsAPI key is valid
2. **API Limits**: Free NewsAPI accounts have daily limits
3. **Network Issues**: Check your internet connection

### Error Messages:

- `API_KEY_NOT_CONFIGURED`: Add your API key to config.js
- `INVALID_API_KEY`: Get a new API key from newsapi.org
- `Too Many Requests`: Wait or upgrade your API plan

## Customization

The app includes a settings panel where you can:

- Change primary and background colors
- Select different font families
- Adjust font size
- Toggle between grid and list layouts
- Switch between light and dark themes

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

This project is open source and available under the MIT License. 