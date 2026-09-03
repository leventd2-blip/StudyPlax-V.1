const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eqqfsandsakvszoggfbr.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_KBogl3rrTb0gQ1tT-PyYyA_ZAKLK9E9';

// Register
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'All fields are required.' });

    try {
        const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const existing = await checkRes.json();
        if (existing && existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email is already registered.' });
        }

        const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
            method: 'POST',
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify({ name, email, password })
        });
        if (!insertRes.ok) throw new Error();
        return res.status(201).json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'All fields are required.' });

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}&password=eq.${encodeURIComponent(password)}`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const users = await response.json();
        if (users && users.length > 0) {
            return res.status(200).json({ success: true, user: { name: users[0].name, email: users[0].email } });
        }
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Server error during login.' });
    }
});

// Folders
app.get('/api/folders', async (req, res) => {
    const { email } = req.query;
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/folders?user_email=eq.${encodeURIComponent(email)}`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const folders = await response.json();
        return res.status(200).json({ success: true, folders });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error fetching folders.' });
    }
});

app.post('/api/folders/add', async (req, res) => {
    const { email, folder_name } = req.body;
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/folders`, {
            method: 'POST',
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify({ user_email: email, folder_name })
        });
        if (!response.ok) throw new Error();
        return res.status(201).json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error creating folder.' });
    }
});

// Flashcards
app.get('/api/flashcards', async (req, res) => {
    const { folder_id } = req.query;
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/flashcards?folder_id=eq.${folder_id}`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const cards = await response.json();
        return res.status(200).json({ success: true, cards });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error fetching flashcards.' });
    }
});

app.post('/api/flashcards/add', async (req, res) => {
    const { email, folder_id, question, answer } = req.body;
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/flashcards`, {
            method: 'POST',
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify({ user_email: email, folder_id, question, answer })
        });
        if (!response.ok) throw new Error();
        return res.status(201).json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error saving flashcard.' });
    }
});

// Bookmarks
app.post('/api/bookmarks/add', async (req, res) => {
    const { email, question, answer } = req.body;
    try {
        const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/bookmarks?user_email=eq.${encodeURIComponent(email)}&question=eq.${encodeURIComponent(question)}`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const existing = await checkRes.json();

        if (existing && existing.length > 0) {
            await fetch(`${SUPABASE_URL}/rest/v1/bookmarks?id=eq.${existing[0].id}`, {
                method: 'DELETE',
                headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
            });
            return res.status(200).json({ success: true, bookmarked: false });
        } else {
            await fetch(`${SUPABASE_URL}/rest/v1/bookmarks`, {
                method: 'POST',
                headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
                body: JSON.stringify({ user_email: email, question, answer })
            });
            return res.status(201).json({ success: true, bookmarked: true });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error handling bookmark.' });
    }
});

module.exports = app;
