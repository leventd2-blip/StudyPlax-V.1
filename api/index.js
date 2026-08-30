const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(express.json());
// Serve static frontend files from the public folder
app.use(express.static(path.join(__dirname, '../public')));

// Ensure data/accounts directory and accounts.json exist temporarily
const dataDir = path.join('/tmp', 'data', 'accounts');
const accountsFilePath = path.join(dataDir, 'accounts.json');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(accountsFilePath)) {
    fs.writeFileSync(accountsFilePath, JSON.stringify([], null, 2));
}

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
    if (accounts.find(acc => acc.email === email)) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    accounts.push({ name, email, password });
    saveAccounts(accounts);
    return res.status(201).json({ success: true, message: 'Account created successfully!' });
});

// Login Endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const accounts = getAccounts();
    const user = accounts.find(acc => acc.email === email && acc.password === password);

    if (!user) {
        return res.status(401).json({ success: false, message: "We couldn't find any account matching those credentials." });
    }

    return res.status(200).json({ success: true, message: 'Login successful!', user: { name: user.name, email: user.email } });
});

// Export app for Vercel serverless functions
module.exports = app;
