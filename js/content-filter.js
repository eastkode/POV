class ContentFilter {
    constructor() {
        this.filters = {
            category: null,
            district: null,
            dateRange: null,
            keywords: null,
            source: null
        };
        this.sortOptions = {
            date: 'desc',
            relevance: 'desc',
            views: 'desc'
        };
    }

    // Apply filters to articles
    filterArticles(articles) {
        return articles.filter(article => 
            this.filterByCategory(article) &&
            this.filterByDistrict(article) &&
            this.filterByDate(article) &&
            this.filterByKeywords(article) &&
            this.filterBySource(article)
        );
    }

    // Filter by category
    filterByCategory(article) {
        if (!this.filters.category) return true;
        return article.category?.toLowerCase().includes(this.filters.category.toLowerCase());
    }

    // Filter by district
    filterByDistrict(article) {
        if (!this.filters.district) return true;
        return article.district?.toLowerCase().includes(this.filters.district.toLowerCase());
    }

    // Filter by date range
    filterByDate(article) {
        if (!this.filters.dateRange) return true;
        const articleDate = new Date(article.createdAt);
        return articleDate >= this.filters.dateRange.start &&
               articleDate <= this.filters.dateRange.end;
    }

    // Filter by keywords
    filterByKeywords(article) {
        if (!this.filters.keywords) return true;
        const keywords = this.filters.keywords.toLowerCase();
        return article.title.toLowerCase().includes(keywords) ||
               article.content?.toLowerCase().includes(keywords) ||
               article.category?.toLowerCase().includes(keywords) ||
               article.district?.toLowerCase().includes(keywords);
    }

    // Filter by source
    filterBySource(article) {
        if (!this.filters.source) return true;
        return article.source?.toLowerCase().includes(this.filters.source.toLowerCase());
    }

    // Sort articles
    sortArticles(articles, sortBy = 'date') {
        const sortOptions = {
            date: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
            relevance: (a, b) => {
                const relevanceA = this.calculateRelevance(a);
                const relevanceB = this.calculateRelevance(b);
                return relevanceB - relevanceA;
            },
            views: (a, b) => (b.views || 0) - (a.views || 0)
        };

        return [...articles].sort(sortOptions[sortBy]);
    }

    // Calculate article relevance
    calculateRelevance(article) {
        const now = new Date();
        const articleDate = new Date(article.createdAt);
        const age = (now - articleDate) / (1000 * 60 * 60 * 24); // Age in days
        
        // Relevance factors
        const factors = {
            age: 1 / (1 + age), // Decreases with age
            source: article.source === 'Odisha News' ? 1.5 : 1, // Higher weight for own content
            category: article.category ? 1.2 : 1, // Higher weight for categorized content
            views: Math.log(article.views || 1) // Logarithmic scale for views
        };

        return Object.values(factors).reduce((sum, factor) => sum + factor, 0);
    }

    // Update filter UI
    updateFilterUI() {
        // Update category filter
        this.updateCategoryFilter();
        
        // Update district filter
        this.updateDistrictFilter();
        
        // Update date range filter
        this.updateDateRangeFilter();
        
        // Update keyword filter
        this.updateKeywordFilter();
        
        // Update source filter
        this.updateSourceFilter();
    }

    // Update category filter UI
    updateCategoryFilter() {
        const categoryFilter = document.querySelector('.category-filter');
        if (!categoryFilter) return;
        
        const categories = new Set(window.articleManager.categories);
        const html = Array.from(categories).map(category => `
            <label>
                <input type="radio" name="category" value="${category}" 
                       ${this.filters.category === category ? 'checked' : ''}>
                ${category}
            </label>
        `).join('');
        
        categoryFilter.innerHTML = html;
    }

    // Update district filter UI
    updateDistrictFilter() {
        const districtFilter = document.querySelector('.district-filter');
        if (!districtFilter) return;
        
        const districts = new Set(window.articleManager.districts);
        const html = Array.from(districts).map(district => `
            <label>
                <input type="radio" name="district" value="${district}" 
                       ${this.filters.district === district ? 'checked' : ''}>
                ${district}
            </label>
        `).join('');
        
        districtFilter.innerHTML = html;
    }

    // Update date range filter UI
    updateDateRangeFilter() {
        const dateFilter = document.querySelector('.date-filter');
        if (!dateFilter) return;
        
        const html = `
            <div class="date-range">
                <label>
                    From: <input type="date" id="startDate" 
                    value="${this.filters.dateRange?.start || ''}">
                </label>
                <label>
                    To: <input type="date" id="endDate" 
                    value="${this.filters.dateRange?.end || ''}">
                </label>
            </div>
        `;
        
        dateFilter.innerHTML = html;
    }

    // Update keyword filter UI
    updateKeywordFilter() {
        const keywordFilter = document.querySelector('.keyword-filter');
        if (!keywordFilter) return;
        
        keywordFilter.innerHTML = `
            <input type="text" id="keywords" 
                   placeholder="Search keywords..." 
                   value="${this.filters.keywords || ''}">
        `;
    }

    // Update source filter UI
    updateSourceFilter() {
        const sourceFilter = document.querySelector('.source-filter');
        if (!sourceFilter) return;
        
        const sources = new Set(window.articleManager.sources);
        const html = Array.from(sources).map(source => `
            <label>
                <input type="radio" name="source" value="${source}" 
                       ${this.filters.source === source ? 'checked' : ''}>
                ${source}
            </label>
        `).join('');
        
        sourceFilter.innerHTML = html;
    }

    // Handle filter changes
    handleFilterChange() {
        // Add event listeners for all filter inputs
        document.querySelectorAll('input[type="radio"][name="category"]')
            .forEach(input => input.addEventListener('change', () => {
                this.filters.category = input.value;
                this.applyFilters();
            }));

        document.querySelectorAll('input[type="radio"][name="district"]')
            .forEach(input => input.addEventListener('change', () => {
                this.filters.district = input.value;
                this.applyFilters();
            }));

        document.querySelectorAll('input[type="radio"][name="source"]')
            .forEach(input => input.addEventListener('change', () => {
                this.filters.source = input.value;
                this.applyFilters();
            }));

        const keywordsInput = document.getElementById('keywords');
        if (keywordsInput) {
            keywordsInput.addEventListener('input', () => {
                this.filters.keywords = keywordsInput.value;
                this.applyFilters();
            });
        }

        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        if (startDate && endDate) {
            startDate.addEventListener('change', () => {
                this.filters.dateRange = {
                    start: startDate.value,
                    end: endDate.value
                };
                this.applyFilters();
            });
            endDate.addEventListener('change', () => {
                this.filters.dateRange = {
                    start: startDate.value,
                    end: endDate.value
                };
                this.applyFilters();
            });
        }
    }

    // Apply filters and update display
    applyFilters() {
        const filteredArticles = this.filterArticles(window.articleManager.articles);
        const sortedArticles = this.sortArticles(filteredArticles);
        
        // Update display based on current page
        const currentPage = window.location.pathname;
        
        switch (currentPage) {
            case '/index.html':
                window.articleManager.updateRecentNews();
                break;
            case '/category.html':
                // Get category from URL
                const urlParams = new URLSearchParams(window.location.search);
                const category = urlParams.get('category');
                if (category) {
                    this.filters.category = category;
                    this.applyFilters();
                }
                break;
            case '/district.html':
                // Get district from URL
                const district = urlParams.get('district');
                if (district) {
                    this.filters.district = district;
                    this.applyFilters();
                }
                break;
            case '/search.html':
                // Get search terms from URL
                const search = urlParams.get('q');
                if (search) {
                    this.filters.keywords = search;
                    this.applyFilters();
                }
                break;
        }
    }
}

// Initialize content filter
const contentFilter = new ContentFilter();
window.contentFilter = contentFilter;

// Set up filter handling
document.addEventListener('DOMContentLoaded', () => {
    contentFilter.updateFilterUI();
    contentFilter.handleFilterChange();
});
