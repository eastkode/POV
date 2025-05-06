document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const articleUrl = urlParams.get('url');
    
    if (!articleUrl) {
        window.location.href = 'index.html';
        return;
    }

    try {
        // Fetch article details from localStorage
        const articles = JSON.parse(localStorage.getItem('newsArticles')) || [];
        const article = articles.find(a => a.link === decodeURIComponent(articleUrl));

        if (!article) {
            window.location.href = 'index.html';
            return;
        }

        // Update article content
        document.getElementById('articleTitle').textContent = article.title;
        document.getElementById('articleMeta').textContent = `Published on ${moment(article.pubDate).format('MMMM D, YYYY')}`;
        document.getElementById('articleImage').src = article.thumbnail || 'images/default-thumbnail.jpg';
        document.getElementById('articleImage').alt = article.title;
        document.getElementById('articleContent').innerHTML = article.description;

        // Fetch recent news
        const recentArticles = articles
            .filter(a => a.link !== article.link)
            .slice(0, 5);

        const recentNewsList = document.getElementById('recentNewsList');
        recentArticles.forEach(recentArticle => {
            const item = document.createElement('div');
            item.className = 'recent-news-item';
            item.innerHTML = `
                <h4><a href="article.html?url=${encodeURIComponent(recentArticle.link)}">${recentArticle.title}</a></h4>
                <p class="article-date">${moment(recentArticle.pubDate).format('MMM D, YYYY')}</p>
            `;
            recentNewsList.appendChild(item);
        });

    } catch (error) {
        console.error('Error loading article:', error);
        window.location.href = 'index.html';
    }
});
