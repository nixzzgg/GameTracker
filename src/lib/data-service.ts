
// Este archivo ahora redirige a supabase-data-service.ts
// Mantenemos la misma interfaz para compatibilidad

export {
  findUserByUsername,
  findUserById,
  getPublicUsers,
  createUser,
  updateUser,
  getAllUsersWithGameLists,
  loadUserData,
  saveUserData
} from './supabase-data-service';