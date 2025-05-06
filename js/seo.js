document.addEventListener('DOMContentLoaded', () => {
    // Base SEO data
    const baseSEO = {
        title: 'Odisha News - Latest Breaking News & Updates',
        description: 'Get the latest news from Odisha and Western Odisha. Breaking news, politics, sports, and more from Bhubaneswar, Sambalpur, and other districts.',
        keywords: 'Odisha news, breaking news, Sambalpur news, Jharsuguda news, Western Odisha',
        image: 'https://odishanews.com/images/og-image.jpg',
        url: window.location.href
    };

    // Get current page type
    const currentPage = window.location.pathname.split('/').pop();

    // Update meta tags based on page type
    const updateMetaTags = (seoData) => {
        // Update title
        document.title = seoData.title;
        
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
                tag.content = seoData[key] || seoData[key.replace('og:', '').replace('twitter:', '')];
            }
        });
    };

    // Handle different page types
    switch (currentPage) {
        case 'index.html':
            updateMetaTags(baseSEO);
            break;
        case 'district.html':
            updateMetaTags({
                ...baseSEO,
                title: 'District News - Odisha News',
                description: 'Latest news from all districts of Odisha including Western Odisha',
                keywords: 'district news, Odisha districts, Sambalpur news, Jharsuguda news'
            });
            break;
        case 'category.html':
            updateMetaTags({
                ...baseSEO,
                title: 'News Categories - Odisha News',
                description: 'Browse news by category - politics, sports, business, and more',
                keywords: 'news categories, Odisha news categories, politics news, sports news'
            });
            break;
        case 'article.html':
            // Get article data from URL or localStorage
            const urlParams = new URLSearchParams(window.location.search);
            const articleId = urlParams.get('id');
            
            // Get article data from localStorage
            const articles = JSON.parse(localStorage.getItem('articles') || '[]');
            const article = articles.find(a => a.id === articleId);
            
            if (article) {
                updateMetaTags({
                    ...baseSEO,
                    title: `${article.title} - Odisha News`,
                    description: article.content.substring(0, 155) + '...',
                    keywords: `${article.district}, ${article.category}, Odisha news`,
                    image: article.imageUrl || baseSEO.image,
                    url: window.location.href
                });
            }
            break;
        default:
            updateMetaTags(baseSEO);
    }

    // Update structured data
    const updateStructuredData = () => {
        const structuredData = document.querySelector('script[type="application/ld+json"]');
        if (structuredData) {
            let data = JSON.parse(structuredData.textContent);
            
            // Update URL
            data.url = window.location.href;
            
            // Add article data if on article page
            if (currentPage === 'article.html') {
                const article = articles.find(a => a.id === articleId);
                if (article) {
                    data['@type'] = 'NewsArticle';
                    data.headline = article.title;
                    data.image = article.imageUrl;
                    data.datePublished = article.createdAt;
                    data.dateModified = article.updatedAt;
                    data.author = {
                        '@type': 'Person',
                        name: 'Odisha News'
                    };
                    data.publisher = {
                        '@type': 'Organization',
                        name: 'Odisha News',
                        logo: {
                            '@type': 'ImageObject',
                            url: 'https://odishanews.com/images/logo.png'
                        }
                    };
                }
            }
            
            structuredData.textContent = JSON.stringify(data, null, 2);
        }
    };

    // Update structured data
    updateStructuredData();

    // Update canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
        canonical.href = window.location.href;
    }
});
