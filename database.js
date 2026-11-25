const { createClient } = require('@libsql/client');

// ВСТАВЬ СВОЙ URL И ТОКЕН, КОТОРЫЕ ТЫ СКОПИРОВАЛ ИЗ ТЕРМИНАЛА TURSO
const db = createClient({
  url: "libsql://weapons-db-snapic44.aws-eu-west-1.turso.io", 
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTU1OTQxMzQsImlkIjoiMDFhMjExYmYtMzQwMS03OWQ3LTljZjMtZjBjYzc2ZjdkZDRjIiwia2lkIjoiRzZmMWMzajNXZDhPYmcweTMxbnNPRWZDZWdUNEF2Y1hLN3FWcWMyaV9NOCIsInJpZCI6IjZmOGQxZGNlLTMwNWQtNDNkOC1iOGY0LTc0NTFhYTVjZjcyMCJ9.z65YUtY3NVoeuHXG7fB5c3HfI7eQF7wGMV3nu5zF5KsmowfTFuG5vjbQK-IKHWIB-6lrKtuVORXDQIek660YCA", 
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
  } catch (e) {
    console.error('Ошибка при создании таблиц:', e);
  }
}

initDB();

module.exports = db;