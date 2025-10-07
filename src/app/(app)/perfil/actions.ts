
'use server';

import { z } from 'zod';
import { updateUser as updateDbUser } from '@/lib/data-service';
import type { User, Platform } from '@/lib/types';
import bcrypt from 'bcrypt';
import fs from 'fs/promises';
import path from 'path';

const scheduleBlockSchema = z.object({
  id: z.string(),
  day: z.enum(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']),
  start: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido"),
  end: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido"),
});

const platformSchema = z.enum(['PC', 'PlayStation', 'Xbox', 'Nintendo', 'Mobile', 'Sin preferencias']);

const profileSchema = z.object({
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres').max(50),
  description: z.string().max(200, 'La descripción no puede superar los 200 caracteres').optional(),
  profilePicture: z.string().optional(),
  isPublic: z.boolean().default(true),
  schedule: z.array(scheduleBlockSchema).optional(),
  favoritePlatform: platformSchema.optional(),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "La contraseña actual es requerida"),
    newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
});

// This is a temporary solution due to data-service limitations
async function getUserWithHash(userId: string) {
    const dbPath = path.join(process.cwd(), 'GameTrackerDatabase.json');
    try {
        const dbData = await fs.readFile(dbPath, 'utf-8');
        const db = JSON.parse(dbData);
        return db.users.find((u: any) => u.id === userId);
    } catch (error) {
        return null;
    }
}

export async function updateUserProfile(userId: string, values: z.infer<typeof profileSchema>): Promise<{ success?: string; error?: string, user?: User }> {
    const validatedFields = profileSchema.safeParse(values);
    if (!validatedFields.success) {
        return { error: 'Campos inválidos' };
    }

    try {
        const updatedUser = await updateDbUser(userId, validatedFields.data);
        return { success: 'Perfil actualizado', user: updatedUser };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function changePassword(userId: string, values: z.infer<typeof passwordSchema>): Promise<{ success?: string; error?: string }> {
    const validatedFields = passwordSchema.safeParse(values);
    if (!validatedFields.success) {
        return { error: 'Campos inválidos' };
    }
    
    const userWithHash = await getUserWithHash(userId);
    if (!userWithHash) {
        return { error: 'Usuario no encontrado' };
    }

    const { currentPassword, newPassword } = validatedFields.data;
    
    const passwordsMatch = await bcrypt.compare(currentPassword, userWithHash.passwordHash);
    if (!passwordsMatch) {
        return { error: 'La contraseña actual es incorrecta' };
    }

    try {
        await updateDbUser(userId, { newPassword });
        return { success: 'Contraseña actualizada' };
    } catch (e: any) {
        return { error: e.message };
    }
}