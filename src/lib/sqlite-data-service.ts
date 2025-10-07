'use server';

import type { GameState } from '@/hooks/use-game-store';
import type { User } from '@/lib/types';
import { getDatabase, type DatabaseUser, type GameList } from '@/lib/database';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// Convertir DatabaseUser a User (sin password_hash y convertir tipos)
function dbUserToUser(dbUser: DatabaseUser): User {
  return {
    id: dbUser.id,
    username: dbUser.username,
    profilePicture: dbUser.profile_picture,
    description: dbUser.description,
    isPublic: dbUser.is_public === 1,
    schedule: JSON.parse(dbUser.schedule || '[]'),
    favoritePlatform: dbUser.favorite_platform,
  };
}

// User Functions
export async function findUserByUsername(username: string): Promise<DatabaseUser | undefined> {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)');
  const user = stmt.get(username) as DatabaseUser | undefined;
  return user;
}

export async function findUserById(userId: string): Promise<User | undefined> {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const dbUser = stmt.get(userId) as DatabaseUser | undefined;
  
  if (!dbUser) return undefined;
  return dbUserToUser(dbUser);
}

export async function getPublicUsers(): Promise<User[]> {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE is_public = 1');
  const users = stmt.all() as DatabaseUser[];
  
  return users.map(dbUserToUser);
}

export async function createUser(username: string, password: string): Promise<User> {
  // Verificar si el usuario ya existe
  const existingUser = await findUserByUsername(username);
  if (existingUser) {
    throw new Error('El nombre de usuario ya está en uso');
  }

  const db = getDatabase();
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = crypto.randomUUID();

  // Crear usuario
  const insertUserStmt = db.prepare(`
    INSERT INTO users (id, username, password_hash, profile_picture, description, is_public, schedule, favorite_platform)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUserStmt.run(
    userId,
    username,
    passwordHash,
    '',
    '',
    1, // true
    '[]',
    'Sin preferencias'
  );

  // Crear listas de juegos vacías
  const insertGameListStmt = db.prepare(`
    INSERT INTO game_lists (user_id, list_type, game_data)
    VALUES (?, ?, ?)
  `);

  const gameListTypes = ['playing', 'completed', 'dropped', 'wishlist', 'recommendations'];
  for (const listType of gameListTypes) {
    insertGameListStmt.run(userId, listType, '[]');
  }

  // Obtener el usuario creado
  const newUser = await findUserById(userId);
  if (!newUser) {
    throw new Error('Error al crear usuario');
  }

  return newUser;
}

export async function updateUser(userId: string, data: Partial<User & { newPassword?: string }>): Promise<User> {
  const db = getDatabase();
  
  // Verificar username único si se está actualizando
  if (data.username) {
    const existing = await findUserByUsername(data.username);
    if (existing && existing.id !== userId) {
      throw new Error('El nombre de usuario ya está en uso');
    }
  }

  // Construir la consulta de actualización dinámicamente
  const updateFields: string[] = [];
  const updateValues: any[] = [];

  if (data.username) {
    updateFields.push('username = ?');
    updateValues.push(data.username);
  }
  if (data.description !== undefined) {
    updateFields.push('description = ?');
    updateValues.push(data.description);
  }
  if (data.profilePicture !== undefined) {
    updateFields.push('profile_picture = ?');
    updateValues.push(data.profilePicture);
  }
  if (data.isPublic !== undefined) {
    updateFields.push('is_public = ?');
    updateValues.push(data.isPublic ? 1 : 0);
  }
  if (data.schedule !== undefined) {
    updateFields.push('schedule = ?');
    updateValues.push(JSON.stringify(data.schedule));
  }
  if (data.favoritePlatform !== undefined) {
    updateFields.push('favorite_platform = ?');
    updateValues.push(data.favoritePlatform);
  }
  if (data.newPassword) {
    updateFields.push('password_hash = ?');
    updateValues.push(await bcrypt.hash(data.newPassword, 10));
  }

  if (updateFields.length === 0) {
    throw new Error('No hay campos para actualizar');
  }

  updateValues.push(userId); // Para el WHERE

  const updateStmt = db.prepare(`
    UPDATE users 
    SET ${updateFields.join(', ')}
    WHERE id = ?
  `);

  updateStmt.run(...updateValues);

  // Obtener el usuario actualizado
  const updatedUser = await findUserById(userId);
  if (!updatedUser) {
    throw new Error('Error al actualizar usuario');
  }

  return updatedUser;
}

export async function getAllUsersWithGameLists(): Promise<{ user: User; lists: GameState }[]> {
  const db = getDatabase();
  
  // Obtener usuarios públicos
  const usersStmt = db.prepare('SELECT * FROM users WHERE is_public = 1');
  const users = usersStmt.all() as DatabaseUser[];

  // Obtener listas de juegos para todos los usuarios
  const gameListsStmt = db.prepare('SELECT * FROM game_lists WHERE user_id IN (' + users.map(() => '?').join(',') + ')');
  const gameLists = gameListsStmt.all(...users.map(u => u.id)) as GameList[];

  // Combinar datos
  return users.map((dbUser: DatabaseUser) => {
    const userLists = gameLists.filter(list => list.user_id === dbUser.id);
    
    const lists: GameState = {
      playing: JSON.parse(userLists.find(l => l.list_type === 'playing')?.game_data || '[]'),
      completed: JSON.parse(userLists.find(l => l.list_type === 'completed')?.game_data || '[]'),
      dropped: JSON.parse(userLists.find(l => l.list_type === 'dropped')?.game_data || '[]'),
      wishlist: JSON.parse(userLists.find(l => l.list_type === 'wishlist')?.game_data || '[]'),
      recommendations: JSON.parse(userLists.find(l => l.list_type === 'recommendations')?.game_data || '[]'),
    };

    return {
      user: dbUserToUser(dbUser),
      lists
    };
  });
}

// Game Data Functions
export async function loadUserData(userId: string): Promise<GameState> {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM game_lists WHERE user_id = ?');
  const lists = stmt.all(userId) as GameList[];

  const gameState: GameState = {
    playing: JSON.parse(lists.find(l => l.list_type === 'playing')?.game_data || '[]'),
    completed: JSON.parse(lists.find(l => l.list_type === 'completed')?.game_data || '[]'),
    dropped: JSON.parse(lists.find(l => l.list_type === 'dropped')?.game_data || '[]'),
    wishlist: JSON.parse(lists.find(l => l.list_type === 'wishlist')?.game_data || '[]'),
    recommendations: JSON.parse(lists.find(l => l.list_type === 'recommendations')?.game_data || '[]'),
  };

  return gameState;
}

export async function saveUserData(userId: string, gameState: GameState): Promise<void> {
  const db = getDatabase();
  
  const updateStmt = db.prepare(`
    INSERT OR REPLACE INTO game_lists (user_id, list_type, game_data)
    VALUES (?, ?, ?)
  `);

  const updates = [
    { type: 'playing', data: gameState.playing },
    { type: 'completed', data: gameState.completed },
    { type: 'dropped', data: gameState.dropped },
    { type: 'wishlist', data: gameState.wishlist },
    { type: 'recommendations', data: gameState.recommendations },
  ];

  for (const update of updates) {
    updateStmt.run(userId, update.type, JSON.stringify(update.data));
  }
}
