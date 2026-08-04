fetch('http://localhost:5000/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'farhanrashid938@gmail.com' })
})
.then(async res => {
    const text = await res.text();
    console.log('STATUS:', res.status, 'BODY:', text);
})
.catch(err => console.error(err));
