#! /usr/bin/env node
require('dotenv').config();
const { Client } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';

const connectionString = isProduction
  ? process.env.DATABASE_URL
  : `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'members_only_top'}`;

const SQL =`
        DROP TABLE IF EXISTS messages CASCADE;
        DROP TABLE IF EXISTS users CASCADE;

        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            first_name VARCHAR(255),
            last_name VARCHAR(255),
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            member_status VARCHAR(255) DEFAULT 'unconfirmed',
            admin_status VARCHAR(255)
        );
        INSERT INTO users (first_name, last_name, username, password) VALUES
            ('Bryan', 'Cranston', 'bryan@example.com', 'password123'),
            ('Odin', 'Allfather', 'odin@example.com', 'password123'),
            ('Damon', 'Salvatore', 'damon@example.com', 'password123');
        CREATE TABLE messages (
            id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
            user_id INTEGER REFERENCES users(id),
            message TEXT NOT NULL,
            created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO messages (user_id, message) VALUES
            (1, 'I am the one who knocks!'),
            (2, 'You shall not pass!'),
            (3, 'Hello, brother!');
            `;

async function main() {
    console.log('Seeding 1 2 3...');
    const client = new Client({
        connectionString,
        ssl: isProduction ? { rejectUnauthorized: false } : false
    });
    await client.connect();
    await client.query(SQL);
    await client.end();
    console.log('Seeding complete.');
}

main();