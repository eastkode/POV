class ArticleManager {
    constructor() {
        this.articles = JSON.parse(localStorage.getItem('articles') || '[]');
        this.categories = new Set();
        this.districts = new Set();
        this.sources = new Set();
        this.updateIntervals = {
            recent: 1000 * 60 * 5, // 5 minutes
            featured: 1000 * 60 * 30, // 30 minutes
            categories: 1000 * 60 * 60 // 1 hour
        };
        this.imageHandler = window.imageHandler;
    }

    // Get articles by category with image handling
    async getArticlesByCategory(category) {
        const articles = this.articles.filter(article => 
            article.category?.toLowerCase().includes(category.toLowerCase())
        );
        
        // Process images for articles
        await Promise.all(articles.map(async article => {
            if (!article.thumbnail) {
                article.thumbnail = await this.imageHandler.downloadImage(article.imageUrl, article.id);
            }
        }));
        
        return articles;
    }

    // Get articles by district
    getArticlesByDistrict(district) {
        return this.articles.filter(article => 
            article.district?.toLowerCase().includes(district.toLowerCase())
        );
    }

    // Get recent articles
    getRecentArticles(limit = 10) {
        return this.articles.slice(0, limit);
    }

    // Get featured articles
    getFeaturedArticles(limit = 5) {
        return this.articles.filter(article => article.featured === true).slice(0, limit);
    }

    // Update article display
    updateArticleDisplay() {
        // Update recent news
        this.updateRecentNews();
        
        // Update featured articles
        this.updateFeaturedArticles();
        
        // Update categories
        this.updateCategories();
        
        // Update districts
        this.updateDistricts();
    }

    // Update recent news
    updateRecentNews() {
        const recentNews = this.getRecentArticles();
        const recentNewsContainer = document.querySelector('.recent-news');
        
        if (!recentNewsContainer) return;
        
        const html = recentNews.map(article => `
            <div class="news-item">
                <a href="article.html?id=${article.id}" class="news-link">
                    <img src="${article.thumbnail || 'images/default-thumbnail.jpg'}" alt="${article.title}" class="news-image">
                    <div class="news-content">
                        <h3>${article.title}</h3>
                        <p>${article.description || article.content?.substring(0, 150) + '...'}</p>
                        <div class="news-meta">
                            <span class="source">${article.source}</span>
                            <span class="date">${new Date(article.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </a>
            </div>
        `).join('');
        
        recentNewsContainer.innerHTML = html;
    }

    // Update featured articles
    updateFeaturedArticles() {
        const featuredArticles = this.getFeaturedArticles();
        const featuredContainer = document.querySelector('.featured-articles');
        
        if (!featuredContainer) return;
        
        const html = featuredArticles.map(article => `
            <div class="featured-article">
                <a href="article.html?id=${article.id}" class="article-link">
                    <div class="article-image">
                        <img src="${article.thumbnail || 'images/default-thumbnail.jpg'}" alt="${article.title}">
                    </div>
                    <div class="article-content">
                        <h2>${article.title}</h2>
                        <p>${article.description || article.content?.substring(0, 200) + '...'}</p>
                        <div class="article-meta">
                            <span class="category">${article.category}</span>
                            <span class="date">${new Date(article.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </a>
            </div>
        `).join('');
        
        featuredContainer.innerHTML = html;
    }

    // Update categories
    updateCategories() {
        this.categories.clear();
        this.articles.forEach(article => {
            if (article.category) {
                this.categories.add(article.category);
            }
        });
        
        const categoriesContainer = document.querySelector('.categories');
        if (!categoriesContainer) return;
        
        const html = Array.from(this.categories).map(category => `
            <a href="category.html?category=${encodeURIComponent(category)}" class="category-link">
                ${category}
            </a>
        `).join('');
        
        categoriesContainer.innerHTML = html;
    }

    // Update districts
    updateDistricts() {
        this.districts.clear();
        this.articles.forEach(article => {
            if (article.district) {
                this.districts.add(article.district);
            }
        });
        
        const districtsContainer = document.querySelector('.districts');
        if (!districtsContainer) return;
        
        const html = Array.from(this.districts).map(district => `
            <a href="district.html?district=${encodeURIComponent(district)}" class="district-link">
                ${district}
            </a>
        `).join('');
        
        districtsContainer.innerHTML = html;
    }

    // Process article content with DeepSeek
    async processArticleContent(article) {
        try {
            // Check cache first
            const cachedContent = localStorage.getItem(`processed_${article.id}`);
            if (cachedContent) {
                return JSON.parse(cachedContent);
            }

            // Rate limiting: Process only one article every 5 minutes
            const lastProcessTime = localStorage.getItem('lastProcessTime');
            const currentTime = new Date().getTime();
            if (lastProcessTime && (currentTime - lastProcessTime) < 5 * 60 * 1000) {
                console.log('Rate limit: Skipping content processing');
                return {
                    content: article.content,
                    structured: null
                };
            }

            // Limit content length to reduce API usage
            const limitedContent = article.content.substring(0, 1000);
            
            const response = await fetch('https://api.deepseek.com/v1/completions', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer sk-2d2f884a1fd34a8397fc3700e1d455d2',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'deepseek-coder',
                    prompt: `Rewrite and enhance this Odisha news article with professional analysis. Include:
                    1. Comprehensive analysis of the situation in Odisha
                    2. Impact on local communities, economy, and infrastructure
                    3. Government's response and initiatives
                    4. Expert opinions from local experts and authorities
                    5. Historical context and precedent cases in Odisha
                    6. Future implications for the region and state
                    7. Relevant statistics, data points, and research
                    8. Local perspectives and community reactions
                    9. Comparison with similar situations in other parts of Odisha
                    10. Potential solutions, recommendations, and policy implications
                    
                    Original Content:
                    ${limitedContent}
                    
                    Rewritten Content (include above aspects):`,
                    max_tokens: 2000, // Reduced from 4000
                    temperature: 0.7,
                    top_p: 0.9
                })
            });

            const data = await response.json();
            const rewrittenContent = data.choices[0].text.trim();

            // Cache the processed content for 24 hours
            const processedContent = {
                content: rewrittenContent,
                structured: await this.generateStructuredContent(rewrittenContent, article),
                timestamp: currentTime
            };
            
            localStorage.setItem(`processed_${article.id}`, JSON.stringify(processedContent));
            localStorage.setItem('lastProcessTime', currentTime.toString());

            return processedContent;
        } catch (error) {
            console.error('Error processing article content:', error);
            return {
                content: article.content,
                structured: null
            };
        }
    }

    // Generate structured content
    async generateStructuredContent(content, article) {
        try {
            // Check cache first
            const cacheKey = `structured_${article.id}`;
            const cachedContent = localStorage.getItem(cacheKey);
            if (cachedContent) {
                return JSON.parse(cachedContent);
            }

            const response = await fetch('https://api.deepseek.com/v1/completions', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer sk-2d2f884a1fd34a8397fc3700e1d455d2',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'deepseek-coder',
                    prompt: `Generate structured content for this Odisha news article. Include:
                    1. Key points and summary
                    2. Multimedia elements (images, videos, infographics)
                    3. Interactive elements (charts, maps)
                    4. Related articles and resources
                    5. Social media share content
                    6. Local context and background
                    7. Expert opinions and quotes
                    8. Actionable insights
                    9. Downloadable resources
                    10. Interactive features
                    
                    Content:
                    ${content}
                    
                    Generate structured content:`,
                    max_tokens: 1000, // Reduced from 2000
                    temperature: 0.6,
                    top_p: 0.8
                })
            });

            const data = await response.json();
            const structuredContent = JSON.parse(data.choices[0].text.trim());

            // Cache the structured content for 24 hours
            localStorage.setItem(cacheKey, JSON.stringify(structuredContent));

            return structuredContent;
        } catch (error) {
            console.error('Error generating structured content:', error);
            return null;
        }
    }

    // ... (rest of the code remains the same)

    // Set up auto-updates
    setupAutoUpdates() {
        // Update recent news every 30 minutes (reduced from 5 minutes)
        setInterval(() => this.updateRecentNews(), 1000 * 60 * 30);
        
        // Update featured articles every 2 hours (reduced from 30 minutes)
        setInterval(() => this.updateFeaturedArticles(), 1000 * 60 * 120);
        
        // Update categories and districts every 6 hours (reduced from 1 hour)
        setInterval(() => {
            this.updateCategories();
            this.updateDistricts();
        }, 1000 * 60 * 60 * 6);
    }
} // Close ArticleManager class

// Initialize article manager
const articleManager = new ArticleManager();
window.articleManager = articleManager;

// Set up auto-updates
articleManager.setupAutoUpdates();

// Update display on page load
document.addEventListener('DOMContentLoaded', () => {
    articleManager.updateArticleDisplay();
});
