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

// Navigation Tabs & Sidebar elements
const navDashboard = document.getElementById('navDashboard');
const navFolders = document.getElementById('navFolders');
const navAnalytics = document.getElementById('navAnalytics');
const navBookmarks = document.getElementById('navBookmarks');
const navSettings = document.getElementById('navSettings');

const tabDashboard = document.getElementById('tabDashboard');
const tabFolders = document.getElementById('tabFolders');
const tabAnalytics = document.getElementById('tabAnalytics');
const tabBookmarks = document.getElementById('tabBookmarks');
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
const backToFoldersBtn = document.getElementById('backToFoldersBtn');
const activeFolderName = document.getElementById('activeFolderName');
const statFolderCount = document.getElementById('statFolderCount');

// Flashcards & Quiz + Modal Triggers
const openCardModalBtn = document.getElementById('openCardModalBtn');
const cardModal = document.getElementById('cardModal');
const cancelCardBtn = document.getElementById('cancelCardBtn');
const flashcardModalForm = document.getElementById('flashcardModalForm');
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

// Auto-login session persistence check
window.addEventListener('DOMContentLoaded', () => {
    const savedEmail = localStorage.getItem('studyplax_user');
    if (savedEmail) {
        showDashboard(savedEmail);
    }
});

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
    if (res.ok && data.success) {
        localStorage.setItem('studyplax_user', data.user.email);
        showDashboard(data.user.email);
    }
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
        localStorage.setItem('studyplax_user', data.user.email);
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

// Sidebar Navigation Switcher Helper
const allTabs = [tabDashboard, tabFolders, tabAnalytics, tabBookmarks, tabSettings];
const allNavs = [navDashboard, navFolders, navAnalytics, navBookmarks, navSettings];

function switchTab(activeTabEl, activeNavEl) {
    allTabs.forEach(tab => tab.style.display = 'none');
    allNavs.forEach(nav => nav.classList.remove('active-tab'));
    activeTabEl.style.display = 'block';
    activeNavEl.classList.add('active-tab');
}

navDashboard.addEventListener('click', () => switchTab(tabDashboard, navDashboard));
navFolders.addEventListener('click', () => {
    switchTab(tabFolders, navFolders);
    folderDetailView.style.display = 'none';
    quizView.style.display = 'none';
    foldersHomeView.style.display = 'block';
});
navAnalytics.addEventListener('click', () => switchTab(tabAnalytics, navAnalytics));
navBookmarks.addEventListener('click', () => switchTab(tabBookmarks, navBookmarks));
navSettings.addEventListener('click', () => switchTab(tabSettings, navSettings));

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
    const folders = data.folders || [];
    statFolderCount.textContent = folders.length;

    if (folders.length > 0) {
        folders.forEach(folder => {
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

// Flashcard Modal Triggers inside folder
openCardModalBtn.addEventListener('click', () => cardModal.style.display = 'flex');
cancelCardBtn.addEventListener('click', () => cardModal.style.display = 'none');

flashcardModalForm.addEventListener('submit', async (e) => {
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
        cardModal.style.display = 'none';
        loadFlashcards();
    }
});

async function loadFlashcards() {
    const res = await fetch(`/api/flashcards?folder_id=${currentFolderId}`);
    const data = await res.json();
    activeFolderCards = data.cards || [];
    
    // Clear dynamic cards but keep the first "+" add card trigger tile
    cardsGrid.innerHTML = '';
    cardsGrid.appendChild(openCardModalBtn);

    if (activeFolderCards.length > 0) {
        activeFolderCards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'flashcard';
            cardEl.innerHTML = `<div class="card-inner"><div class="card-front">Q: ${card.question}</div><div class="card-back">A: ${card.answer}</div></div>`;
            cardEl.addEventListener('click', () => cardEl.classList.toggle('flipped'));
            cardsGrid.appendChild(cardEl);
        });
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
    localStorage.removeItem('studyplax_user');
    dashboardScreen.style.display = 'none';
    container.style.display = 'block';
    loginForm.reset();
    registerForm.reset();
    currentUserEmail = null;
    currentFolderId = null;
});
