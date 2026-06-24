const Database = require('better-sqlite3');
const db = new Database('database.sqlite');
try {
  db.exec('ALTER TABLE files ADD COLUMN parentId TEXT');
  console.log("Column parentId added");
} catch(e) {
  console.log("Error:", e.message);
}
