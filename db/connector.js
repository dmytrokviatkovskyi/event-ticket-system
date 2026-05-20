import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

const createTableQueries = [];

// події
createTableQueries.push(`
    CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        date TIMESTAMP NOT NULL,
        description TEXT,
        total_seats INTEGER NOT NULL,
        duration INTEGER NOT NULL
    );
`);

// квитки (каскадне видалення щоб не висіли сироти)
createTableQueries.push(`
    CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        CONSTRAINT unique_event_email UNIQUE (event_id, email),
        CONSTRAINT unique_event_phone UNIQUE (event_id, phone)
    );
`);

for await (const query of createTableQueries) {
    try {
        // console.log("Створюємо таблицю...");
        console.log(query.slice(0, query.indexOf('(')).trim() + "...");
        await pool.query(query);
    } catch (err) {
        console.error("query exec error: ", err.message);
    }
}

console.log("CONNECTED!!!!!✅ ");
      
export default pool;