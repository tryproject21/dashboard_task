import { sql } from '@vercel/postgres';

export async function initDb() {
  try {
    // Memastikan tabel terbentuk di Cloud Postgres
    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        status TEXT DEFAULT 'todo',
        priority TEXT DEFAULT 'medium',
        deadline TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS meetings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        link TEXT
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        content TEXT,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        size INTEGER,
        type TEXT,
        "taskId" TEXT,
        "parentId" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    console.log("Postgres database initialized successfully.");
  } catch (error) {
    console.error("Error initializing Postgres database:", error);
  }
}

// Ekspor sql builder agar file lain bisa menggunakannya
export { sql };
