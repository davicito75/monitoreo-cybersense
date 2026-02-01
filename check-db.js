const { Client } = require('pg');
require('dotenv').config({ path: './server/.env' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

console.log('Connecting to:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

client.connect()
    .then(() => {
        console.log('Connected successfully!');
        return client.end();
    })
    .catch(err => {
        console.error('Connection failed:', err.message);
        process.exit(1);
    });
