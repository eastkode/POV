const ArticleProcessor = require('./article-processor');
const config = require('./config');
const fs = require('fs').promises;
const path = require('path');

async function updateArticles() {
    try {
        const articleProcessor = new ArticleProcessor();
        
        // Read existing articles
        const articles = JSON.parse(await fs.readFile(path.join(__dirname, 'data', 'articles.json'), 'utf8'));
        
        // Process pending articles
        const pendingArticles = articles.filter(article => article.status === 'pending');
        
        for (const article of pendingArticles) {
            try {
                console.log(`Processing article: ${article.title}`);
                const processedArticle = await articleProcessor.processArticle(article);
                
                // Update article in array
                const updatedArticles = articles.map(a => 
                    a.id === processedArticle.id ? processedArticle : a
                );
                
                // Save updated articles
                await fs.writeFile(
                    path.join(__dirname, 'data', 'articles.json'),
                    JSON.stringify(updatedArticles, null, 2)
                );
                
                console.log(`Successfully processed article: ${article.title}`);
            } catch (error) {
                console.error(`Error processing article ${article.title}:`, error);
                // Mark as failed if processing fails
                const updatedArticles = articles.map(a => 
                    a.id === article.id ? { ...a, status: 'failed' } : a
                );
                await fs.writeFile(
                    path.join(__dirname, 'data', 'articles.json'),
                    JSON.stringify(updatedArticles, null, 2)
                );
            }
        }
        
        // Update sitemap
        await articleProcessor.updateSitemap();
        
        console.log('Article update cycle completed');
    } catch (error) {
        console.error('Error in article update cycle:', error);
    }
}

// Run update cycle immediately
updateArticles();

// Set up periodic updates
setInterval(updateArticles, config.UPDATE_INTERVAL);

// Export for testing
module.exports = updateArticles;
