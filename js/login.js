document.addEventListener('DOMContentLoaded', () => {
    // Login Modal
    const loginModal = document.getElementById('loginModal');
    const loginBtn = document.getElementById('loginBtn');
    const loginCloseBtn = loginModal.querySelector('.close');
    const loginForm = document.getElementById('loginForm');

    // Show login modal
    loginBtn.addEventListener('click', () => {
        loginModal.style.display = 'block';
    });

    // Close login modal
    loginCloseBtn.addEventListener('click', () => {
        loginModal.style.display = 'none';
    });

    // Handle login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            // Here you would typically send the credentials to your backend
            // For now, we'll use localStorage for demo purposes
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                // Store user session
                localStorage.setItem('user', JSON.stringify(user));
                alert('Login successful!');
                loginModal.style.display = 'none';
                
                // Update UI for logged in user
                updateLoggedInUI();
            } else {
                alert('Invalid email or password');
            }
        } catch (error) {
            console.error('Error logging in:', error);
            alert('Error logging in. Please try again.');
        }
    });

    // Function to update UI for logged in user
    function updateLoggedInUI() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            // Update login button to logout
            loginBtn.textContent = 'Logout';
            loginBtn.onclick = () => {
                localStorage.removeItem('user');
                updateLoggedInUI();
                alert('Logged out successfully!');
            };
            
            // Add user menu
            const userMenu = document.createElement('div');
            userMenu.className = 'user-menu';
            userMenu.innerHTML = `
                <div class="user-info">
                    <span>${user.name}</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="user-menu-content">
                    <a href="profile.html">My Profile</a>
                    <a href="settings.html">Settings</a>
                    <a href="#" onclick="logout()">Logout</a>
                </div>
            `;
            document.querySelector('.nav-actions').prepend(userMenu);
        } else {
            // Reset to login button
            loginBtn.textContent = 'Login';
            loginBtn.onclick = () => loginModal.style.display = 'block';
            
            // Remove user menu
            const userMenu = document.querySelector('.user-menu');
            if (userMenu) userMenu.remove();
        }
    }

    // Initialize UI
    updateLoggedInUI();
});
