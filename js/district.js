const DISTRICTS = [
    { name: 'Sambalpur', slug: 'sambalpur' },
    { name: 'Jharsuguda', slug: 'jharsuguda' },
    { name: 'Sundargarh', slug: 'sundargarh' },
    { name: 'Bargarh', slug: 'bargarh' },
    { name: 'Balangir', slug: 'balangir' },
    { name: 'Boudh', slug: 'boudh' },
    { name: 'Deogarh', slug: 'deogarh' },
    { name: 'Kalahandi', slug: 'kalahandi' },
    { name: 'Nuapada', slug: 'nuapada' },
    { name: 'Sonepur', slug: 'sonepur' }
];

const districtContainer = document.getElementById('districtContainer');

// Create district cards
DISTRICTS.forEach(district => {
    const card = document.createElement('div');
    card.className = 'district-card';
    card.innerHTML = `
        <h2>${district.name}</h2>
        <p>Click to view news from ${district.name}</p>
    `;
    card.addEventListener('click', () => {
        // Store selected district in localStorage
        localStorage.setItem('selectedDistrict', district.slug);
        // Redirect to filtered news
        window.location.href = 'index.html?district=' + district.slug;
    });
    districtContainer.appendChild(card);
});
