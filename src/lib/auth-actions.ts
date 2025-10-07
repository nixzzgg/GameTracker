'use server';

import * as z from 'zod';
import bcrypt from 'bcrypt';
import { findUserByUsername, createUser as createDbUser } from './data-service';

const registerSchema = z.object({
    username: z.string()
        .min(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' })
        .max(8, { message: 'El nombre de usuario no puede tener más de 8 caracteres' })
        .regex(/^[a-z0-9]+$/, { message: 'Solo se permiten letras minúsculas y números sin espacios' }),
    password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
});

const loginSchema = z.object({
    username: z.string().min(1, { message: 'El nombre de usuario no puede estar vacío' }),
    password: z.string().min(1, { message: 'La contraseña no puede estar vacía' }),
});

export async function registerUser(values: z.infer<typeof registerSchema>) {
    const validatedFields = registerSchema.safeParse(values);
    if (!validatedFields.success) {
        return { error: "Campos inválidos" };
    }
    const { username, password } = validatedFields.data;
    try {
        const user = await createDbUser(username, password);
        return { success: "Usuario creado", user };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function loginUser(values: z.infer<typeof loginSchema>) {
    const validatedFields = loginSchema.safeParse(values);
    if (!validatedFields.success) {
        return { error: "Campos inválidos" };
    }
    const { username, password } = validatedFields.data;

    const existingUser = await findUserByUsername(username);

    if (!existingUser) {
        return { error: "Credenciales inválidas" };
    }

    const passwordsMatch = await bcrypt.compare(password, existingUser.passwordHash);

    if (!passwordsMatch) {
        return { error: "Credenciales inválidas" };
    }
    
    const { passwordHash: _, ...user } = existingUser;
    return { success: "Sesión iniciada", user };
}
