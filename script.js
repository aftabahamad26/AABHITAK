

class NewsAggregator {
    constructor() {
        this.newsData = [];
        this.filteredNews = [];
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.currentLayout = 'grid';
        this.settings = this.loadSettings();

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.applySettings();
        this.fetchNews();
    }

    setupEventListeners() {

        document.getElementById('settingsBtn').addEventListener('click', () => this.toggleSettings());
        document.getElementById('closeSettings').addEventListener('click', () => this.toggleSettings());
        document.getElementById('overlay').addEventListener('click', () => this.toggleSettings());


        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        document.getElementById('clearSearch').addEventListener('click', () => this.clearSearch());

        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleCategoryFilter(e.target.dataset.category));
        });

        this.setupSettingsControls();

        document.querySelectorAll('.layout-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleLayoutChange(e.target.dataset.layout));
        });

        document.getElementById('resetSettings').addEventListener('click', () => this.resetSettings());
    }


    setupSettingsControls() {

        document.getElementById('primaryColor').addEventListener('change', (e) => {
            this.updateSetting('primaryColor', e.target.value);
        });

        document.getElementById('backgroundColor').addEventListener('change', (e) => {
            this.updateSetting('backgroundColor', e.target.value);
        });


        document.getElementById('fontFamily').addEventListener('change', (e) => {
            this.updateSetting('fontFamily', e.target.value);
        });


        const fontSizeSlider = document.getElementById('fontSize');
        const fontSizeValue = document.getElementById('fontSizeValue');

        fontSizeSlider.addEventListener('input', (e) => {
            const size = e.target.value;
            fontSizeValue.textContent = `${size}px`;
            this.updateSetting('fontSize', size);
        });
    }

    async testAPIKey() {
        try {
            const testResponse = await fetch(`${CONFIG.NEWS_API_URL}?country=us&apiKey=${CONFIG.NEWS_API_KEY}&pageSize=1`);

            if (testResponse.ok) {
                const testData = await testResponse.json();
                if (testData.status === 'ok') {
                    return true;
                } else {
                    console.error('❌ API key test failed:', testData.message);
                    return false;
                }
            } else {
                console.error('❌ API key test failed with status:', testResponse.status);
                return false;
            }
        } catch (error) {
            console.error('❌ API key test error:', error);
            return false;
        }
    }

    async fetchNews() {
        this.showLoading(true);

        try {

            if (!CONFIG.NEWS_API_PROXY_URL && (!CONFIG.NEWS_API_KEY || CONFIG.NEWS_API_KEY === 'YOUR_NEWS_API_KEY')) {
                throw new Error('API_KEY_NOT_CONFIGURED');
            }

            try {
                await this.testAPIKey();
            } catch (precheckError) {
                console.warn('API key precheck failed, will still attempt main requests:', precheckError);
            }

            if (CONFIG.NEWS_API_PROXY_URL) {
                try {
                    console.log('🌐 Trying configured proxy endpoint...');
                    const proxyEndpointUrl = `${CONFIG.NEWS_API_PROXY_URL}?country=${CONFIG.NEWS_API_COUNTRY}&pageSize=${CONFIG.ARTICLES_PER_PAGE}`;
                    const proxyEndpointResp = await fetch(proxyEndpointUrl, { headers: { 'Accept': 'application/json' } });
                    console.log('📡 Configured proxy response status:', proxyEndpointResp.status);
                    if (!proxyEndpointResp.ok) {
                        const errorText = await proxyEndpointResp.text();
                        throw new Error(`Configured proxy HTTP error ${proxyEndpointResp.status}: ${errorText}`);
                    }
                    const proxyEndpointData = await proxyEndpointResp.json();
                    if (proxyEndpointData.status === 'error') {
                        throw new Error(proxyEndpointData.message || 'Configured proxy API error');
                    }
                    this.newsData = proxyEndpointData.articles.map((article, index) => ({
                        id: index + 1,
                        title: article.title || 'No title available',
                        description: article.description || 'No description available',
                        url: article.url || '#',
                        urlToImage: article.urlToImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=300&fit=crop',
                        source: { name: article.source?.name || 'Unknown Source' },
                        publishedAt: article.publishedAt || new Date().toISOString(),
                        category: this.categorizeArticle(article.title, article.description)
                    }));
                    this.filteredNews = [...this.newsData];
                    this.renderNews();
                    if (CONFIG.SHOW_API_ERRORS) {
                        this.showSuccessMessage(`✅ Loaded ${this.newsData.length} real-time news via configured proxy!`);
                    }
                    return;
                } catch (configuredProxyErr) {
                    console.error('Configured proxy failed, will try direct NewsAPI and public proxies:', configuredProxyErr);
                }
            }

            let response;
            try {
                console.log('🔍 Trying NewsAPI.org...');
                const url = `${CONFIG.NEWS_API_URL}?country=${CONFIG.NEWS_API_COUNTRY}&pageSize=${CONFIG.ARTICLES_PER_PAGE}`;
                response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'X-Api-Key': CONFIG.NEWS_API_KEY
                    }
                });

                console.log('📡 NewsAPI response status:', response.status);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('❌ NewsAPI HTTP error:', response.status, errorText);
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('📊 NewsAPI data received:', data.status, 'articles:', data.articles?.length);

                if (data.status === 'error') {
                    console.error('❌ NewsAPI error:', data.message);
                    throw new Error(data.message || 'API Error');
                }

                this.newsData = data.articles.map((article, index) => ({
                    id: index + 1,
                    title: article.title || 'No title available',
                    description: article.description || 'No description available',
                    url: article.url || '#',
                    urlToImage: article.urlToImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=300&fit=crop',
                    source: { name: article.source?.name || 'Unknown Source' },
                    publishedAt: article.publishedAt || new Date().toISOString(),
                    category: this.categorizeArticle(article.title, article.description)
                }));

                this.filteredNews = [...this.newsData];
                this.renderNews();

                if (CONFIG.SHOW_API_ERRORS) {
                    this.showSuccessMessage(`✅ Loaded ${this.newsData.length} real-time news articles from NewsAPI.org!`);
                }
                return;

            } catch (error) {
                console.error('❌ NewsAPI failed, trying CORS proxy:', error);

                try {
                    console.log('🌐 Trying CORS proxy...');
                    const proxiedUrl = `${CONFIG.NEWS_API_URL}?country=${CONFIG.NEWS_API_COUNTRY}&pageSize=${CONFIG.ARTICLES_PER_PAGE}&apiKey=${encodeURIComponent(CONFIG.NEWS_API_KEY)}`;
                    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(proxiedUrl)}`;
                    response = await fetch(proxyUrl);

                    console.log('📡 CORS proxy response status:', response.status);

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('❌ CORS proxy error:', response.status, errorText);
                        throw new Error(`CORS proxy error! status: ${response.status}`);
                    }
                    let dataText = await response.text();
                    let data;
                    try {
                        data = JSON.parse(dataText);
                    } catch (_) {
                        console.warn('AllOrigins returned non-JSON; attempting fallback parsing');
                        data = {};
                    }
                    console.log('📊 CORS proxy data received:', data.status, 'articles:', data.articles?.length);

                    if (data.status === 'error') {
                        console.error('❌ CORS proxy API error:', data.message);
                        throw new Error(data.message || 'API Error');
                    }

                    this.newsData = data.articles.map((article, index) => ({
                        id: index + 1,
                        title: article.title || 'No title available',
                        description: article.description || 'No description available',
                        url: article.url || '#',
                        urlToImage: article.urlToImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=300&fit=crop',
                        source: { name: article.source?.name || 'Unknown Source' },
                        publishedAt: article.publishedAt || new Date().toISOString(),
                        category: this.categorizeArticle(article.title, article.description)
                    }));

                    this.filteredNews = [...this.newsData];
                    this.renderNews();

                    if (CONFIG.SHOW_API_ERRORS) {
                        this.showSuccessMessage(`✅ Loaded ${this.newsData.length} real-time news articles via CORS proxy!`);
                    }
                    return;

                } catch (proxyError) {
                    console.error('❌ CORS proxy failed:', proxyError);
                    try {
                        console.log('🌐 Trying secondary CORS proxy...');
                        const secondProxyUrl = `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(proxiedUrl)}`;
                        response = await fetch(secondProxyUrl);

                        console.log('📡 Secondary proxy response status:', response.status);

                        if (!response.ok) {
                            const errorText = await response.text();
                            console.error('❌ Secondary proxy error:', response.status, errorText);
                            throw new Error(`Secondary proxy error! status: ${response.status}`);
                        }

                        let dataText2 = await response.text();
                        let data;
                        try {
                            data = JSON.parse(dataText2);
                        } catch (_) {
                            console.warn('Secondary proxy returned non-JSON; attempting fallback parsing');
                            data = {};
                        }
                        console.log('📊 Secondary proxy data received:', data.status, 'articles:', data.articles?.length);

                        if (data.status === 'error') {
                            console.error('❌ Secondary proxy API error:', data.message);
                            throw new Error(data.message || 'API Error');
                        }

                        this.newsData = data.articles.map((article, index) => ({
                            id: index + 1,
                            title: article.title || 'No title available',
                            description: article.description || 'No description available',
                            url: article.url || '#',
                            urlToImage: article.urlToImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=300&fit=crop',
                            source: { name: article.source?.name || 'Unknown Source' },
                            publishedAt: article.publishedAt || new Date().toISOString(),
                            category: this.categorizeArticle(article.title, article.description)
                        }));

                        this.filteredNews = [...this.newsData];
                        this.renderNews();

                        if (CONFIG.SHOW_API_ERRORS) {
                            this.showSuccessMessage(`✅ Loaded ${this.newsData.length} real-time news articles via secondary CORS proxy!`);
                        }
                        return;
                    } catch (secondProxyError) {
                        console.error('❌ Secondary proxy also failed:', secondProxyError);
                        try {
                            console.log('🌐 Trying tertiary CORS proxy...');
                            const thirdProxyUrl = `https://corsproxy.io/?${encodeURIComponent(proxiedUrl)}`;
                            response = await fetch(thirdProxyUrl);

                            console.log('📡 Tertiary proxy response status:', response.status);

                            if (!response.ok) {
                                const errorText = await response.text();
                                console.error('❌ Tertiary proxy error:', response.status, errorText);
                                throw new Error(`Tertiary proxy error! status: ${response.status}`);
                            }

                            let dataText3 = await response.text();
                            let data;
                            try {
                                data = JSON.parse(dataText3);
                            } catch (_) {
                                console.warn('Tertiary proxy returned non-JSON; attempting fallback parsing');
                                data = {};
                            }

                            if (data.status === 'error') {
                                console.error('❌ Tertiary proxy API error:', data.message);
                                throw new Error(data.message || 'API Error');
                            }

                            this.newsData = data.articles.map((article, index) => ({
                                id: index + 1,
                                title: article.title || 'No title available',
                                description: article.description || 'No description available',
                                url: article.url || '#',
                                urlToImage: article.urlToImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=300&fit=crop',
                                source: { name: article.source?.name || 'Unknown Source' },
                                publishedAt: article.publishedAt || new Date().toISOString(),
                                category: this.categorizeArticle(article.title, article.description)
                            }));

                            this.filteredNews = [...this.newsData];
                            this.renderNews();

                            if (CONFIG.SHOW_API_ERRORS) {
                                this.showSuccessMessage(`✅ Loaded ${this.newsData.length} real-time news via tertiary CORS proxy!`);
                            }
                            return;
                        } catch (thirdProxyError) {
                            console.error('❌ Tertiary proxy also failed:', thirdProxyError);

                            throw error;
                        }
                    }
                }
            }
        } catch (error) {

            try {
                const rssResponse = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://feeds.bbci.co.uk/news/rss.xml');

                if (rssResponse.ok) {
                    const rssData = await rssResponse.json();

                    if (rssData.status === 'ok' && rssData.items) {

                        this.newsData = rssData.items.map((item, index) => ({
                            id: index + 1,
                            title: item.title || 'No title available',
                            description: item.description || 'No description available',
                            url: item.link || '#',
                            urlToImage: item.thumbnail || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=300&fit=crop',
                            source: { name: 'BBC News' },
                            publishedAt: item.pubDate || new Date().toISOString(),
                            category: this.categorizeArticle(item.title, item.description)
                        }));

                        this.filteredNews = [...this.newsData];
                        this.renderNews();

                        if (CONFIG.SHOW_API_ERRORS) {
                            this.showSuccessMessage(`📰 Loaded ${this.newsData.length} articles from BBC RSS feed (NewsAPI failed)`);
                        }
                        return;
                    }
                }
            } catch (rssError) {
                console.error('RSS feed also failed:', rssError);
            }


            if (error && typeof error.message === 'string') {
                if (error.message === 'API_KEY_NOT_CONFIGURED') {
                    this.showError('Please configure your NewsAPI key in config.js to fetch real news. Using demo data instead.');
                } else if (error.message === 'INVALID_API_KEY') {
                    this.showError('Invalid API key. Please check your NewsAPI key in config.js. Using demo data instead.');
                } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                    this.showError('Invalid API key. Please check your NewsAPI key in config.js. Using demo data instead.');
                } else if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
                    this.showError('API rate limit exceeded. Using demo data instead.');
                } else {
                    this.showError(`Failed to load real-time news: ${error.message}. Using demo data instead.`);
                }
            } else {
                this.showError('Failed to load real-time news. Using demo data instead.');
            }


            if (CONFIG.USE_MOCK_DATA_AS_FALLBACK) {
                const mockNews = this.getMockNewsData();
                this.newsData = mockNews;
                this.filteredNews = [...this.newsData];
                this.renderNews();
            }
        } finally {
            this.showLoading(false);
        }
    }


    categorizeArticle(title, description) {
        const content = (title + ' ' + description).toLowerCase();


        if (content.includes('business') || content.includes('market') || content.includes('economy') ||
            content.includes('finance') || content.includes('stock') || content.includes('investment') ||
            content.includes('banking') || content.includes('trading') || content.includes('wall street') ||
            content.includes('earnings') || content.includes('revenue') || content.includes('profit') ||
            content.includes('ceo') || content.includes('company') || content.includes('corporate')) {
            return 'business';
        }

        else if (content.includes('tech') || content.includes('ai') || content.includes('artificial intelligence') ||
            content.includes('software') || content.includes('digital') || content.includes('computer') ||
            content.includes('internet') || content.includes('social media') || content.includes('app') ||
            content.includes('startup') || content.includes('innovation') || content.includes('cyber') ||
            content.includes('data') || content.includes('algorithm') || content.includes('platform')) {
            return 'technology';
        }

        else if (content.includes('sport') || content.includes('football') || content.includes('basketball') ||
            content.includes('tennis') || content.includes('olympic') || content.includes('baseball') ||
            content.includes('soccer') || content.includes('golf') || content.includes('hockey') ||
            content.includes('championship') || content.includes('league') || content.includes('team') ||
            content.includes('player') || content.includes('coach') || content.includes('game')) {
            return 'sports';
        }

        else if (content.includes('movie') || content.includes('film') || content.includes('entertainment') ||
            content.includes('celebrity') || content.includes('music') || content.includes('actor') ||
            content.includes('actress') || content.includes('director') || content.includes('award') ||
            content.includes('concert') || content.includes('album') || content.includes('show') ||
            content.includes('tv') || content.includes('television') || content.includes('streaming')) {
            return 'entertainment';
        }

        else if (content.includes('health') || content.includes('medical') || content.includes('covid') ||
            content.includes('vaccine') || content.includes('treatment') || content.includes('hospital') ||
            content.includes('doctor') || content.includes('patient') || content.includes('disease') ||
            content.includes('medicine') || content.includes('therapy') || content.includes('clinic') ||
            content.includes('surgery') || content.includes('drug') || content.includes('pharmaceutical')) {
            return 'health';
        }

        else if (content.includes('science') || content.includes('research') || content.includes('study') ||
            content.includes('discovery') || content.includes('climate') || content.includes('environment') ||
            content.includes('space') || content.includes('nasa') || content.includes('university') ||
            content.includes('experiment') || content.includes('laboratory') || content.includes('scientist') ||
            content.includes('innovation') || content.includes('breakthrough') || content.includes('analysis')) {
            return 'science';
        }

        else {
            return 'general';
        }
    }


    getMockNewsData() {
        const currentDate = new Date();
        const yesterday = new Date(currentDate);
        yesterday.setDate(currentDate.getDate() - 1);
        const twoDaysAgo = new Date(currentDate);
        twoDaysAgo.setDate(currentDate.getDate() - 2);

        return [
            {
                id: 1,
                title: "AI Breakthrough: New Model Achieves Human-Level Understanding",
                description: "Researchers have developed a new artificial intelligence model that demonstrates unprecedented understanding of complex human language patterns and reasoning abilities.",
                url: "https://example.com/ai-breakthrough",
                urlToImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop",
                source: { name: "Tech Daily" },
                publishedAt: currentDate.toISOString(),
                category: "technology"
            },
            {
                id: 2,
                title: "Global Markets React to New Economic Policy Changes",
                description: "Major stock markets worldwide showed significant movement following the announcement of new economic policies aimed at stabilizing inflation and promoting growth.",
                url: "https://example.com/market-reaction",
                urlToImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop",
                source: { name: "Business Weekly" },
                publishedAt: yesterday.toISOString(),
                category: "business"
            },

            {
                id: 3,
                title: "Championship Finals: Underdog Team Makes Historic Victory",
                description: "In an unexpected turn of events, the underdog team secured a historic victory in the championship finals, marking their first title in over two decades.",
                url: "https://example.com/championship-victory",
                urlToImage: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
                source: { name: "Sports Central" },
                publishedAt: currentDate.toISOString(),
                category: "sports"
            },
            {
                id: 4,
                title: "New Streaming Service Launches with Exclusive Content",
                description: "A major entertainment company has launched a new streaming platform featuring exclusive original content and classic favorites from their extensive library.",
                url: "https://example.com/streaming-launch",
                urlToImage: "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&h=300&fit=crop",
                source: { name: "Entertainment Now" },
                publishedAt: yesterday.toISOString(),
                category: "entertainment"
            },
            {
                id: 5,
                title: "Breakthrough in Cancer Treatment Shows Promising Results",
                description: "Medical researchers have announced a breakthrough in cancer treatment that has shown promising results in early clinical trials, offering hope for patients worldwide.",
                url: "https://example.com/cancer-breakthrough",
                urlToImage: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop",
                source: { name: "Health Journal" },
                publishedAt: twoDaysAgo.toISOString(),
                category: "health"
            },
            {
                id: 6,
                title: "Space Mission Discovers Evidence of Water on Mars",
                description: "NASA's latest Mars mission has discovered compelling evidence of water presence, potentially supporting theories about the planet's ability to sustain life.",
                url: "https://example.com/mars-water-discovery",
                urlToImage: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=400&h=300&fit=crop",
                source: { name: "Science Daily" },
                publishedAt: currentDate.toISOString(),
                category: "science"
            },
            {
                id: 7,
                title: "Tech Giant Announces Revolutionary Smartphone Features",
                description: "A leading technology company has unveiled its latest smartphone with revolutionary features including advanced AI capabilities and enhanced security measures.",
                url: "https://example.com/smartphone-announcement",
                urlToImage: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop",
                source: { name: "Tech Review" },
                publishedAt: yesterday.toISOString(),
                category: "technology"
            },
            {
                id: 8,
                title: "Renewable Energy Investment Reaches Record High",
                description: "Global investment in renewable energy has reached an all-time high, with solar and wind power leading the transition to sustainable energy sources.",
                url: "https://example.com/renewable-energy-investment",
                urlToImage: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=300&fit=crop",
                source: { name: "Green Business" },
                publishedAt: twoDaysAgo.toISOString(),
                category: "business"
            },
            {
                id: 9,
                title: "Major Climate Summit Addresses Global Warming Crisis",
                description: "World leaders gathered at the annual climate summit to discuss urgent measures needed to combat global warming and reduce carbon emissions worldwide.",
                url: "https://example.com/climate-summit",
                urlToImage: "https://images.unsplash.com/photo-1569163137390-2108bdb5ed3c?w=400&h=300&fit=crop",
                source: { name: "Global News" },
                publishedAt: currentDate.toISOString(),
                category: "science"
            },
            {
                id: 10,
                title: "Revolutionary Electric Vehicle Sets New Speed Record",
                description: "A new electric vehicle has shattered previous speed records, demonstrating the rapid advancement of electric vehicle technology and performance capabilities.",
                url: "https://example.com/electric-vehicle-record",
                urlToImage: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop",
                source: { name: "Auto Weekly" },
                publishedAt: yesterday.toISOString(),
                category: "technology"
            },
            {
                id: 11,
                title: "Mental Health Awareness Campaign Reaches Millions",
                description: "A groundbreaking mental health awareness campaign has successfully reached millions of people, promoting understanding and support for mental health issues.",
                url: "https://example.com/mental-health-campaign",
                urlToImage: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop",
                source: { name: "Health Today" },
                publishedAt: currentDate.toISOString(),
                category: "health"
            },
            {
                id: 12,
                title: "Blockbuster Movie Breaks Box Office Records",
                description: "The highly anticipated blockbuster movie has shattered box office records, becoming the highest-grossing film of the year within its opening weekend.",
                url: "https://example.com/blockbuster-success",
                urlToImage: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop",
                source: { name: "Cinema News" },
                publishedAt: yesterday.toISOString(),
                category: "entertainment"
            }
        ];
    }


    handleSearch(query) {
        this.searchQuery = query.toLowerCase().trim();
        this.filterNews();
    }


    clearSearch() {
        document.getElementById('searchInput').value = '';
        this.searchQuery = '';
        this.filterNews();
    }


    handleCategoryFilter(category) {

        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });

        this.currentCategory = category;
        this.filterNews();
    }


    filterNews() {
        this.filteredNews = this.newsData.filter(article => {
            const matchesCategory = this.currentCategory === 'all' ||
                article.category === this.currentCategory;

            const matchesSearch = this.searchQuery === '' ||
                article.title.toLowerCase().includes(this.searchQuery) ||
                article.description.toLowerCase().includes(this.searchQuery);

            return matchesCategory && matchesSearch;
        });

        this.renderNews();
    }


    renderNews() {
        const container = document.getElementById('newsContainer');
        const noResults = document.getElementById('noResults');

        if (this.filteredNews.length === 0) {
            container.innerHTML = '';
            noResults.style.display = 'block';
            return;
        }

        noResults.style.display = 'none';

        container.innerHTML = this.filteredNews.map(article => this.createNewsCard(article)).join('');
    }


    createNewsCard(article) {
        const publishedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        return `
            <article class="news-card ${this.currentLayout === 'list' ? 'list-view' : ''}">
                <img src="${article.urlToImage}" alt="${article.title}" class="card-image" 
                     onerror="this.src='https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=300&fit=crop'">
                <div class="card-content">
                    <h3 class="card-title">${article.title}</h3>
                    <p class="card-description">${article.description}</p>
                    <div class="card-meta">
                        <span class="card-source">${article.source.name}</span>
                        <span class="card-date">${publishedDate}</span>
                    </div>
                    <a href="${article.url}" target="_blank" class="read-more">
                        Read More <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
            </article>
        `;
    }


    handleLayoutChange(layout) {
        this.currentLayout = layout;


        document.querySelectorAll('.layout-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.layout === layout);
        });


        const container = document.getElementById('newsContainer');
        container.classList.toggle('list-view', layout === 'list');

        this.renderNews();

        this.updateSetting('layout', layout);
    }

    toggleSettings() {
        const sidebar = document.getElementById('settingsSidebar');
        const overlay = document.getElementById('overlay');

        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        this.updateSetting('theme', newTheme);

        const themeIcon = document.querySelector('#themeToggle i');
        themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        this.applySettings();
    }

    applySettings() {
        document.documentElement.style.setProperty('--primary-color', this.settings.primaryColor);
        document.documentElement.style.setProperty('--background-color', this.settings.backgroundColor);

        document.documentElement.style.setProperty('--font-family', this.settings.fontFamily);

        document.documentElement.style.setProperty('--font-size', `${this.settings.fontSize}px`);

        document.documentElement.setAttribute('data-theme', this.settings.theme);

        this.currentLayout = this.settings.layout;
        const container = document.getElementById('newsContainer');
        container.classList.toggle('list-view', this.currentLayout === 'list');

        this.updateSettingsUI();

        const themeIcon = document.querySelector('#themeToggle i');
        themeIcon.className = this.settings.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    updateSettingsUI() {
        document.getElementById('primaryColor').value = this.settings.primaryColor;
        document.getElementById('backgroundColor').value = this.settings.backgroundColor;
        document.getElementById('fontFamily').value = this.settings.fontFamily;
        document.getElementById('fontSize').value = this.settings.fontSize;
        document.getElementById('fontSizeValue').textContent = `${this.settings.fontSize}px`;

        document.querySelectorAll('.layout-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.layout === this.settings.layout);
        });
    }


    loadSettings() {
        const defaultSettings = {
            primaryColor: '#2563eb',
            backgroundColor: '#ffffff',
            fontFamily: 'Inter',
            fontSize: 16,
            theme: 'light',
            layout: 'grid'
        };

        const savedSettings = localStorage.getItem('newsAggregatorSettings');
        return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
    }


    saveSettings() {
        localStorage.setItem('newsAggregatorSettings', JSON.stringify(this.settings));
    }


    resetSettings() {
        const defaultSettings = {
            primaryColor: '#2563eb',
            backgroundColor: '#ffffff',
            fontFamily: 'Inter',
            fontSize: 16,
            theme: 'light',
            layout: 'grid'
        };

        this.settings = { ...defaultSettings };
        this.saveSettings();
        this.applySettings();


        this.currentCategory = 'all';
        this.searchQuery = '';
        document.getElementById('searchInput').value = '';
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === 'all');
        });

        this.filterNews();
    }


    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        const container = document.getElementById('newsContainer');

        if (show) {
            spinner.style.display = 'flex';
            container.style.display = 'none';
        } else {
            spinner.style.display = 'none';
            container.style.display = 'grid';
        }
    }


    showError(message) {
        const container = document.getElementById('newsContainer');
        container.innerHTML = `
            <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #ef4444;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
    }


    showSuccessMessage(message) {
        const container = document.getElementById('newsContainer');
        container.innerHTML = `
            <div class="success-message" style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #10b981;">
                <i class="fas fa-check-circle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <h3>Success</h3>
                <p>${message}</p>
            </div>
        `;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    new NewsAggregator();
});




function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}


document.addEventListener('DOMContentLoaded', () => {

    document.querySelector('.logo').addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });


    document.addEventListener('keydown', (e) => {

        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }


        if (e.key === 'Escape') {
            const sidebar = document.getElementById('settingsSidebar');
            if (sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                document.getElementById('overlay').classList.remove('active');
            }
        }
    });
});