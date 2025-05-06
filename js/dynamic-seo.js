document.addEventListener('DOMContentLoaded', () => {
    // Get current page path
    const currentPage = window.location.pathname;
    
    // Get SEO data from localStorage
    const pageSEOs = JSON.parse(localStorage.getItem('pageSEOs') || '{}');
    const structuredData = JSON.parse(localStorage.getItem('structuredData') || '{}');
    
    // Get SEO data for current page
    let seoData = pageSEOs[currentPage] || {};
    
    // If on article page, get article-specific SEO
    if (currentPage === '/article.html') {
        const urlParams = new URLSearchParams(window.location.search);
        const articleId = urlParams.get('id');
        
        if (articleId) {
            const articles = JSON.parse(localStorage.getItem('articles') || '[]');
            const article = articles.find(a => a.id === articleId);
            
            if (article) {
                // Dynamic SEO Manager
                class DynamicSEOManager {
                    constructor() {
                        this.apiKey = 'sk-2d2f884a1fd34a8397fc3700e1d455d2';
                        this.apiUrl = 'https://api.deepseek.com/v1/completions';
                        this.defaultTitle = 'Odisha News - Latest News Updates';
                        this.defaultDescription = 'Get the latest news updates from Odisha. Covering politics, sports, culture, and more.';
                        this.defaultKeywords = ['Odisha News', 'Odisha', 'Latest News', 'Politics', 'Sports', 'Culture'];
                        this.currentArticle = null;
                        this.optimizationPrompts = {
                            title: "Generate a compelling title for this Odisha news article that includes the main topic, location, and a hook. Keep it under 60 characters.",
                            description: "Generate a meta description that includes the main points of the article, includes Odisha-specific keywords, and ends with a call-to-action. Keep it under 160 characters.",
                            keywords: "Generate 5-7 SEO keywords for this article that include both general and Odisha-specific terms.",
                            h1: "Generate a primary heading (H1) for this article that includes the main topic and location. Keep it under 70 characters.",
                            h2: "Generate 3-5 secondary headings (H2) that break down the article's main points while including Odisha-specific keywords.",
                            internalLinks: "Generate 3-5 internal links that are relevant to this article and include Odisha-specific content.",
                            canonical: "Generate a canonical URL for this article that follows our site structure.",
                            schema: "Generate schema.org markup for this article that includes all necessary properties for news articles.",
                            breadcrumbs: "Generate breadcrumb structure for this article that includes location and category.",
                            socialShare: "Generate optimized social share text and images for this article."
                        };
                    }

                    // Generate optimized SEO metadata
                    async generateOptimizedSEO(article) {
                        try {
                            const optimizedData = {};
                            
                            // Generate optimized title
                            const titleResponse = await this.generateSEOMetadata(this.optimizationPrompts.title, article);
                            optimizedData.title = titleResponse?.title || this.defaultTitle;

                            // Generate optimized description
                            const descResponse = await this.generateSEOMetadata(this.optimizationPrompts.description, article);
                            optimizedData.description = descResponse?.description || this.defaultDescription;

                            // Generate optimized keywords
                            const keywordsResponse = await this.generateSEOMetadata(this.optimizationPrompts.keywords, article);
                            optimizedData.keywords = keywordsResponse?.keywords || this.defaultKeywords;

                            // Generate optimized headings
                            const headingsResponse = await this.generateSEOMetadata(this.optimizationPrompts.h1 + '\n' + this.optimizationPrompts.h2, article);
                            optimizedData.headings = {
                                h1: headingsResponse?.h1 || article.title,
                                h2: headingsResponse?.h2 ? headingsResponse.h2.split('\n').filter(h => h.trim()) : []
                            };

                            // Generate optimized internal links
                            const linksResponse = await this.generateSEOMetadata(this.optimizationPrompts.internalLinks, article);
                            optimizedData.internalLinks = linksResponse?.internal_links || [];

                            // Generate schema markup
                            const schemaResponse = await this.generateSEOMetadata(this.optimizationPrompts.schema, article);
                            optimizedData.schema = schemaResponse?.schema || this.generateDefaultSchema(article);

                            // Generate canonical URL
                            const canonicalResponse = await this.generateSEOMetadata(this.optimizationPrompts.canonical, article);
                            optimizedData.canonical = canonicalResponse?.canonical || this.generateCanonicalURL(article);

                            // Generate social share content
                            const socialResponse = await this.generateSEOMetadata(this.optimizationPrompts.socialShare, article);
                            optimizedData.social = {
                                twitter: {
                                    title: socialResponse?.twitter_title || article.title,
                                    description: socialResponse?.twitter_description || article.description,
                                    image: socialResponse?.twitter_image || article.imageUrl
                                },
                                facebook: {
                                    title: socialResponse?.facebook_title || article.title,
                                    description: socialResponse?.facebook_description || article.description,
                                    image: socialResponse?.facebook_image || article.imageUrl
                                }
                            };

                            return optimizedData;
                        } catch (error) {
                            console.error('Error generating optimized SEO:', error);
                            return this.generateDefaultSEO(article);
                        }
                    }

                    // Generate default schema markup
                    generateDefaultSchema(article) {
                        return {
                            '@context': 'https://schema.org',
                            '@type': 'NewsArticle',
                            'headline': article.title,
                            'image': article.imageUrl,
                            'datePublished': article.publishedAt,
                            'dateModified': article.updatedAt,
                            'author': {
                                '@type': 'Person',
                                'name': article.author || 'Odisha News'
                            },
                            'publisher': {
                                '@type': 'Organization',
                                'name': 'Odisha News',
                                'logo': {
                                    '@type': 'ImageObject',
                                    'url': 'https://odishanews.com/images/logo.png'
                                }
                            },
                            'description': article.description,
                            'articleBody': article.content,
                            'keywords': article.keywords.join(', '),
                            'mainEntityOfPage': {
                                '@type': 'WebPage',
                                '@id': article.canonical
                            }
                        };
                    }

                    // Generate canonical URL
                    generateCanonicalURL(article) {
                        return `https://odishanews.com/${article.category.toLowerCase()}/${article.district.toLowerCase()}/${article.id}`;
                    }

                    // Generate default SEO
                    generateDefaultSEO(article) {
                        return {
                            title: `${article.title} - Odisha News`,
                            description: article.description || article.content.substring(0, 155) + '...',
                            keywords: `${article.district}, ${article.category}, Odisha news, ${article.tags?.join(', ') || ''}`,
                            canonical: this.generateCanonicalURL(article),
                            ogTitle: article.title,
                            ogDescription: article.description,
                            ogImage: article.imageUrl,
                            twitterTitle: article.title,
                            twitterDescription: article.description,
                            twitterImage: article.imageUrl,
                            internalLinks: [],
                            schema: this.generateDefaultSchema(article)
                        };
                    }

                    // Generate SEO metadata using DeepSeek
                    async generateSEOMetadata(prompt, article) {
                        try {
                            const response = await fetch(this.apiUrl, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${this.apiKey}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    model: 'deepseek-coder',
                                    prompt: `${prompt}\n\nArticle Context:\n${JSON.stringify(article, null, 2)}\n\nGenerate optimized SEO metadata:`,
                                    max_tokens: 500,
                                    temperature: 0.6,
                                    top_p: 0.8
                                })
                            });

                            const data = await response.json();
                            return this.parseMetadata(data.choices[0].text.trim());
                        } catch (error) {
                            console.error('Error generating SEO metadata:', error);
                            return null;
                        }
                    }

                    // Parse metadata from DeepSeek response
                    parseMetadata(metadata) {
                        const lines = metadata.split('\n');
                        const seoData = {};

                        lines.forEach(line => {
                            const [key, value] = line.split(':').map(s => s.trim());
                            if (key && value) {
                                const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
                                try {
                                    // Try to parse as JSON if possible
                                    seoData[normalizedKey] = JSON.parse(value);
                                } catch {
                                    // If not JSON, keep as string
                                    seoData[normalizedKey] = value;
                                }
                            }
                        });

                        return seoData;
                    }

                    // Update SEO for current article
                    async updateSEOMetadata(article) {
                        try {
                            // Generate optimized SEO metadata
                            const optimizedSEO = await this.generateOptimizedSEO(article);
                            
                            // Update article with optimized SEO data
                            article.seo = {
                                title: optimizedSEO.title,
                                description: optimizedSEO.description,
                                keywords: optimizedSEO.keywords,
                                canonical: optimizedSEO.canonical,
                                ogTitle: optimizedSEO.social.facebook.title,
                                ogDescription: optimizedSEO.social.facebook.description,
                                ogImage: optimizedSEO.social.facebook.image,
                                twitterTitle: optimizedSEO.social.twitter.title,
                                twitterDescription: optimizedSEO.social.twitter.description,
                                twitterImage: optimizedSEO.social.twitter.image,
                                internalLinks: optimizedSEO.internalLinks,
                                schema: optimizedSEO.schema,
                                headings: optimizedSEO.headings
                            };
                            
                            // Generate meta tags
                            const metaTags = this.generateMetaTags(article);
                            
                            // Update document head
                            this.updateDocumentHead(metaTags);
                            
                            // Update structured data
                            this.updateStructuredData(article);
                            
                            // Update canonical URL
                            this.updateCanonicalURL(article);
                            
                            // Update Open Graph tags
                            this.updateOpenGraphTags(article);
                            
                            // Update Twitter Card tags
                            this.updateTwitterCardTags(article);
                            
                            // Update article data
                            this.currentArticle = article;
                            
                            // Update sitemap
                            await this.updateSitemap();
                            
                            return true;
                        } catch (error) {
                            console.error('Error updating SEO metadata:', error);
                            return false;
                        }
                    }

                    // Generate meta tags
                    generateMetaTags(article) {
                        return {
                            title: article.seo.title,
                            description: article.seo.description,
                            keywords: article.seo.keywords,
                            canonical: article.seo.canonical,
                            ogTitle: article.seo.ogTitle,
                            ogDescription: article.seo.ogDescription,
                            ogImage: article.seo.ogImage,
                            twitterTitle: article.seo.twitterTitle,
                            twitterDescription: article.seo.twitterDescription,
                            twitterImage: article.seo.twitterImage
                        };
                    }

                    // Update document head
                    updateDocumentHead(metaTags) {
                        // Update title
                        document.title = metaTags.title;
                        
                        // Update meta tags
                        const metaTagElements = {
                            description: document.querySelector('meta[name="description"]'),
                            keywords: document.querySelector('meta[name="keywords"]'),
                            ogTitle: document.querySelector('meta[property="og:title"]'),
                            ogDescription: document.querySelector('meta[property="og:description"]'),
                            ogImage: document.querySelector('meta[property="og:image"]'),
                            ogUrl: document.querySelector('meta[property="og:url"]'),
                            twitterTitle: document.querySelector('meta[name="twitter:title"]'),
                            twitterDescription: document.querySelector('meta[name="twitter:description"]'),
                            twitterImage: document.querySelector('meta[name="twitter:image"]')
                        };

                        // Update each meta tag
                        Object.entries(metaTagElements).forEach(([key, tag]) => {
                            if (tag) {
                                tag.content = metaTags[key] || metaTags[key.replace('og:', '').replace('twitter:', '')];
                            }
                        });
                    }

                    // Update structured data
                    updateStructuredData(article) {
                        const script = document.querySelector('script[type="application/ld+json"]');
                        if (script) {
                            script.textContent = JSON.stringify(article.seo.schema, null, 2);
                        }
                    }

                    // Update canonical URL
                    updateCanonicalURL(article) {
                        const canonical = document.querySelector('link[rel="canonical"]');
                        if (canonical) {
                            canonical.href = article.seo.canonical;
                        }
                    }

                    // Update Open Graph tags
                    updateOpenGraphTags(article) {
                        const ogTags = {
                            title: document.querySelector('meta[property="og:title"]'),
                            description: document.querySelector('meta[property="og:description"]'),
                            image: document.querySelector('meta[property="og:image"]')
                        };

                        // Update each Open Graph tag
                        Object.entries(ogTags).forEach(([key, tag]) => {
                            if (tag) {
                                tag.content = article.seo[key];
                            }
                        });
                    }

                    // Update Twitter Card tags
                    updateTwitterCardTags(article) {
                        const twitterTags = {
                            title: document.querySelector('meta[name="twitter:title"]'),
                            description: document.querySelector('meta[name="twitter:description"]'),
                            image: document.querySelector('meta[name="twitter:image"]')
                        };

                        // Update each Twitter Card tag
                        Object.entries(twitterTags).forEach(([key, tag]) => {
                            if (tag) {
                                tag.content = article.seo[key];
                            }
                        });
                    }

                    // Update sitemap
                    async updateSitemap() {
                        // TO DO: implement sitemap update logic
                    }
                }

                const dynamicSEOManager = new DynamicSEOManager();
                dynamicSEOManager.updateSEOMetadata(article).then(updated => {
                    if (updated) {
                        // SEO metadata updated successfully
                    } else {
                        // Error updating SEO metadata
                    }
                });
            }
        }
    }

    // Update meta tags
    const updateMetaTags = (seo) => {
        // Update title
        document.title = seo.title;
        
        // Update meta tags
        const metaTags = {
            description: document.querySelector('meta[name="description"]'),
            keywords: document.querySelector('meta[name="keywords"]'),
            ogTitle: document.querySelector('meta[property="og:title"]'),
            ogDescription: document.querySelector('meta[property="og:description"]'),
            ogImage: document.querySelector('meta[property="og:image"]'),
            ogUrl: document.querySelector('meta[property="og:url"]'),
            twitterTitle: document.querySelector('meta[name="twitter:title"]'),
            twitterDescription: document.querySelector('meta[name="twitter:description"]'),
            twitterImage: document.querySelector('meta[name="twitter:image"]')
        };

        // Update each meta tag
        Object.entries(metaTags).forEach(([key, tag]) => {
            if (tag) {
                tag.content = seo[key] || seo[key.replace('og:', '').replace('twitter:', '')];
            }
        });
    };

    // Update structured data
    const updateStructuredData = () => {
        const currentData = structuredData[currentPage];
        if (currentData) {
            const script = document.querySelector('script[type="application/ld+json"]');
            if (script) {
                script.textContent = JSON.stringify(currentData, null, 2);
            }
        }
    };

    // Update canonical URL
    const updateCanonical = () => {
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) {
            canonical.href = window.location.href;
        }
    };

    // Initial update
    updateMetaTags(seoData);
    updateStructuredData();
    updateCanonical();

    // Watch for changes in localStorage
    window.addEventListener('storage', (event) => {
        if (event.key === 'pageSEOs') {
            const newPageSEOs = JSON.parse(event.newValue || '{}');
            const newSEO = newPageSEOs[currentPage] || {};
            updateMetaTags(newSEO);
        } else if (event.key === 'structuredData') {
            const newStructuredData = JSON.parse(event.newValue || '{}');
            updateStructuredData();
        }
    });

    // Update sitemap links
    const updateSitemapLinks = () => {
        const sitemap = localStorage.getItem('sitemap');
        const newsSitemap = localStorage.getItem('news_sitemap');
        
        // Update robots.txt
        const robotsTxt = document.querySelector('link[rel="robots"]');
        if (robotsTxt) {
            robotsTxt.href = 'https://odishanews.com/robots.txt';
        }

        // Update sitemap links
        const sitemapLinks = document.querySelectorAll('link[rel="sitemap"]');
        sitemapLinks.forEach(link => {
            if (link.dataset.type === 'main') {
                link.href = 'https://odishanews.com/sitemap.xml';
            } else if (link.dataset.type === 'news') {
                link.href = 'https://odishanews.com/sitemap-news.xml';
            }
        });
    };

    // Initial sitemap update
    updateSitemapLinks();

    // Watch for sitemap changes
    window.addEventListener('storage', (event) => {
        if (event.key === 'sitemap' || event.key === 'news_sitemap') {
            updateSitemapLinks();
        }
    });
});
