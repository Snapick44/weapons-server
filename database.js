const { createClient } = require('@libsql/client');

const db = createClient({
  url: "ТВОЙ_URL_ИЗ_TURSO", 
  authToken: "ТВОЙ_ТОКЕН_ИЗ_TURSO", 
});

async function initDB() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS weapons (
        id TEXT PRIMARY KEY,
        name TEXT,
        country TEXT,
        year TEXT,
        creator TEXT,
        specs TEXT,
        history TEXT,
        facts TEXT,
        photos TEXT
      )
    `);
    console.log('Таблицы в Turso успешно проверены/созданы');
  } catch (e) { console.error('Ошибка при создании таблиц:', e); }
}

initDB();
module.exports = db;
