const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const ArticleProcessor = require('./article-processor');
const config = require('./config');
const app = express();

// Initialize article processor
const articleProcessor = new ArticleProcessor();

// Create data directory if it doesn't exist
fs.mkdir(path.join(__dirname, 'data'), { recursive: true })
    .catch(error => console.error('Error creating data directory:', error));

// Initialize articles array if it doesn't exist
fs.readFile(path.join(__dirname, 'data', 'articles.json'), 'utf8')
    .catch(() => fs.writeFile(path.join(__dirname, 'data', 'articles.json'), '[]'))
    .catch(error => console.error('Error initializing articles:', error));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes

// SEO Routes
app.get('/api/seo', async (req, res) => {
    try {
        const articles = await fs.readFile(path.join(__dirname, 'data', 'articles.json'), 'utf8');
        const processedArticles = JSON.parse(articles).filter(a => a.status === 'processed');
        
        // Generate SEO data for the latest articles
        const seoData = processedArticles.map(article => ({
            title: article.title,
            description: article.description,
            keywords: article.keywords.join(', '),
            url: article.canonical,
            lastModified: article.processedAt
        }));
        
        res.json({
            siteTitle: 'Odisha News - Latest News from Odisha',
            siteDescription: 'Get the latest news updates from Odisha. Covering politics, sports, culture, and more.',
            articles: seoData,
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in SEO route:', error);
        res.status(500).json({ error: 'Error fetching SEO data' });
    }
});

// Sitemap
app.get('/sitemap.xml', async (req, res) => {
    try {
        const sitemap = await fs.readFile(path.join(__dirname, '../public/sitemap.xml'), 'utf8');
        res.header('Content-Type', 'application/xml');
        res.send(sitemap);
    } catch (error) {
        console.error('Error serving sitemap:', error);
        res.status(500).send('Error fetching sitemap');
    }
});

// Robots.txt
app.get('/robots.txt', (req, res) => {
    res.header('Content-Type', 'text/plain');
    res.send(`
User-agent: *
Allow: /

Sitemap: https://odishanews.com/sitemap.xml
`);
});

// Article Management
app.get('/api/articles', async (req, res) => {
    try {
        const articles = await fs.readFile(path.join(__dirname, 'data', 'articles.json'), 'utf8');
        res.json(JSON.parse(articles));
    } catch (error) {
        res.status(500).json({ error: 'Error fetching articles' });
    }
});

app.post('/api/articles', async (req, res) => {
    try {
        const { title, content, category, district, imageUrl } = req.body;
        const articles = JSON.parse(await fs.readFile(path.join(__dirname, 'data', 'articles.json'), 'utf8'));
        
        // Create initial article object
        const newArticle = {
            id: uuidv4(),
            title,
            content,
            category,
            district,
            imageUrl,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'pending'
        };

        // Add to articles array
        articles.push(newArticle);
        await fs.writeFile(path.join(__dirname, 'data', 'articles.json'), JSON.stringify(articles, null, 2));

        // Process article with DeepSeek
        const processedArticle = await articleProcessor.processArticle(newArticle);

        // Update article with processed content
        const updatedArticles = articles.map(article => 
            article.id === processedArticle.id ? processedArticle : article
        );

        await fs.writeFile(path.join(__dirname, 'data', 'articles.json'), JSON.stringify(updatedArticles, null, 2));

        // Update sitemap
        await articleProcessor.updateSitemap();

        res.status(201).json(processedArticle);
    } catch (error) {
        console.error('Error processing article:', error);
        res.status(500).json({ error: 'Error creating and processing article' });
    }
});

// Article by ID
app.get('/api/articles/:id', async (req, res) => {
    try {
        const articles = JSON.parse(await fs.readFile(path.join(__dirname, 'data', 'articles.json'), 'utf8'));
        const article = articles.find(a => a.id === req.params.id);
        
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }

        res.json(article);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching article' });
    }
});

// Search articles
app.get('/api/articles/search', async (req, res) => {
    try {
        const { query, category, district } = req.query;
        const articles = JSON.parse(await fs.readFile(path.join(__dirname, 'data', 'articles.json'), 'utf8'));

        const filteredArticles = articles.filter(article => {
            const matchesQuery = !query || 
                article.title.toLowerCase().includes(query.toLowerCase()) ||
                article.content.toLowerCase().includes(query.toLowerCase()) ||
                article.keywords.some(keyword => keyword.toLowerCase().includes(query.toLowerCase()));

            const matchesCategory = !category || article.category === category;
            const matchesDistrict = !district || article.district === district;

            return matchesQuery && matchesCategory && matchesDistrict;
        });

        res.json(filteredArticles);
    } catch (error) {
        res.status(500).json({ error: 'Error searching articles' });
    }
});

// Ad Management
app.get('/api/ads', async (req, res) => {
    try {
        const ads = await fs.readFile(path.join(__dirname, 'data', 'ads.json'), 'utf8');
        res.json(JSON.parse(ads));
    } catch (error) {
        res.status(500).json({ error: 'Error fetching ads' });
    }
});

app.post('/api/ads', async (req, res) => {
    try {
        const { title, imageUrl, link, position } = req.body;
        const ads = JSON.parse(await fs.readFile(path.join(__dirname, 'data', 'ads.json'), 'utf8'));
        
        const newAd = {
            id: uuidv4(),
            title,
            imageUrl,
            link,
            position,
            createdAt: new Date().toISOString()
        };

        ads.push(newAd);
        await fs.writeFile(path.join(__dirname, 'data', 'ads.json'), JSON.stringify(ads, null, 2));
        
        res.status(201).json(newAd);
    } catch (error) {
        res.status(500).json({ error: 'Error creating ad' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
