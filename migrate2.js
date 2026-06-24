const Database = require('better-sqlite3');
const db = new Database('database.sqlite');
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("Notes table created");
  
  try {
    db.exec('ALTER TABLE tasks ADD COLUMN completedAt DATETIME');
    console.log("Column completedAt added to tasks");
  } catch(e) {
    // column might exist
  }
} catch(e) {
  console.log("Error:", e.message);
}
