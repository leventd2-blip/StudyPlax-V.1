const container = document.getElementById('authContainer');
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');

const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');

const registerError = document.getElementById('registerError');
const loginError = document.getElementById('loginError');

const successModal = document.getElementById('successModal');
const continueBtn = document.getElementById('continueBtn');
const dashboardScreen = document.getElementById('dashboardScreen');
const leaveBtn = document.getElementById('leaveBtn');

let registeredUserData = null; // Temporarily holds info to auto-login after clicking continue

// Toggle sliding panels
signUpButton.addEventListener('click', () => {
    container.classList.add("right-panel-active");
    registerError.textContent = '';
});

signInButton.addEventListener('click', () => {
    container.classList.remove("right-panel-active");
    loginError.textContent = '';
});

// REGISTER SUBMISSION
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    registerError.textContent = '';

    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();

        if (response.ok && data.success) {
            // Save data temporarily so "Continue" can log them in
            registeredUserData = { email, password };
            // Show custom success modal popup instead of alert
            successModal.style.display = 'flex';
        } else {
            registerError.textContent = data.message || 'Registration failed.';
        }
    } catch (err) {
        registerError.textContent = 'Network error. Please try again.';
    }
});

// CONTINUE BUTTON ON SUCCESS MODAL
continueBtn.addEventListener('click', async () => {
    successModal.style.display = 'none';

    if (registeredUserData) {
        // Automatically log them in using the registered credentials
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registeredUserData)
            });
            const data = await response.json();

            if (response.ok && data.success) {
                showDashboard();
            } else {
                container.classList.remove("right-panel-active"); // Switch to sign in view
            }
        } catch (err) {
            container.classList.remove("right-panel-active");
        }
    }
});

// LOGIN SUBMISSION
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();

        if (response.ok && data.success) {
            showDashboard();
        } else {
            loginError.textContent = data.message || "We couldn't find any account matching those credentials.";
        }
    } catch (err) {
        loginError.textContent = 'Network error. Please try again.';
    }
});

// SHOW DASHBOARD FUNCTION
function showDashboard() {
    container.style.display = 'none';
    successModal.style.display = 'none';
    dashboardScreen.style.display = 'flex';
}

// LEAVE BUTTON (Logs out / goes back to login screen)
leaveBtn.addEventListener('click', () => {
    dashboardScreen.style.display = 'none';
    container.style.display = 'block';
    loginForm.reset();
    registerForm.reset();
    registeredUserData = null;
});
