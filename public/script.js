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

// Navigation Tabs
const navFolders = document.getElementById('navFolders');
const navSettings = document.getElementById('navSettings');
const tabFolders = document.getElementById('tabFolders');
const tabSettings = document.getElementById('tabSettings');

// Folder Views
const foldersHomeView = document.getElementById('foldersHomeView');
const folderDetailView = document.getElementById('folderDetailView');
const foldersGrid = document.getElementById('foldersGrid');
const openFolderModalBtn = document.getElementById('openFolderModalBtn');
const folderModal = document.getElementById('folderModal');
const cancelFolderBtn = document.getElementById('cancelFolderBtn');
const saveFolderBtn = document.getElementById('saveFolderBtn');
const newFolderNameInput = document.getElementById('newFolderName');
const folderError = document.getElementById('folderError');
const backToFoldersBtn = document.getElementById('backToFoldersBtn');
const activeFolderName = document.getElementById('activeFolderName');

// Flashcards & Quiz
const flashcardForm = document.getElementById('flashcardForm');
const cardsGrid = document.getElementById('cardsGrid');
const startQuizBtn = document.getElementById('startQuizBtn');
const quizView = document.getElementById('quizView');
const exitQuizBtn = document.getElementById('exitQuizBtn');
const quizCard = document.getElementById('quizCard');
const prevQuizBtn = document.getElementById('prevQuizBtn');
const nextQuizBtn = document.getElementById('nextQuizBtn');
const quizCounter = document.getElementById('quizCounter');
const quizQuestionText = document.getElementById('quizQuestionText');
const quizAnswerText = document.getElementById('quizAnswerText');

// Settings / Logout
const logoutBtn = document.getElementById('logoutBtn');

let registeredUserData = null;
let currentUserEmail = null;
let currentFolderId = null;
let activeFolderCards = [];
let currentQuizIndex = 0;

// Panel Toggle
signUpButton.addEventListener('click', () => container.classList.add("right-panel-active"));
signInButton.addEventListener('click', () => container.classList.remove("right-panel-active"));

// Register
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (res.ok && data.success) {
        registeredUserData = { email, password };
        successModal.style.display = 'flex';
    } else {
        registerError.textContent = data.message;
    }
});

// Continue Modal
continueBtn.addEventListener('click', async () => {
    successModal.style.display = 'none';
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registeredUserData)
    });
    const data = await res.json();
    if (res.ok && data.success) showDashboard(data.user.email);
});

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok && data.success) {
        showDashboard(data.user.email);
    } else {
        loginError.textContent = data.message;
    }
});

function showDashboard(email) {
    currentUserEmail = email;
    container.style.display = 'none';
    successModal.style.display = 'none';
    dashboardScreen.style.display = 'flex';
    loadFolders();
}

// Sidebar Navigation
navFolders.addEventListener('click', () => {
    navFolders.classList.add('active-tab');
    navSettings.classList.remove('active-tab');
    tabFolders.style.display = 'block';
    tabSettings.style.display = 'none';
});

navSettings.addEventListener('click', () => {
    navSettings.classList.add('active-tab');
    navFolders.classList.remove('active-tab');
    tabSettings.style.display = 'block';
    tabFolders.style.display = 'none';
});

// Folder Modals
openFolderModalBtn.addEventListener('click', () => folderModal.style.display = 'flex');
cancelFolderBtn.addEventListener('click', () => folderModal.style.display = 'none');

saveFolderBtn.addEventListener('click', async () => {
    const folder_name = newFolderNameInput.value;
    if (!folder_name) return;

    const res = await fetch('/api/folders/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUserEmail, folder_name })
    });
    if (res.ok) {
        newFolderNameInput.value = '';
        folderModal.style.display = 'none';
        loadFolders();
    }
});

async function loadFolders() {
    const res = await fetch(`/api/folders?email=${encodeURIComponent(currentUserEmail)}`);
    const data = await res.json();
    foldersGrid.innerHTML = '';
    if (data.folders && data.folders.length > 0) {
        data.folders.forEach(folder => {
            const el = document.createElement('div');
            el.className = 'folder-card';
            el.innerHTML = `<i class="fa-solid fa-folder-closed"></i><h3>${folder.folder_name}</h3>`;
            el.addEventListener('click', () => openFolder(folder.id, folder.folder_name));
            foldersGrid.appendChild(el);
        });
    } else {
        foldersGrid.innerHTML = '<p>No folders yet. Create your first folder above!</p>';
    }
}

async function openFolder(id, name) {
    currentFolderId = id;
    activeFolderName.textContent = name;
    foldersHomeView.style.display = 'none';
    folderDetailView.style.display = 'block';
    loadFlashcards();
}

backToFoldersBtn.addEventListener('click', () => {
    folderDetailView.style.display = 'none';
    quizView.style.display = 'none';
    foldersHomeView.style.display = 'block';
    loadFolders();
});

// Flashcards inside folder
flashcardForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = document.getElementById('cardQuestion').value;
    const answer = document.getElementById('cardAnswer').value;

    const res = await fetch('/api/flashcards/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUserEmail, folder_id: currentFolderId, question, answer })
    });
    if (res.ok) {
        document.getElementById('cardQuestion').value = '';
        document.getElementById('cardAnswer').value = '';
        loadFlashcards();
    }
});

async function loadFlashcards() {
    const res = await fetch(`/api/flashcards?folder_id=${currentFolderId}`);
    const data = await res.json();
    activeFolderCards = data.cards || [];
    cardsGrid.innerHTML = '';
    if (activeFolderCards.length > 0) {
        activeFolderCards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'flashcard';
            cardEl.innerHTML = `<div class="card-inner"><div class="card-front">Q: ${card.question}</div><div class="card-back">A: ${card.answer}</div></div>`;
            cardEl.addEventListener('click', () => cardEl.classList.toggle('flipped'));
            cardsGrid.appendChild(cardEl);
        });
    } else {
        cardsGrid.innerHTML = '<p>No flashcards in this folder yet.</p>';
    }
}

// Quiz Mode
startQuizBtn.addEventListener('click', () => {
    if (activeFolderCards.length === 0) {
        alert('Add some flashcards to this folder before starting a quiz!');
        return;
    }
    currentQuizIndex = 0;
    folderDetailView.style.display = 'none';
    quizView.style.display = 'block';
    renderQuizCard();
});

exitQuizBtn.addEventListener('click', () => {
    quizView.style.display = 'none';
    folderDetailView.style.display = 'block';
});

quizCard.addEventListener('click', () => quizCard.classList.toggle('flipped'));

function renderQuizCard() {
    quizCard.classList.remove('flipped');
    const card = activeFolderCards[currentQuizIndex];
    quizQuestionText.textContent = card.question;
    quizAnswerText.textContent = card.answer;
    quizCounter.textContent = `${currentQuizIndex + 1} / ${activeFolderCards.length}`;
}

nextQuizBtn.addEventListener('click', () => {
    if (currentQuizIndex < activeFolderCards.length - 1) {
        currentQuizIndex++;
        renderQuizCard();
    }
});

prevQuizBtn.addEventListener('click', () => {
    if (currentQuizIndex > 0) {
        currentQuizIndex--;
        renderQuizCard();
    }
});

// Logout Button
logoutBtn.addEventListener('click', () => {
    dashboardScreen.style.display = 'none';
    container.style.display = 'block';
    loginForm.reset();
    registerForm.reset();
    currentUserEmail = null;
    currentFolderId = null;
});
