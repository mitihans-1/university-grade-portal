const fetch = require('node-fetch');

async function testLinks() {
    try {
        console.log('Logging in...');
        const loginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@university.edu', password: 'admin' })
        });

        if (!loginRes.ok) {
            console.error('Login failed:', await loginRes.text());
            return;
        }

        const { token } = await loginRes.json();
        console.log('Login successful. Token obtained.');

        console.log('Fetching pending links...');
        const linksRes = await fetch('http://127.0.0.1:5000/api/links/pending', {
            headers: { 'x-auth-token': token }
        });

        if (!linksRes.ok) {
            console.error('Fetch links failed:', await linksRes.text());
            return;
        }

        const links = await linksRes.json();
        console.log('Successfully fetched links:', links.length);
    } catch (err) {
        console.error('Error during test:', err);
    }
}

testLinks();
