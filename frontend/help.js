// Function to handle back-button click
function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        console.log('No previous page in history');
    }
}

// Function to handle card navigation
function navigateToCard(cardType) {
    console.log('Navigating to:', cardType);
    // You can replace this with actual navigation logic
    // Example: window.location.href = `/support/${cardType}`;
}

// Search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search-input');
    const cards = document.querySelectorAll('.support-card');

    // Add fade-in animation to content card
    const contentCard = document.querySelector('.content-card');
    contentCard.style.opacity = '0';
    contentCard.style.transform = 'translateY(10px)';

    setTimeout(() => {
        contentCard.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        contentCard.style.opacity = '1';
        contentCard.style.transform = 'translateY(0)';
    }, 100);

    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();

            // Define card categories and keywords
            const cardCategories = {
                account: ['account', 'profile', 'settings', 'login', 'password', 'email'],
                tracking: ['tracking', 'carbon', 'footprint', 'co2', 'emissions', 'calculate'],
                ecotools: ['eco', 'tools', 'challenges', 'guides', 'tasks', 'rewards'],
                privacy: ['data', 'privacy', 'policy', 'usage', 'security', 'gdpr']
            };

            // Filter cards based on search
            cards.forEach(card => {
                let isMatch = false;

                for (const [category, keywords] of Object.entries(cardCategories)) {
                    if (keywords.some(keyword => keyword.includes(searchTerm) || searchTerm.includes(keyword))) {
                        isMatch = true;
                        break;
                    }
                }

                if (searchTerm === '' || isMatch) {
                    card.style.display = 'block';
                    card.style.opacity = '1';
                    card.style.pointerEvents = 'auto'; // Re-enable pointer events
                } else {
                    card.style.opacity = '0.3';
                    card.style.pointerEvents = 'none'; // Disable pointer events
                }
            });
        });
    }
});

// Keyboard navigation
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        goBack();
    }
});