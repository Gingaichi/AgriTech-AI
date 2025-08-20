import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database (use the same one as Django)
const dbPath = path.join(__dirname, '../ai_models/db.sqlite3');
const db = new sqlite3.Database(dbPath);

console.log('Initializing chat tables in SQLite database...');

// Create chat tables if they don't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating chats table:', err);
    } else {
      console.log('✅ Chats table ready');
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    content TEXT NOT NULL,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
    images TEXT, -- JSON array of base64 images
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE
  )`, (err) => {
    if (err) {
      console.error('Error creating chat_messages table:', err);
    } else {
      console.log('✅ Chat messages table ready');
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err);
  } else {
    console.log('Database initialization complete!');
  }
});
