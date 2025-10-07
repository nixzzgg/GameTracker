'use server';

import type { GameState } from '@/hooks/use-game-store';
import type { User } from '@/lib/types';
import { supabase, type DatabaseUser } from '@/lib/supabase';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// Convertir DatabaseUser a User (sin password_hash)
function dbUserToUser(dbUser: DatabaseUser): User {
  return {
    id: dbUser.id,
    username: dbUser.username,
    profilePicture: dbUser.profile_picture,
    description: dbUser.description,
    isPublic: dbUser.is_public,
    schedule: dbUser.schedule,
    favoritePlatform: dbUser.favorite_platform,
  };
}

// User Functions
export async function findUserByUsername(username: string): Promise<DatabaseUser | undefined> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('username', username)
    .single();

  if (error || !data) return undefined;
  return data as DatabaseUser;
}

export async function findUserById(userId: string): Promise<User | undefined> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return undefined;
  return dbUserToUser(data as DatabaseUser);
}

export async function getPublicUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('is_public', true);

  if (error || !data) return [];
  return data.map((user: DatabaseUser) => dbUserToUser(user));
}

export async function createUser(username: string, password: string): Promise<User> {
  // Verificar si el usuario ya existe
  const existingUser = await findUserByUsername(username);
  if (existingUser) {
    throw new Error('El nombre de usuario ya está en uso');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = crypto.randomUUID();

  // Crear usuario
  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert([{
      id: userId,
      username,
      password_hash: passwordHash,
      profile_picture: '',
      description: '',
      is_public: true,
      schedule: [],
      favorite_platform: 'Sin preferencias',
    }])
    .select()
    .single();

  if (userError || !userData) {
    throw new Error('Error al crear usuario: ' + userError?.message);
  }

  // Crear listas de juegos vacías
  const gameListTypes = ['playing', 'completed', 'dropped', 'wishlist', 'recommendations'];
  const gameListsData = gameListTypes.map(type => ({
    user_id: userId,
    list_type: type,
    game_data: []
  }));

  const { error: listsError } = await supabase
    .from('game_lists')
    .insert(gameListsData);

  if (listsError) {
    console.error('Error creating game lists:', listsError);
    // No lanzamos error aquí porque el usuario ya fue creado
  }

  return dbUserToUser(userData as DatabaseUser);
}

export async function updateUser(userId: string, data: Partial<User & { newPassword?: string }>): Promise<User> {
  const updateData: any = {};

  // Mapear campos
  if (data.username) updateData.username = data.username;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.profilePicture !== undefined) updateData.profile_picture = data.profilePicture;
  if (data.isPublic !== undefined) updateData.is_public = data.isPublic;
  if (data.schedule !== undefined) updateData.schedule = data.schedule;
  if (data.favoritePlatform !== undefined) updateData.favorite_platform = data.favoritePlatform;

  // Verificar username único si se está actualizando
  if (data.username) {
    const existing = await findUserByUsername(data.username);
    if (existing && existing.id !== userId) {
      throw new Error('El nombre de usuario ya está en uso');
    }
  }

  // Hash de nueva contraseña si se proporciona
  if (data.newPassword) {
    updateData.password_hash = await bcrypt.hash(data.newPassword, 10);
  }

  const { data: updatedData, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error || !updatedData) {
    throw new Error('Error al actualizar usuario: ' + error?.message);
  }

  return dbUserToUser(updatedData as DatabaseUser);
}

export async function getAllUsersWithGameLists(): Promise<{ user: User; lists: GameState }[]> {
  // Obtener usuarios públicos
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .eq('is_public', true);

  if (usersError || !users) return [];

  // Obtener listas de juegos para todos los usuarios
  const userIds = users.map(u => u.id);
  const { data: gameLists, error: listsError } = await supabase
    .from('game_lists')
    .select('*')
    .in('user_id', userIds);

  if (listsError) {
    console.error('Error fetching game lists:', listsError);
  }

  // Combinar datos
  return users.map((user: DatabaseUser) => {
    const userLists = gameLists?.filter(list => list.user_id === user.id) || [];
    
    const lists: GameState = {
      playing: userLists.find(l => l.list_type === 'playing')?.game_data || [],
      completed: userLists.find(l => l.list_type === 'completed')?.game_data || [],
      dropped: userLists.find(l => l.list_type === 'dropped')?.game_data || [],
      wishlist: userLists.find(l => l.list_type === 'wishlist')?.game_data || [],
      recommendations: userLists.find(l => l.list_type === 'recommendations')?.game_data || [],
    };

    return {
      user: dbUserToUser(user),
      lists
    };
  });
}

// Game Data Functions
export async function loadUserData(userId: string): Promise<GameState> {
  const { data, error } = await supabase
    .from('game_lists')
    .select('*')
    .eq('user_id', userId);

  if (error || !data) {
    return { playing: [], completed: [], dropped: [], wishlist: [], recommendations: [] };
  }

  const lists: GameState = {
    playing: data.find(l => l.list_type === 'playing')?.game_data || [],
    completed: data.find(l => l.list_type === 'completed')?.game_data || [],
    dropped: data.find(l => l.list_type === 'dropped')?.game_data || [],
    wishlist: data.find(l => l.list_type === 'wishlist')?.game_data || [],
    recommendations: data.find(l => l.list_type === 'recommendations')?.game_data || [],
  };

  return lists;
}

export async function saveUserData(userId: string, gameState: GameState): Promise<void> {
  const updates = [
    { user_id: userId, list_type: 'playing', game_data: gameState.playing },
    { user_id: userId, list_type: 'completed', game_data: gameState.completed },
    { user_id: userId, list_type: 'dropped', game_data: gameState.dropped },
    { user_id: userId, list_type: 'wishlist', game_data: gameState.wishlist },
    { user_id: userId, list_type: 'recommendations', game_data: gameState.recommendations },
  ];

  for (const update of updates) {
    const { error } = await supabase
      .from('game_lists')
      .upsert(update, {
        onConflict: 'user_id,list_type'
      });

    if (error) {
      console.error(`Error updating ${update.list_type} list:`, error);
      throw new Error(`Error al guardar lista ${update.list_type}`);
    }
  }
}
