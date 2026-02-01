require('dotenv').config({ path: './server/.env' });
try {
    const url = new URL(process.env.DATABASE_URL);
    console.log('Host detected:', url.hostname);
    console.log('Port detected:', url.port);
    console.log('Protocol detected:', url.protocol);
} catch (e) {
    console.error('Invalid URL:', e.message);
    console.log('Raw value (masked):', process.env.DATABASE_URL ? 'Defined (starts with ' + process.env.DATABASE_URL.substring(0, 15) + '...)' : 'Undefined');
}
