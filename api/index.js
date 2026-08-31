const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eqqfsandsakvszoggfbr.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_KBogl3rrTb0gQ1tT-PyYyA_ZAKLK9E9';

// Register Endpoint
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Please fill in all fields.' });
    }

    try {
        const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/accounts?email=eq.${encodeURIComponent(email)}`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const existingUsers = await checkRes.json();

        if (existingUsers && existingUsers.length > 0) {
            return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
        }

        const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/accounts`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ name, email, password })
        });

        if (!insertRes.ok) throw new Error('Failed to insert user');

        return res.status(201).json({ success: true, message: 'Account created successfully!' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
});

// Login Endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    try {
        const loginRes = await fetch(`${SUPABASE_URL}/rest/v1/accounts?email=eq.${encodeURIComponent(email)}&password=eq.${encodeURIComponent(password)}`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const users = await loginRes.json();

        if (!users || users.length === 0) {
            return res.status(401).json({ success: false, message: "We couldn't find any account matching those credentials." });
        }

        const user = users[0];
        return res.status(200).json({ 
            success: true, 
            message: 'Login successful!', 
            user: { name: user.name, email: user.email } 
        });
    } catch (err) {
        return res.status(401).json({ success: false, message: "We couldn't find any account matching those credentials." });
    }
});

// Save Flashcard Endpoint
app.post('/api/flashcards/add', async (req, res) => {
    const { email, question, answer } = req.body;
    
    if (!email || !question || !answer) {
        return res.status(400).json({ success: false, message: 'Please provide all fields.' });
    }

    try {
        const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/flashcards`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ user_email: email, question, answer })
        });

        if (!insertRes.ok) throw new Error('Failed to save flashcard');

        return res.status(201).json({ success: true, message: 'Flashcard saved successfully!' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Server error saving flashcard.' });
    }
});

// Get Flashcards Endpoint
app.get('/api/flashcards', async (req, res) => {
    const email = req.query.email;

    try {
        const fetchRes = await fetch(`${SUPABASE_URL}/rest/v1/flashcards?user_email=eq.${encodeURIComponent(email)}`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const cards = await fetchRes.json();
        return res.status(200).json({ success: true, cards });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error loading flashcards.' });
    }
});

module.exports = app;
