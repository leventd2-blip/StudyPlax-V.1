const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eqqfsandsakvszoggfbr.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_KBogl3rrTb0gQ1tT-PyYyA_ZAKLK9E9';

// Register Endpoint using native fetch
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
        
        if (!checkRes.ok) {
            const errText = await checkRes.text();
            console.error('Supabase Check Error:', errText);
            return res.status(500).json({ success: false, message: `Check error: ${errText}` });
        }

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

        if (!insertRes.ok) {
            const errText = await insertRes.text();
            console.error('Supabase Insert Error:', errText);
            return res.status(500).json({ success: false, message: `Insert error: ${errText}` });
        }

        return res.status(201).json({ success: true, message: 'Account created successfully!' });
    } catch (err) {
        console.error('Server Catch Error:', err.message);
        return res.status(500).json({ success: false, message: `Server error: ${err.message}` });
    }
});

// Login Endpoint using native fetch
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
        
        if (!loginRes.ok) {
            const errText = await loginRes.text();
            console.error('Supabase Login Error:', errText);
            return res.status(500).json({ success: false, message: `Login error: ${errText}` });
        }

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
        console.error('Server Login Catch Error:', err.message);
        return res.status(401).json({ success: false, message: "We couldn't find any account matching those credentials." });
    }
});

module.exports = app;
