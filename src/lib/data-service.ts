
// Este archivo ahora redirige a sqlite-data-service.ts
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
} from './sqlite-data-service';