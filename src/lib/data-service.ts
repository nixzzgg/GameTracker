
'use server';

import type { GameState } from '@/hooks/use-game-store';
import type { User } from '@/lib/types';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// The user in the DB will have a password hash
interface UserInDb extends User {
  passwordHash: string;
}

type Database = {
  users: UserInDb[];
  gameLists: {
    [userId: string]: GameState;
  };
};

const dbPath = path.join(process.cwd(), 'GameTrackerDatabase.json');

async function readDb(): Promise<Database> {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(data);
    // Ensure the structure is correct
    if (!db.users) db.users = [];
    if (!db.gameLists) db.gameLists = {};
    return db;
  } catch (error: any) {
    if (error.code === 'ENOENT' || error instanceof SyntaxError) {
      // File doesn't exist or is empty/corrupt, create it with a default structure
      const defaultDb: Database = { users: [], gameLists: {} };
      await writeDb(defaultDb);
      return defaultDb;
    }
    console.error('Failed to read database file:', error);
    throw new Error('Could not read database');
  }
}

async function writeDb(data: Database): Promise<void> {
  try {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write to database file:', error);
    throw new Error('Could not write to database');
  }
}

// User Functions
export async function findUserByUsername(username: string): Promise<UserInDb | undefined> {
  const db = await readDb();
  return db.users.find((user) => user.username.toLowerCase() === username.toLowerCase());
}

export async function findUserById(userId: string): Promise<User | undefined> {
  const db = await readDb();
  const userInDb = db.users.find((user) => user.id === userId);
  if (!userInDb) return undefined;
  const { passwordHash, ...user } = userInDb;
  return user;
}

export async function getPublicUsers(): Promise<User[]> {
    const db = await readDb();
    const publicUsers = db.users.filter(user => user.isPublic !== false);
    
    return publicUsers.map(userInDb => {
      const { passwordHash, ...user } = userInDb;
      return user;
    });
}

export async function createUser(username: string, password: string): Promise<User> {
  const db = await readDb();

  const existingUser = await findUserByUsername(username);
  if (existingUser) {
    throw new Error('El nombre de usuario ya está en uso');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser: UserInDb = {
    id: crypto.randomUUID(),
    username,
    passwordHash,
    profilePicture: '',
    description: '',
    isPublic: true,
    schedule: [],
    favoritePlatform: 'Sin preferencias',
  };

  db.users.push(newUser);
  db.gameLists[newUser.id] = { playing: [], completed: [], dropped: [], wishlist: [], recommendations: [] };
  
  await writeDb(db);

  const { passwordHash: _, ...user } = newUser;
  return user;
}

export async function updateUser(userId: string, data: Partial<User & { newPassword?: string }>): Promise<User> {
  const db = await readDb();
  const userIndex = db.users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    throw new Error('User not found');
  }

  const currentUser = db.users[userIndex];

  // Update fields
  if (data.username) {
      const existing = await findUserByUsername(data.username);
      if (existing && existing.id !== userId) {
          throw new Error('El nombre de usuario ya está en uso');
      }
      currentUser.username = data.username;
  }
  if (data.description !== undefined) currentUser.description = data.description;
  if (data.profilePicture !== undefined) currentUser.profilePicture = data.profilePicture;
  if (data.isPublic !== undefined) currentUser.isPublic = data.isPublic;
  if (data.schedule !== undefined) currentUser.schedule = data.schedule;
  if (data.favoritePlatform !== undefined) currentUser.favoritePlatform = data.favoritePlatform;

  if (data.newPassword) {
    currentUser.passwordHash = await bcrypt.hash(data.newPassword, 10);
  }

  db.users[userIndex] = currentUser;
  await writeDb(db);

  const { passwordHash, ...updatedUser } = currentUser;
  return updatedUser;
}

export async function getAllUsersWithGameLists(): Promise<{ user: User; lists: GameState }[]> {
    const db = await readDb();
    const publicUsers = db.users.filter(user => user.isPublic !== false);
    
    return publicUsers.map(userInDb => {
      const { passwordHash, ...user } = userInDb;
      const lists = db.gameLists[user.id] || { playing: [], completed: [], dropped: [], wishlist: [], recommendations: [] };
      return { user, lists };
    });
}

// Game Data Functions
export async function loadUserData(userId: string): Promise<GameState> {
  const db = await readDb();
  return db.gameLists[userId] || { playing: [], completed: [], dropped: [], wishlist: [], recommendations: [] };
}

export async function saveUserData(
  userId: string,
  data: GameState
): Promise<void> {
  const db = await readDb();
  if (!db.gameLists) {
    db.gameLists = {};
  }
  db.gameLists[userId] = data;
  await writeDb(db);
}