const RSS_FEEDS = [
    'https://odishatv.in/feed',
    'https://odishabytes.com/feed/',
    'https://www.dharitri.com/feed/',
    'https://odishanewsonline.com/feed/',
    'https://www.thehindu.com/news/feeder/default.rss',
    'https://prod-qt-images.s3.amazonaws.com/production/newindianexpress/feed.xml'
];

const WESTERN_ODISHA_DISTRICTS = [
    'sambalpur', 'jharsuguda', 'sundargarh', 'bargarh', 'balangir',
    'boudh', 'deogarh', 'kalahandi', 'nuapada', 'sonepur'
];

// CORS proxy URL
const PROXY_URL = 'https://api.allorigins.win/raw?url=';

// DOM Elements
const newsGrid = document.getElementById('newsGrid');
const loadingSpinner = document.getElementById('loadingSpinner');
const allNewsBtn = document.getElementById('allNews');
const westernOdishaBtn = document.getElementById('westernOdisha');

// Show/hide loading spinner
function toggleLoading(show) {
    loadingSpinner.style.display = show ? 'block' : 'none';
}

// Create news card element
function createNewsCard(article) {
    const card = document.createElement('div');
    card.className = 'news-card';
    
    // Create image element with error handling
    const img = document.createElement('img');
    img.src = article.thumbnail || 'images/default-thumbnail.jpg';
    img.alt = article.title;
    img.onerror = function() {
        this.src = 'images/default-thumbnail.jpg';
    };
    
    card.innerHTML = `
        <a href="article.html?url=${encodeURIComponent(article.link)}" class="news-card-link">
            ${img.outerHTML}
            <div class="news-card-content">
                <h3 class="news-card-title">${article.title}</h3>
                <p class="news-card-date">${moment(article.pubDate).format('MMM D, YYYY')}</p>
                <p class="news-card-description">${article.description}</p>
            </div>
        </a>
    `;
    return card;
}

// Filter articles for Western Odisha
function isWesternOdishaNews(article) {
    const title = article.title.toLowerCase();
    const description = article.description ? article.description.toLowerCase() : '';
    return WESTERN_ODISHA_DISTRICTS.some(district => 
        title.includes(district) || description.includes(district)
    );
}

// Fetch and parse RSS feeds
async function fetchRSSFeeds() {
    try {
        const parser = new RSSParser();
        let allArticles = [];
        
        // Fetch all feeds concurrently
        const feedPromises = RSS_FEEDS.map(feedUrl => {
            return parser.parseURL(`${PROXY_URL}${encodeURIComponent(feedUrl)}`)
                .then(feed => {
                    return feed.items.map(item => ({
                        title: item.title,
                        link: item.link,
                        description: item.contentSnippet || item.description,
                        pubDate: item.pubDate,
                        thumbnail: item.enclosure?.url || item['media:content']?.url || null
                    }));
                })
                .catch(error => {
                    console.error(`Error fetching feed ${feedUrl}:`, error);
                    return [];
                });
        });

        const feedResults = await Promise.all(feedPromises);
        allArticles = feedResults.flat();

        // Sort articles by date
        allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

        // Store in localStorage
        localStorage.setItem('newsArticles', JSON.stringify(allArticles));
        return allArticles;
    } catch (error) {
        console.error('Error fetching RSS feeds:', error);
        return [];
    }
}

// Update news grid
function updateNewsGrid(articles) {
    newsGrid.innerHTML = '';
    articles.forEach(article => {
        const card = createNewsCard(article);
        newsGrid.appendChild(card);
    });
}

// Filter handler
function filterNews(showWesternOnly) {
    const articles = JSON.parse(localStorage.getItem('newsArticles')) || [];
    const filteredArticles = showWesternOnly 
        ? articles.filter(isWesternOdishaNews)
        : articles;
    updateNewsGrid(filteredArticles);
}

// Event listeners
allNewsBtn.addEventListener('click', () => {
    allNewsBtn.classList.add('active');
    westernOdishaBtn.classList.remove('active');
    filterNews(false);
});

westernOdishaBtn.addEventListener('click', () => {
    westernOdishaBtn.classList.add('active');
    allNewsBtn.classList.remove('active');
    filterNews(true);
});

// Initialize
async function initialize() {
    toggleLoading(true);
    
    // Try to get cached articles first
    const cachedArticles = JSON.parse(localStorage.getItem('newsArticles'));
    if (cachedArticles && cachedArticles.length > 0) {
        updateNewsGrid(cachedArticles);
    }

    // Fetch fresh data
    const articles = await fetchRSSFeeds();
    filterNews(false); // Show all news by default
    
    toggleLoading(false);
}

// Start the app
document.addEventListener('DOMContentLoaded', initialize);

// Add image download button for users
const downloadButton = document.createElement('button');
downloadButton.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer; z-index: 1000;';
downloadButton.textContent = 'Download Images';
downloadButton.onclick = () => {
    const articles = JSON.parse(localStorage.getItem('newsArticles')) || [];
    const imageUrls = articles
        .filter(article => article.thumbnail)
        .map(article => article.thumbnail);
    
    if (imageUrls.length === 0) {
        alert('No images to download!');
        return;
    }
    
    // Create a new window with instructions
    const win = window.open('', '_blank');
    win.document.write(`
        <html>
        <head>
            <title>Download Images</title>
            <style>
                body { font-family: 'Montserrat', sans-serif; padding: 20px; }
                .instructions { margin-bottom: 20px; }
                .image-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
                .image-item { border: 1px solid #ddd; padding: 10px; text-align: center; }
                .image-item img { max-width: 100%; height: auto; }
            </style>
        </head>
        <body>
            <div class="instructions">
                <h2>Download Instructions</h2>
                <p>Right-click on each image and select "Save Image As..." to download.</p>
            </div>
            <div class="image-list">
                ${imageUrls.map(url => `
                    <div class="image-item">
                        <img src="${url}" alt="News Image">
                    </div>
                `).join('')}
            </div>
        </body>
        </html>
    `);
    win.document.close();
};
document.body.appendChild(downloadButton);
