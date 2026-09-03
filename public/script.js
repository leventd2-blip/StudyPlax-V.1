let currentUser = null;
let currentFolderId = null;
let currentFolderName = '';
let currentCards = [];
let currentQuizIndex = 0;

// AUTH SLIDER TOGGLES
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('authContainer');
    const signUpBtn = document.getElementById('signUpBtn');
    const signInBtn = document.getElementById('signInBtn');

    if (signUpBtn && signInBtn && container) {
        signUpBtn.addEventListener('click', () => container.classList.add("right-panel-active"));
        signInBtn.addEventListener('click', () => container.classList.remove("right-panel-active"));
    }

    // SIGN UP HANDLER
    const signUpForm = document.getElementById('signUpForm');
    if (signUpForm) {
        signUpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('suName').value;
            const email = document.getElementById('suEmail').value;
            const password = document.getElementById('suPassword').value;
            const errorEl = document.getElementById('suError');
            errorEl.textContent = '';

            try {
                const res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });
                const data = await res.json();
                if (data.success) {
                    showModal('Account Created', 'You can now sign in with your credentials.', true, () => {
                        container.classList.remove("right-panel-active");
                    });
                } else {
                    errorEl.textContent = data.message || 'Registration failed.';
                }
            } catch (err) {
                errorEl.textContent = 'Network error during registration.';
            }
        });
    }

    // SIGN IN HANDLER
    const signInForm = document.getElementById('signInForm');
    if (signInForm) {
        signInForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('siEmail').value;
            const password = document.getElementById('siPassword').value;
            const errorEl = document.getElementById('siError');
            errorEl.textContent = '';

            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (data.success) {
                    currentUser = data.user;
                    document.getElementById('authContainer').style.display = 'none';
                    document.getElementById('dashboardScreen').style.display = 'flex';
                    loadFoldersView();
                } else {
                    errorEl.textContent = data.message || 'Invalid login details.';
                }
            } catch (err) {
                errorEl.textContent = 'Network error during login.';
            }
        });
    }
});

// TAB SWITCHING
function switchTab(tab) {
    document.querySelectorAll('.sidebar li').forEach(el => el.classList.remove('active-tab'));
    if (tab === 'folders') {
        document.getElementById('navFolders').classList.add('active-tab');
        loadFoldersView();
    } else if (tab === 'bookmarks') {
        document.getElementById('navBookmarks').classList.add('active-tab');
        loadBookmarksView();
    } else if (tab === 'stats') {
        document.getElementById('navStats').classList.add('active-tab');
        loadStatsView();
    } else if (tab === 'settings') {
        document.getElementById('navSettings').classList.add('active-tab');
        loadSettingsView();
    }
}

// FOLDERS VIEW
async function loadFoldersView() {
    currentFolderId = null;
    const area = document.getElementById('mainContentArea');
    area.innerHTML = `
        <div class="section-header">
            <h2>Your Folders</h2>
            <button class="dashboard-primary-btn" onclick="openCreateFolderModal()"><i class="fa-solid fa-plus"></i> New Folder</button>
        </div>
        <div id="foldersGrid" class="folders-grid"><p>Loading folders...</p></div>
    `;

    try {
        const res = await fetch(`/api/folders?email=${encodeURIComponent(currentUser.email)}`);
        const data = await res.json();
        const grid = document.getElementById('foldersGrid');
        if (data.folders && data.folders.length > 0) {
            grid.innerHTML = data.folders.map(f => `
                <div class="folder-card" onclick="loadFlashcardsView('${f.id}', '${f.folder_name}')">
                    <i class="fa-solid fa-folder-open"></i>
                    <h3>${f.folder_name}</h3>
                </div>
            `).join('');
        } else {
            grid.innerHTML = `<p>No folders found. Create one to get started!</p>`;
        }
    } catch (err) {
        document.getElementById('foldersGrid').innerHTML = `<p>Error loading folders.</p>`;
    }
}

// CREATE FOLDER MODAL
function openCreateFolderModal() {
    document.getElementById('modalIcon').innerHTML = `<i class="fa-solid fa-folder-plus"></i>`;
    document.getElementById('modalTitle').textContent = 'Create Folder';
    document.getElementById('modalMessage').innerHTML = `<input type="text" id="newFolderName" placeholder="Folder Name" style="margin-top:15px; width:100%;" />`;
    document.getElementById('modalButtons').innerHTML = `
        <button onclick="closeModal()" class="ghost-btn">Cancel</button>
        <button onclick="submitCreateFolder()" class="dashboard-primary-btn">Create</button>
    `;
    document.getElementById('globalModal').style.display = 'flex';
}

async function submitCreateFolder() {
    const folder_name = document.getElementById('newFolderName').value;
    if (!folder_name) return;
    try {
        const res = await fetch('/api/folders/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUser.email, folder_name })
        });
        if (res.ok) {
            closeModal();
            loadFoldersView();
        }
    } catch (err) { alert('Error creating folder'); }
}

// FLASHCARDS VIEW
async function loadFlashcardsView(folderId, folderName) {
    currentFolderId = folderId;
    currentFolderName = folderName;
    const area = document.getElementById('mainContentArea');
    area.innerHTML = `
        <button class="back-btn" onclick="loadFoldersView()"><i class="fa-solid fa-arrow-left"></i> Back to Folders</button>
        <div class="folder-header-row">
            <h2>${folderName}</h2>
            <button class="quiz-btn" onclick="startQuizMode()"><i class="fa-solid fa-play"></i> Start Quiz</button>
        </div>
        <div id="cardsGrid" class="cards-grid"><p>Loading flashcards...</p></div>
    `;

    try {
        const res = await fetch(`/api/flashcards?folder_id=${folderId}`);
        const data = await res.json();
        currentCards = data.cards || [];
        renderCardsGrid();
    } catch (err) {
        document.getElementById('cardsGrid').innerHTML = `<p>Error loading cards.</p>`;
    }
}

function renderCardsGrid() {
    const grid = document.getElementById('cardsGrid');
    let html = `
        <div class="flashcard add-card-trigger" onclick="openAddCardModal()">
            <div class="add-card-content">
                <i class="fa-solid fa-plus"></i>
                <span>Add Flashcard</span>
            </div>
        </div>
    `;
    html += currentCards.map(card => `
        <div class="flashcard" onclick="this.classList.toggle('flipped')">
            <button class="bookmark-btn ${card.bookmarked ? 'bookmarked' : ''}" onclick="event.stopPropagation(); toggleBookmark('${card.question}', '${card.answer}', this)">
                <i class="fa-solid fa-bookmark"></i>
            </button>
            <div class="card-inner">
                <div class="card-front"><span>${card.question}</span></div>
                <div class="card-back"><span>${card.answer}</span></div>
            </div>
        </div>
    `).join('');
    grid.innerHTML = html;
}

// ADD FLASHCARD MODAL
function openAddCardModal() {
    document.getElementById('modalIcon').innerHTML = `<i class="fa-solid fa-clone"></i>`;
    document.getElementById('modalTitle').textContent = 'New Flashcard';
    document.getElementById('modalMessage').innerHTML = `
        <input type="text" id="cardQuestion" placeholder="Question / Term" style="margin:10px 0; width:100%;" />
        <input type="text" id="cardAnswer" placeholder="Answer / Definition" style="margin:10px 0; width:100%;" />
    `;
    document.getElementById('modalButtons').innerHTML = `
        <button onclick="closeModal()" class="ghost-btn">Cancel</button>
        <button onclick="submitAddCard()" class="dashboard-primary-btn">Save Card</button>
    `;
    document.getElementById('globalModal').style.display = 'flex';
}

async function submitAddCard() {
    const question = document.getElementById('cardQuestion').value;
    const answer = document.getElementById('cardAnswer').value;
    if (!question || !answer) return;

    try {
        const res = await fetch('/api/flashcards/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUser.email, folder_id: currentFolderId, question, answer })
        });
        if (res.ok) {
            closeModal();
            loadFlashcardsView(currentFolderId, currentFolderName);
        }
    } catch (err) { alert('Error saving card'); }
}

// BOOKMARK HANDLER
async function toggleBookmark(question, answer, btnEl) {
    try {
        const res = await fetch('/api/bookmarks/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUser.email, question, answer })
        });
        const data = await res.json();
        if (data.success) {
            if (data.bookmarked) btnEl.classList.add('bookmarked');
            else btnEl.classList.remove('bookmarked');
        }
    } catch (err) { alert('Error updating bookmark'); }
}

// QUIZ MODE
function startQuizMode() {
    if (currentCards.length === 0) {
        alert('Add at least one flashcard to start a quiz!');
        return;
    }
    currentQuizIndex = 0;
    renderQuizCard();
}

function renderQuizCard() {
    const card = currentCards[currentQuizIndex];
    const area = document.getElementById('mainContentArea');
    area.innerHTML = `
        <button class="back-btn" onclick="loadFlashcardsView('${currentFolderId}', '${currentFolderName}')"><i class="fa-solid fa-arrow-left"></i> Exit Quiz</button>
        <div class="quiz-card-container">
            <h2>Quiz Mode (${currentQuizIndex + 1} / ${currentCards.length})</h2>
            <div class="quiz-card" onclick="this.classList.toggle('flipped')">
                <div class="quiz-card-inner">
                    <div class="quiz-front"><span>${card.question}</span></div>
                    <div class="quiz-back"><span>${card.answer}</span></div>
                </div>
            </div>
            <p class="quiz-hint">Click card to flip</p>
            <div class="quiz-controls">
                <button class="ghost-btn" onclick="prevQuizCard()" ${currentQuizIndex === 0 ? 'disabled style="opacity:0.4;"' : ''}>Previous</button>
                <button class="dashboard-primary-btn" onclick="nextQuizCard()">${currentQuizIndex === currentCards.length - 1 ? 'Finish Quiz' : 'Next Card'}</button>
            </div>
        </div>
    `;
}

function nextQuizCard() {
    if (currentQuizIndex < currentCards.length - 1) {
        currentQuizIndex++;
        renderQuizCard();
    } else {
        loadFlashcardsView(currentFolderId, currentFolderName);
    }
}

function prevQuizCard() {
    if (currentQuizIndex > 0) {
        currentQuizIndex--;
        renderQuizCard();
    }
}

// BOOKMARKS VIEW
async function loadBookmarksView() {
    const area = document.getElementById('mainContentArea');
    area.innerHTML = `<h2>Bookmarks</h2><div class="cards-grid" id="bookmarksGrid"><p>Loading bookmarks...</p></div>`;
    try {
        const res = await fetch(`/api/bookmarks?email=${encodeURIComponent(currentUser.email)}`);
        const data = await res.json();
        const grid = document.getElementById('bookmarksGrid');
        if (data.bookmarks && data.bookmarks.length > 0) {
            grid.innerHTML = data.bookmarks.map(card => `
                <div class="flashcard" onclick="this.classList.toggle('flipped')">
                    <div class="card-inner">
                        <div class="card-front"><span>${card.question}</span></div>
                        <div class="card-back"><span>${card.answer}</span></div>
                    </div>
                </div>
            `).join('');
        } else {
            grid.innerHTML = `<p>No bookmarks saved yet.</p>`;
        }
    } catch (err) { document.getElementById('bookmarksGrid').innerHTML = `<p>Error loading bookmarks.</p>`; }
}

// STATS VIEW
function loadStatsView() {
    const area = document.getElementById('mainContentArea');
    area.innerHTML = `
        <h2>Study Statistics</h2>
        <div class="stats-grid">
            <div class="stat-card"><h3>Total Folders</h3><p style="font-size:24px; font-weight:800; color:#111; margin-top:10px;">Active</p></div>
            <div class="stat-card"><h3>Study Streak</h3><p style="font-size:24px; font-weight:800; color:#111; margin-top:10px;">1 Day</p></div>
        </div>
    `;
}

// SETTINGS VIEW
function loadSettingsView() {
    const area = document.getElementById('mainContentArea');
    area.innerHTML = `
        <h2>Account Settings</h2>
        <div class="settings-card">
            <p><strong>Signed in as:</strong> ${currentUser.email}</p>
            <p style="margin-top:10px;"><strong>Name:</strong> ${currentUser.name}</p>
            <button class="leave-btn" onclick="location.reload()"><i class="fa-solid fa-right-from-bracket"></i> Sign Out</button>
        </div>
    `;
}

// MODAL HELPERS
function showModal(title, message, isSuccess = true, callback = null) {
    document.getElementById('modalIcon').innerHTML = isSuccess ? `<i class="fa-solid fa-circle-check"></i>` : `<i class="fa-solid fa-circle-exclamation"></i>`;
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    document.getElementById('modalButtons').innerHTML = `<button onclick="closeModal(); ${callback ? 'callback()' : ''}" class="dashboard-primary-btn">Okay</button>`;
    if(callback) window.tempModalCallback = callback;
    document.getElementById('globalModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('globalModal').style.display = 'none';
    if(window.tempModalCallback) {
        window.tempModalCallback();
        window.tempModalCallback = null;
    }
}
