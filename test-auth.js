const axios = require('axios');
axios.post('http://localhost:5000/api/auth/forgot-password', { email: 'farhanrashid938@gmail.com' })
    .then(res => console.log('SUCCESS:', res.data))
    .catch(err => console.error('ERROR:', err.response ? err.response.data : err.message));
