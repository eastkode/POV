// Auto-update sitemap and SEO every hour
const AUTO_UPDATE_INTERVAL = 1000 * 60 * 60; // 1 hour

// Check if we need to update
function checkForUpdates() {
    const lastUpdate = localStorage.getItem('lastUpdate');
    if (!lastUpdate) {
        updateAll();
        return;
    }

    const lastUpdateDate = new Date(lastUpdate);
    const now = new Date();
    const timeDiff = now - lastUpdateDate;

    // Update if more than 24 hours have passed
    if (timeDiff > 1000 * 60 * 60 * 24) {
        updateAll();
    }
}

// Update all content
function updateAll() {
    // Get content manager
    const contentManager = window.contentManager;
    
    if (!contentManager) {
        console.error('Content manager not initialized');
        return;
    }

    // Update sitemaps
    contentManager.updateSitemaps();
    
    // Update SEO
    contentManager.updateSEO();
    
    // Update last update time
    localStorage.setItem('lastUpdate', new Date().toISOString());
}

// Set up auto-update interval
function setupAutoUpdate() {
    // Check immediately on load
    checkForUpdates();
    
    // Set up interval
    setInterval(checkForUpdates, AUTO_UPDATE_INTERVAL);
}

// Initialize auto-update
window.addEventListener('load', setupAutoUpdate);
