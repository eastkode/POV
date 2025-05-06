const axios = require('axios');
const config = require('./config');
const path = require('path');
const fs = require('fs').promises;

class ArticleProcessor {
    constructor() {
        this.apiKey = config.DEEPSEEK_API_KEY;
        this.apiUrl = config.DEEPSEEK_API_URL;
    }

    // Process article content
    async processArticle(article) {
        try {
            // Extract main content
            const content = this.extractMainContent(article);

            // Rewrite content using DeepSeek
            const rewrittenContent = await this.rewriteContent(content);

            // Generate SEO metadata
            const seoData = await this.generateSEOData(rewrittenContent);

            // Generate structured data
            const structuredData = this.generateStructuredData(article, rewrittenContent);

            // Create final article object
            const processedArticle = {
                ...article,
                content: rewrittenContent,
                ...seoData,
                structuredData,
                processedAt: new Date().toISOString(),
                status: 'processed'
            };

            // Save article to storage
            await this.saveArticle(processedArticle);

            return processedArticle;
        } catch (error) {
            console.error('Error processing article:', error);
            throw error;
        }
    }

    // Extract main content from article
    extractMainContent(article) {
        // Extract content from HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(article.content, 'text/html');

        // Remove unwanted elements
        this.removeElements(doc, ['script', 'style', 'iframe', 'noscript', 'header', 'footer']);

        // Get main content
        const mainContent = doc.querySelector('article, .article-content, .post-content');
        return mainContent ? mainContent.textContent : article.content;
    }

    // Remove elements from DOM
    removeElements(doc, elements) {
        elements.forEach(element => {
            const nodes = doc.getElementsByTagName(element);
            while (nodes.length > 0) {
                nodes[0].remove();
            }
        });
    }

    // Rewrite content using DeepSeek
    async rewriteContent(content) {
        try {
            const response = await axios.post(
                `${this.apiUrl}/completions`,
                {
                    model: 'deepseek-coder',
                    prompt: `${config.CONTENT_REWRITE_PROMPT}\n\nOriginal Content:\n${content}\n\nRewritten Content:\n`,
                    max_tokens: 2000,
                    temperature: 0.7,
                    top_p: 0.9
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data.choices[0].text.trim();
        } catch (error) {
            console.error('Error rewriting content:', error);
            throw error;
        }
    }

    // Generate SEO metadata
    async generateSEOData(content) {
        try {
            const response = await axios.post(
                `${this.apiUrl}/completions`,
                {
                    model: 'deepseek-coder',
                    prompt: `Generate SEO metadata for this Odisha news article:\n\nContent:\n${content}\n\nGenerate:\n1. Title (max 60 chars)
2. Meta description (max 160 chars)
3. Keywords (5-7 keywords)
4. Canonical URL
5. Open Graph tags
6. Twitter Card tags
7. Structured data
8. Internal links (3-5 relevant links)`,
                    max_tokens: 500,
                    temperature: 0.6,
                    top_p: 0.8
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const metadata = response.data.choices[0].text.trim();
            return this.parseMetadata(metadata);
        } catch (error) {
            console.error('Error generating SEO data:', error);
            throw error;
        }
    }

    // Parse metadata from DeepSeek response
    parseMetadata(metadata) {
        const lines = metadata.split('\n');
        const seoData = {};

        lines.forEach(line => {
            const [key, value] = line.split(':').map(s => s.trim());
            if (key && value) {
                seoData[key.toLowerCase().replace(/\s+/g, '_')] = value;
            }
        });

        return {
            title: seoData.title || 'Odisha News Article',
            description: seoData.meta_description || seoData.description || 'Odisha News Article',
            keywords: seoData.keywords ? seoData.keywords.split(',').map(k => k.trim()) : config.SEO_KEYWORDS,
            canonical: seoData.canonical_url || seoData.canonical,
            ogTitle: seoData.og_title || seoData.title,
            ogDescription: seoData.og_description || seoData.description,
            ogImage: seoData.og_image || seoData.image,
            twitterTitle: seoData.twitter_title || seoData.title,
            twitterDescription: seoData.twitter_description || seoData.description,
            twitterImage: seoData.twitter_image || seoData.image,
            internalLinks: seoData.internal_links ? seoData.internal_links.split(',').map(l => l.trim()) : []
        };
    }

    // Generate structured data
    generateStructuredData(article, content) {
        return {
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: article.title,
            image: article.ogImage || article.image,
            datePublished: article.publishedAt || new Date().toISOString(),
            dateModified: article.processedAt,
            author: {
                '@type': 'Person',
                name: article.author || 'Odisha News'
            },
            publisher: {
                '@type': 'Organization',
                name: 'Odisha News',
                logo: {
                    '@type': 'ImageObject',
                    url: 'https://odishanews.com/images/logo.png'
                }
            },
            description: article.description,
            articleBody: content,
            keywords: article.keywords.join(', '),
            mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': article.canonical
            }
        };
    }

    // Save article to storage
    async saveArticle(article) {
        try {
            const filePath = path.join(config.ARTICLE_STORAGE_PATH, `${article.id}.json`);
            await fs.writeFile(filePath, JSON.stringify(article, null, 2));
            return filePath;
        } catch (error) {
            console.error('Error saving article:', error);
            throw error;
        }
    }

    // Update sitemap
    async updateSitemap() {
        try {
            const articles = await this.getRecentArticles();
            const sitemap = this.generateSitemap(articles);
            await this.saveSitemap(sitemap);
            return sitemap;
        } catch (error) {
            console.error('Error updating sitemap:', error);
            throw error;
        }
    }

    // Get recent articles
    async getRecentArticles() {
        try {
            const files = await fs.readdir(config.ARTICLE_STORAGE_PATH);
            const articles = await Promise.all(
                files.map(async file => {
                    const content = await fs.readFile(
                        path.join(config.ARTICLE_STORAGE_PATH, file),
                        'utf-8'
                    );
                    return JSON.parse(content);
                })
            );
            return articles.sort((a, b) => new Date(b.processedAt) - new Date(a.processedAt));
        } catch (error) {
            console.error('Error getting recent articles:', error);
            return [];
        }
    }

    // Generate sitemap
    generateSitemap(articles) {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${articles.map(article => `
    <url>
        <loc>${article.canonical}</loc>
        <lastmod>${article.processedAt}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>
`).join('')}
</urlset>`;
        return xml;
    }

    // Save sitemap
    async saveSitemap(sitemap) {
        try {
            await fs.writeFile('public/sitemap.xml', sitemap);
            return true;
        } catch (error) {
            console.error('Error saving sitemap:', error);
            throw error;
        }
    }
}

module.exports = ArticleProcessor;
