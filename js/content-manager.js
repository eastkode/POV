class ContentManager {
    constructor() {
        this.articles = JSON.parse(localStorage.getItem('articles') || '[]');
        this.lastUpdate = localStorage.getItem('lastUpdate') || new Date().toISOString();
        this.updateInterval = 1000 * 60 * 60 * 24; // 24 hours
    }

    // Add new article
    addArticle(articleData) {
        const newArticle = {
            id: Date.now().toString(),
            ...articleData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.articles.push(newArticle);
        this.saveArticles();
        this.updateSEO();
        this.updateSitemaps();
        return newArticle;
    }

    // Update existing article
    updateArticle(articleId, updates) {
        const articleIndex = this.articles.findIndex(a => a.id === articleId);
        if (articleIndex !== -1) {
            this.articles[articleIndex] = {
                ...this.articles[articleIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveArticles();
            this.updateSEO();
            this.updateSitemaps();
            return this.articles[articleIndex];
        }
        return null;
    }

    // Delete article
    deleteArticle(articleId) {
        this.articles = this.articles.filter(a => a.id !== articleId);
        this.saveArticles();
        this.updateSEO();
        this.updateSitemaps();
    }

    // Save articles to localStorage
    saveArticles() {
        localStorage.setItem('articles', JSON.stringify(this.articles));
        localStorage.setItem('lastUpdate', new Date().toISOString());
    }

    // Update SEO for all pages
    updateSEO() {
        // Update home page SEO
        const homeSEO = {
            title: 'Odisha News - Latest Breaking News & Updates',
            description: `Get the latest news from Odisha and Western Odisha. Updated ${this.lastUpdate}.`,
            keywords: 'Odisha news, breaking news, Sambalpur news, Jharsuguda news, Western Odisha',
            image: this.articles[0]?.imageUrl || 'https://odishanews.com/images/og-image.jpg'
        };
        this.updatePageSEO(homeSEO, 'index.html');

        // Update article pages SEO
        this.articles.forEach(article => {
            const articleSEO = {
                title: `${article.title} - Odisha News`,
                description: article.content.substring(0, 155) + '...',
                keywords: `${article.district}, ${article.category}, Odisha news`,
                image: article.imageUrl,
                url: `https://odishanews.com/article.html?id=${article.id}`
            };
            this.updatePageSEO(articleSEO, `article.html?id=${article.id}`);
        });
    }

    // Update sitemaps
    updateSitemaps() {
        this.updateMainSitemap();
        this.updateNewsSitemap();
    }

    // Update main sitemap
    updateMainSitemap() {
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://odishanews.com/</loc>
        <lastmod>${this.lastUpdate}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    ${this.generatePageUrls()}
</urlset>`;

        // Save sitemap to localStorage
        localStorage.setItem('sitemap', sitemap);
        
        // Create sitemap file
        this.createFile('sitemap.xml', sitemap);
    }

    // Update news sitemap
    updateNewsSitemap() {
        const newsSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
    ${this.articles.map(article => `
    <url>
        <loc>https://odishanews.com/article.html?id=${article.id}</loc>
        <news:news>
            <news:publication>
                <news:name>Odisha News</news:name>
                <news:language>en</news:language>
            </news:publication>
            <news:title>${article.title}</news:title>
            <news:publication_date>${article.createdAt}</news:publication_date>
            <news:keywords>${article.district}, ${article.category}</news:keywords>
            <news:stock_tickers>${this.getStockTickers(article)}</news:stock_tickers>
        </news:news>
    </url>
    `).join('')}
</urlset>`;

        // Save news sitemap to localStorage
        localStorage.setItem('news_sitemap', newsSitemap);
        
        // Create news sitemap file
        this.createFile('sitemap-news.xml', newsSitemap);
    }

    // Generate page URLs for main sitemap
    generatePageUrls() {
        const pages = [
            { path: 'district.html', priority: '0.8', changefreq: 'daily' },
            { path: 'category.html', priority: '0.8', changefreq: 'daily' },
            { path: 'about.html', priority: '0.6', changefreq: 'monthly' },
            { path: 'contact.html', priority: '0.6', changefreq: 'monthly' }
        ];

        return pages.map(page => `
    <url>
        <loc>https://odishanews.com/${page.path}</loc>
        <lastmod>${this.lastUpdate}</lastmod>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
    </url>
        `).join('\n');
    }

    // Update SEO for a specific page
    updatePageSEO(seoData, pagePath) {
        // Store SEO data in localStorage
        const pageSEOs = JSON.parse(localStorage.getItem('pageSEOs') || '{}');
        pageSEOs[pagePath] = seoData;
        localStorage.setItem('pageSEOs', JSON.stringify(pageSEOs));

        // Update structured data
        this.updateStructuredData(seoData);
    }

    // Update structured data
    updateStructuredData(seoData) {
        const structuredData = {
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            name: seoData.title,
            url: seoData.url || window.location.href,
            image: seoData.image,
            description: seoData.description,
            keywords: seoData.keywords
        };

        // Store structured data in localStorage
        const pageData = JSON.parse(localStorage.getItem('structuredData') || '{}');
        pageData[window.location.pathname] = structuredData;
        localStorage.setItem('structuredData', JSON.stringify(pageData));
    }

    // Get stock tickers based on article content
    getStockTickers(article) {
        // Simple stock ticker detection based on article content
        const stockKeywords = {
            'nse': ['NSE:ODISHA', 'NSE:ORISSA'],
            'bse': ['BSE:ODISHA', 'BSE:ORISSA']
        };

        const tickers = [];
        Object.entries(stockKeywords).forEach(([exchange, tickers]) => {
            if (article.content.toLowerCase().includes(exchange.toLowerCase())) {
                tickers.forEach(ticker => {
                    if (article.content.includes(ticker)) {
                        tickers.push(ticker);
                    }
                });
            }
        });

        return tickers.join(', ');
    }

    // Create file (for browsers with File System Access API support)
    async createFile(filename, content) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [{
                    description: 'XML files',
                    accept: {
                        'application/xml': ['.xml']
                    }
                }]
            });

            const writable = await handle.createWritable();
            await writable.write(content);
            await writable.close();
        } catch (error) {
            console.error('Error creating file:', error);
            // Fallback: Store in localStorage
            localStorage.setItem(filename, content);
        }
    }
}

// Initialize content manager
const contentManager = new ContentManager();

// Export for use in other scripts
window.contentManager = contentManager;

// Example usage:
// const newArticle = contentManager.addArticle({
//     title: 'New Article Title',
//     content: 'Article content here',
//     category: 'Politics',
//     district: 'Sambalpur',
//     imageUrl: 'https://odishanews.com/images/article1.jpg'
// });
