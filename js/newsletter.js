document.addEventListener('DOMContentLoaded', () => {
    // Newsletter Popup
    const newsletterPopup = document.getElementById('newsletterPopup');
    const subscribeBtn = document.getElementById('subscribeBtn');
    const closeBtn = newsletterPopup.querySelector('.close');
    const newsletterForm = document.getElementById('newsletterForm');
    const footerNewsletter = document.getElementById('footerNewsletter');

    // Show newsletter popup after 5 seconds
    setTimeout(() => {
        newsletterPopup.style.display = 'block';
    }, 5000);

    // Close popup
    closeBtn.addEventListener('click', () => {
        newsletterPopup.style.display = 'none';
    });

    // Handle newsletter subscription
    const handleNewsletter = async (email) => {
        try {
            // Here you would typically send the email to your backend
            // For now, we'll just show a success message
            alert('Thank you for subscribing!');
            newsletterPopup.style.display = 'none';
            
            // Store subscription in localStorage (for demo)
            const subscribers = JSON.parse(localStorage.getItem('subscribers') || '[]');
            if (!subscribers.includes(email)) {
                subscribers.push(email);
                localStorage.setItem('subscribers', JSON.stringify(subscribers));
            }
        } catch (error) {
            console.error('Error subscribing:', error);
            alert('Error subscribing. Please try again later.');
        }
    };

    // Form submissions
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('newsletterEmail').value;
        handleNewsletter(email);
    });

    footerNewsletter.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = footerNewsletter.querySelector('input').value;
        handleNewsletter(email);
    });

    // Add newsletter subscription button click handler
    subscribeBtn.addEventListener('click', () => {
        newsletterPopup.style.display = 'block';
    });
});
