
function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        console.log('No previous page in history');
    }
}

// Function to save changes
function saveChanges() {
    const name = document.getElementById('nameInput').value;
    const email = document.getElementById('emailInput').value;
    const location = document.getElementById('locationInput').value;

    // Validate inputs
    if (!name.trim()) {
        alert('Please enter a name');
        return;
    }

    if (!email.trim()) {
        alert('Please enter an email');
        return;
    }

    if (!isValidEmail(email)) {
        alert('Please enter a valid email');
        return;
    }

    if (!location.trim()) {
        alert('Please enter a location');
        return;
    }

    // Save to localStorage
    const profileData = {
        name: name,
        email: email,
        location: location,
        lastUpdated: new Date().toLocaleString()
    };

    localStorage.setItem('userProfile', JSON.stringify(profileData));
    alert('Profile saved successfully!');
    console.log('Profile saved:', profileData);
}

// Function to validate email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Function to handle logout
function logout() {
    const confirmed = confirm('Are you sure you want to log out?');
    if (confirmed) {
        localStorage.removeItem('userProfile');
        console.log('User logged out');
        s       // You can redirect to login page here
        // window.location.href = '/login';
        alert('Logged out successfully!');
    }
}

// Load profile data on page load
document.addEventListener('DOMContentLoaded', function () {
    const savedProfile = localStorage.getItem('userProfile');

    if (savedProfile) {
        const profileData = JSON.parse(savedProfile);
        document.getElementById('nameInput').value = profileData.name;
        document.getElementById('emailInput').value = profileData.email;
        document.getElementById('locationInput').value = profileData.location;
    }

    // Add fade-in animation to profile card
    const profileCard = document.querySelector('.profile-card');
    profileCard.style.opacity = '0';
    profileCard.style.transform = 'translateY(10px)';

    setTimeout(() => {
        profileCard.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        profileCard.style.opacity = '1';
        profileCard.style.transform = 'translateY(0)';
    }, 100);
});

// Keyboard navigation
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        goBack();
    }
});