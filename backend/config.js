const config = {
    // DeepSeek API Configuration
    DEEPSEEK_API_KEY: 'sk-2d2f884a1fd34a8397fc3700e1d455d2',
    DEEPSEEK_API_URL: 'https://api.deepseek.com/v1',

    // Server Configuration
    PORT: process.env.PORT || 3000,
    HOST: process.env.HOST || 'localhost',

    // Content Processing
    MAX_ARTICLES: 50,
    UPDATE_INTERVAL: 3600000, // 1 hour
    CONTENT_REWRITE_PROMPT: `Rewrite this news article in a professional tone, focusing on Odisha-specific context. Include:
    1. Detailed analysis of the situation in Odisha
    2. Impact on local communities and economy
    3. Government's response and initiatives
    4. Expert opinions from local experts
    5. Historical context specific to Odisha
    6. Future implications for the region
    7. Relevant statistics and data points
    8. Local perspectives and reactions
    9. Comparison with similar situations in other parts of Odisha
    10. Potential solutions and recommendations`,

    // SEO Configuration
    SEO_KEYWORDS: [
        'Odisha', 'Odisha News', 'Western Odisha', 'Sambalpur', 'Jharsuguda', 'Bhubaneswar',
        'Odisha Politics', 'Odisha Economy', 'Odisha Development', 'Odisha Culture'
    ],

    // Sitemap Configuration
    SITEMAP_UPDATE_INTERVAL: 86400000, // 24 hours
    SITEMAP_MAX_URLS: 50000,

    // Article Storage
    ARTICLE_STORAGE_PATH: './data/articles',
    MAX_STORAGE_DAYS: 30,

    // RSS Feed Configuration
    RSS_FEED_URL: 'https://odishanews.com/rss',
    RSS_UPDATE_INTERVAL: 1800000, // 30 minutes

    // Analytics
    GOOGLE_ANALYTICS_ID: process.env.GOOGLE_ANALYTICS_ID,
    GOOGLE_TAG_MANAGER_ID: process.env.GOOGLE_TAG_MANAGER_ID
};

module.exports = config;
