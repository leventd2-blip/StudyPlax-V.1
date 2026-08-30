const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');

const signinForm = document.getElementById('signin-form');
const signupForm = document.getElementById('signup-form');
const signinError = document.getElementById('signin-error');
const signupError = document.getElementById('signup-error');

const signinContainer = document.querySelector('.sign-in');
const dashboardView = document.getElementById('dashboard-view');
const userDisplayName = document.getElementById('user-display-name');
const logoutBtn = document.getElementById('logout-btn');

// Panel Sliding Listeners
registerBtn.addEventListener('click', () => {
    container.classList.add("active");
    signinError.textContent = '';
    signupError.textContent = '';
});

loginBtn.addEventListener('click', () => {
    container.classList.remove("active");
    signinError.textContent = '';
    signupError.textContent = '';
});

// Handle User Registration
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    signupError.textContent = '';

    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Registration successful! Please sign in.');
            container.classList.remove("active");
            signupForm.reset();
        } else {
            signupError.textContent = data.message;
        }
    } catch (err) {
        signupError.textContent = 'Server error. Please try again later.';
    }
});

// Handle User Login
signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    signinError.textContent = '';

    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Hide the sign-in form and display the dashboard with the red logout button
            userDisplayName.textContent = data.user.name;
            signinContainer.style.display = 'none';
            dashboardView.style.display = 'flex';
            signinForm.reset();
        } else {
            signinError.textContent = data.message;
        }
    } catch (err) {
        signinError.textContent = "We couldn't find any account matching those credentials.";
    }
});

// Handle Logout
logoutBtn.addEventListener('click', () => {
    dashboardView.style.display = 'none';
    signinContainer.style.display = 'block';
});
