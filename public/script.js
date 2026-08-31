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

let registeredUserData = null; 
let currentUserEmail = null;

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
            registeredUserData = { email, password };
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
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registeredUserData)
            });
            const data = await response.json();

            if (response.ok && data.success) {
                showDashboard(data.user.email);
            } else {
                container.classList.remove("right-panel-active");
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
            showDashboard(data.user.email);
        } else {
            loginError.textContent = data.message || "We couldn't find any account matching those credentials.";
        }
    } catch (err) {
        loginError.textContent = 'Network error. Please try again.';
    }
});

// SHOW DASHBOARD
function showDashboard(email) {
    currentUserEmail = email;
    container.style.display = 'none';
    successModal.style.display = 'none';
    dashboardScreen.style.display = 'flex';
    loadUserFlashcards();
}

// LEAVE BUTTON
leaveBtn.addEventListener('click', () => {
    dashboardScreen.style.display = 'none';
    container.style.display = 'block';
    loginForm.reset();
    registerForm.reset();
    registeredUserData = null;
    currentUserEmail = null;
});

// LOAD FLASHCARDS
async function loadUserFlashcards() {
    if (!currentUserEmail) return;
    try {
        const res = await fetch(`/api/flashcards?email=${encodeURIComponent(currentUserEmail)}`);
        const data = await res.json();
        
        const grid = document.getElementById('cardsGrid');
        grid.innerHTML = '';

        if (data.cards && data.cards.length > 0) {
            data.cards.forEach(card => {
                const cardEl = document.createElement('div');
                cardEl.className = 'flashcard';
                cardEl.innerHTML = `
                    <div class="card-inner">
                        <div class="card-front"><strong>Q:</strong> ${card.question}</div>
                        <div class="card-back"><strong>A:</strong> ${card.answer}</div>
                    </div>
                `;
                cardEl.addEventListener('click', () => {
                    cardEl.classList.toggle('flipped');
                });
                grid.appendChild(cardEl);
            });
        } else {
            grid.innerHTML = '<p>No flashcards yet. Create your first one above!</p>';
        }
    } catch (err) {
        console.error('Error fetching cards');
    }
}

// CREATE FLASHCARD FORM
document.getElementById('flashcardForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = document.getElementById('cardQuestion').value;
    const answer = document.getElementById('cardAnswer').value;
    const msg = document.getElementById('flashcardMessage');

    try {
        const res = await fetch('/api/flashcards/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUserEmail, question, answer })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            document.getElementById('cardQuestion').value = '';
            document.getElementById('cardAnswer').value = '';
            msg.style.color = '#4bb543';
            msg.textContent = 'Card saved successfully!';
            loadUserFlashcards();
        } else {
            msg.style.color = '#ff4d4d';
            msg.textContent = data.message;
        }
    } catch (err) {
        msg.style.color = '#ff4d4d';
        msg.textContent = 'Error saving card.';
    }
});
