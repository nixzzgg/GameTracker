const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Rutas
const jsonPath = path.join(__dirname, 'GameTrackerDatabase.json');
const dbPath = path.join(__dirname, 'database.db');

console.log('🚀 Iniciando migración de JSON a SQLite...');

// Verificar si existe el archivo JSON
if (!fs.existsSync(jsonPath)) {
  console.log('❌ No se encontró GameTrackerDatabase.json');
  process.exit(1);
}

// Leer datos del JSON
const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
console.log(`📊 Encontrados ${jsonData.users?.length || 0} usuarios en JSON`);

// Crear/abrir base de datos SQLite
const db = new Database(dbPath);

// Crear tablas
console.log('🗄️ Creando tablas...');
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

// Preparar statements
const insertUser = db.prepare(`
  INSERT OR REPLACE INTO users (id, username, password_hash, profile_picture, description, is_public, favorite_platform, schedule)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertGameList = db.prepare(`
  INSERT OR REPLACE INTO game_lists (user_id, list_type, game_data)
  VALUES (?, ?, ?)
`);

// Migrar usuarios
console.log('👥 Migrando usuarios...');
let migratedUsers = 0;

if (jsonData.users && Array.isArray(jsonData.users)) {
  for (const user of jsonData.users) {
    try {
      insertUser.run(
        user.id,
        user.username,
        user.passwordHash,
        user.profilePicture || '',
        user.description || '',
        user.isPublic !== false ? 1 : 0,
        user.favoritePlatform || 'Sin preferencias',
        JSON.stringify(user.schedule || [])
      );
      migratedUsers++;
    } catch (error) {
      console.error(`❌ Error migrando usuario ${user.username}:`, error.message);
    }
  }
}

// Migrar listas de juegos
console.log('🎮 Migrando listas de juegos...');
let migratedLists = 0;

if (jsonData.gameLists) {
  for (const [userId, userLists] of Object.entries(jsonData.gameLists)) {
    const gameListTypes = ['playing', 'completed', 'dropped', 'wishlist', 'recommendations'];
    
    for (const listType of gameListTypes) {
      try {
        const gameData = userLists[listType] || [];
        insertGameList.run(userId, listType, JSON.stringify(gameData));
        migratedLists++;
      } catch (error) {
        console.error(`❌ Error migrando lista ${listType} para usuario ${userId}:`, error.message);
      }
    }
  }
}

// Cerrar base de datos
db.close();

console.log('✅ Migración completada!');
console.log(`👥 Usuarios migrados: ${migratedUsers}`);
console.log(`🎮 Listas migradas: ${migratedLists}`);
console.log(`📁 Base de datos SQLite creada: ${dbPath}`);
console.log('');
console.log('🎯 Próximos pasos:');
console.log('1. Instala las dependencias: npm install');
console.log('2. Tu aplicación ahora usará SQLite automáticamente');
console.log('3. El archivo database.db se creará automáticamente si no existe');
