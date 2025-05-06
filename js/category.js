const CATEGORIES = [
    { name: 'General', slug: 'general' },
    { name: 'Politics', slug: 'politics' },
    { name: 'Crime', slug: 'crime' },
    { name: 'Sports', slug: 'sports' },
    { name: 'Education', slug: 'education' },
    { name: 'Health', slug: 'health' },
    { name: 'Business', slug: 'business' }
];

const categoryContainer = document.getElementById('categoryContainer');

// Create category cards
CATEGORIES.forEach(category => {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.innerHTML = `
        <h2>${category.name}</h2>
        <p>Click to view ${category.name} news</p>
    `;
    card.addEventListener('click', () => {
        // Store selected category in localStorage
        localStorage.setItem('selectedCategory', category.slug);
        // Redirect to filtered news
        window.location.href = 'index.html?category=' + category.slug;
    });
    categoryContainer.appendChild(card);
});
