import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'database.db');

// Crear la base de datos y las tablas si no existen
function initializeDatabase() {
  const db = new Database(dbPath);
  
  // Crear tabla de usuarios
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      profile_picture TEXT DEFAULT '',
      description TEXT DEFAULT '',
      is_public INTEGER DEFAULT 1,
      favorite_platform TEXT DEFAULT 'Sin preferencias',
      schedule TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Crear tabla de listas de juegos
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      list_type TEXT NOT NULL,
      game_data TEXT NOT NULL DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(user_id, list_type)
    )
  `);

  // Crear índices para mejor rendimiento
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_is_public ON users(is_public);
    CREATE INDEX IF NOT EXISTS idx_game_lists_user_id ON game_lists(user_id);
    CREATE INDEX IF NOT EXISTS idx_game_lists_type ON game_lists(list_type);
  `);

  // Trigger para actualizar updated_at automáticamente
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_users_updated_at 
    AFTER UPDATE ON users
    BEGIN
      UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_game_lists_updated_at 
    AFTER UPDATE ON game_lists
    BEGIN
      UPDATE game_lists SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);

  return db;
}

// Singleton para la conexión de base de datos
let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    dbInstance = initializeDatabase();
  }
  return dbInstance;
}

// Cerrar la base de datos cuando la aplicación termine
export function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

// Tipos para TypeScript
export interface DatabaseUser {
  id: string;
  username: string;
  password_hash: string;
  profile_picture: string;
  description: string;
  is_public: number; // SQLite usa INTEGER para boolean
  favorite_platform: string;
  schedule: string; // JSON como string
  created_at: string;
  updated_at: string;
}

export interface GameList {
  id: number;
  user_id: string;
  list_type: 'playing' | 'completed' | 'dropped' | 'wishlist' | 'recommendations';
  game_data: string; // JSON como string
  created_at: string;
  updated_at: string;
}
