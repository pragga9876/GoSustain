// Function to handle back button click
function goBack() {
    // Check if there's a previous page in history
    if (window.history.length > 1) {
        window.history.back();
    } else {
        // If no history, you can redirect to a default page
        console.log('No previous page in history');
        // Optionally: window.location.href = '/home';
    }
}

// Add smooth scroll behavior
document.addEventListener('DOMContentLoaded', function() {
    // Add fade-in animation to content card
    const contentCard = document.querySelector('.content-card');
    contentCard.style.opacity = '0';
    contentCard.style.transform = 'translateY(20px)';

    setTimeout(() => {
        contentCard.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        contentCard.style.opacity = '1';
        contentCard.style.transform = 'translateY(0)';
    }, 100);
});

// Optional: Add keyboard navigation for back button
document.addEventListener('keydown', function(event) {
    // ESC key to go back
    if (event.key === 'Escape') {
        goBack();
    }
});