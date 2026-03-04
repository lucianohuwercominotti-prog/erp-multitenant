const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'erp_multitenant',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
    console.log('Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
    console.error('Erro no PostgreSQL:', err);
    process.exit(-1);
});

const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('Conexao com banco de dados OK!');
        client.release();
        return true;
    } catch (error) {
        console.error('Erro ao conectar no banco:', error.message);
        return false;
    }
};

module.exports = {
    pool,
    query: (text, params) => pool.query(text, params),
    testConnection
};