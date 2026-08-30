const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to parse JSON and serve static files
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data/accounts directory and accounts.json exist
const dataDir = path.join(__dirname, 'data', 'accounts');
const accountsFilePath = path.join(dataDir, 'accounts.json');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(accountsFilePath)) {
    fs.writeFileSync(accountsFilePath, JSON.stringify([], null, 2));
}

// Helper functions to read and write accounts
const getAccounts = () => {
    try {
        const data = fs.readFileSync(accountsFilePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};

const saveAccounts = (accounts) => {
    fs.writeFileSync(accountsFilePath, JSON.stringify(accounts, null, 2));
};

// Register Endpoint
app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Please fill in all fields.' });
    }

    const accounts = getAccounts();
    const existingUser = accounts.find(acc => acc.email === email);

    if (existingUser) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Save user (Note: In production, hash passwords using bcrypt)
    accounts.push({ name, email, password });
    saveAccounts(accounts);

    return res.status(201).json({ success: true, message: 'Account created successfully!' });
});

// Login Endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const accounts = getAccounts();
    const user = accounts.find(acc => acc.email === email && acc.password === password);

    if (!user) {
        return res.status(401).json({ success: false, message: "We couldn't find any account matching those credentials." });
    }

    return res.status(200).json({ success: true, message: 'Login successful!', user: { name: user.name, email: user.email } });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
