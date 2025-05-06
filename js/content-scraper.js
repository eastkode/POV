class ContentScraper {
    constructor() {
        this.sources = [
            {
                name: 'Odisha TV',
                url: 'https://odishatv.in/feed',
                parser: this.parseOdishaTV.bind(this)
            },
            {
                name: 'Odisha Bytes',
                url: 'https://odishabytes.com/feed/',
                parser: this.parseOdishaBytes.bind(this)
            },
            {
                name: 'Dharitri',
                url: 'https://www.dharitri.com/feed/',
                parser: this.parseDharitri.bind(this)
            },
            {
                name: 'Odisha News Online',
                url: 'https://odishanewsonline.com/feed/',
                parser: this.parseOdishaNewsOnline.bind(this)
            },
            {
                name: 'The Hindu',
                url: 'https://www.thehindu.com/news/feeder/default.rss',
                parser: this.parseTheHindu.bind(this)
            },
            {
                name: 'New Indian Express',
                url: 'https://prod-qt-images.s3.amazonaws.com/production/newindianexpress/feed.xml',
                parser: this.parseNewIndianExpress.bind(this)
            }
        ];
        this.lastScrape = localStorage.getItem('lastScrape') || '2025-05-06T08:00:00+05:30';
    }

    // Main scraping function
    async scrapeContent() {
        try {
            // Get existing articles
            const existingArticles = JSON.parse(localStorage.getItem('articles') || '[]');
            const newArticles = [];

            // Process each source
            for (const source of this.sources) {
                const feed = await this.fetchFeed(source.url);
                const parsedArticles = await source.parser(feed);
                
                // Add source name to articles
                parsedArticles.forEach(article => {
                    article.source = source.name;
                    article.sourceUrl = source.url;
                });

                // Add new articles
                newArticles.push(...parsedArticles);
            }

            // Combine with existing articles
            const allArticles = [...existingArticles, ...newArticles];
            
            // Remove duplicates
            const uniqueArticles = this.removeDuplicates(allArticles);
            
            // Sort by date
            uniqueArticles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            // Save to localStorage
            localStorage.setItem('articles', JSON.stringify(uniqueArticles));
            localStorage.setItem('lastScrape', new Date().toISOString());

            // Update SEO and sitemaps
            window.contentManager.updateAll();

            return uniqueArticles;
        } catch (error) {
            console.error('Error scraping content:', error);
            throw error;
        }
    }

    // Fetch feed using CORS proxy
    async fetchFeed(url) {
        const PROXY_URL = 'https://api.allorigins.win/raw?url=';
        try {
            const response = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`);
            const text = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, 'text/xml');
            return xmlDoc;
        } catch (error) {
            console.error(`Error fetching feed ${url}:`, error);
            return null;
        }
    }

    // Parse Odisha TV feed
    parseOdishaTV(feed) {
        const items = feed.getElementsByTagName('item');
        return Array.from(items).map(item => this.parseRSSItem(item));
    }

    // Parse Odisha Bytes feed
    parseOdishaBytes(feed) {
        const items = feed.getElementsByTagName('item');
        return Array.from(items).map(item => {
            const article = this.parseRSSItem(item);
            // Add Odisha Bytes specific parsing
            article.category = item.getElementsByTagName('category')[0]?.textContent;
            return article;
        });
    }

    // Parse Dharitri feed
    parseDharitri(feed) {
        const items = feed.getElementsByTagName('item');
        return Array.from(items).map(item => {
            const article = this.parseRSSItem(item);
            // Add Dharitri specific parsing
            article.thumbnail = item.getElementsByTagName('enclosure')[0]?.getAttribute('url');
            return article;
        });
    }

    // Parse RSS item
    parseRSSItem(item) {
        return {
            title: item.getElementsByTagName('title')[0]?.textContent,
            link: item.getElementsByTagName('link')[0]?.textContent,
            description: item.getElementsByTagName('description')[0]?.textContent,
            content: item.getElementsByTagName('content:encoded')[0]?.textContent,
            pubDate: item.getElementsByTagName('pubDate')[0]?.textContent,
            category: item.getElementsByTagName('category')[0]?.textContent,
            creator: item.getElementsByTagName('dc:creator')[0]?.textContent,
            thumbnail: item.getElementsByTagName('enclosure')[0]?.getAttribute('url') ||
                      item.getElementsByTagName('media:content')[0]?.getAttribute('url')
        };
    }

    // Remove duplicate articles
    removeDuplicates(articles) {
        const seen = new Set();
        return articles.filter(article => {
            const key = article.title + article.link;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    // Get full article content
    async getFullArticle(url) {
        try {
            const PROXY_URL = 'https://api.allorigins.win/get?url=';
            const response = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`);
            const data = await response.json();
            
            // Parse HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.contents, 'text/html');

            // Extract content
            const article = {
                title: doc.querySelector('title')?.textContent,
                content: this.extractContent(doc),
                images: this.extractImages(doc),
                date: doc.querySelector('time')?.textContent || new Date().toISOString(),
                author: doc.querySelector('.author, .byline')?.textContent,
                tags: this.extractTags(doc)
            };

            return article;
        } catch (error) {
            console.error('Error getting full article:', error);
            throw error;
        }
    }

    // Extract main content from HTML
    extractContent(doc) {
        // Try different selectors for different websites
        const selectors = [
            '.article-content',
            '.content',
            '.story',
            '.main-article',
            'article'
        ];

        for (const selector of selectors) {
            const content = doc.querySelector(selector);
            if (content) {
                // Clean the content
                const cleanedContent = this.cleanContent(content);
                return cleanedContent;
            }
        }

        // Fallback to body content
        return doc.body.textContent;
    }

    // Clean content by removing unwanted elements
    cleanContent(element) {
        // Remove ads
        const ads = element.querySelectorAll('.ad, .advertisement, .sponsored');
        ads.forEach(ad => ad.remove());

        // Remove navigation
        const nav = element.querySelectorAll('.nav, .navigation, .menu');
        nav.forEach(nav => nav.remove());

        // Remove social media buttons
        const social = element.querySelectorAll('.social, .share, .facebook, .twitter');
        social.forEach(s => s.remove());

        // Get clean HTML
        return element.innerHTML;
    }

    // Extract images from article
    extractImages(doc) {
        const images = [];
        const imgElements = doc.querySelectorAll('img');
        
        imgElements.forEach(img => {
            const src = img.getAttribute('src') || img.getAttribute('data-src');
            if (src) {
                images.push({
                    url: src,
                    alt: img.getAttribute('alt') || '',
                    caption: img.getAttribute('title') || ''
                });
            }
        });

        return images;
    }

    // Extract tags from article
    extractTags(doc) {
        const tags = [];
        const tagElements = doc.querySelectorAll('.tags, .categories, .topics');
        
        tagElements.forEach(element => {
            const tagLinks = element.querySelectorAll('a');
            tagLinks.forEach(link => {
                const tag = link.textContent.trim();
                if (tag) tags.push(tag);
            });
        });

        return tags;
    }
}

// Initialize content scraper
const contentScraper = new ContentScraper();
window.contentScraper = contentScraper;

// Auto-scrape content every hour
setInterval(async () => {
    try {
        await contentScraper.scrapeContent();
        console.log('Content scraping completed successfully');
    } catch (error) {
        console.error('Error in auto-scrape:', error);
    }
}, 1000 * 60 * 60); // 1 hour interval
