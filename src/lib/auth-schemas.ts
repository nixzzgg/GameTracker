import * as z from 'zod';

export const registerSchema = z.object({
    username: z.string()
        .min(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' })
        .max(8, { message: 'El nombre de usuario no puede tener más de 8 caracteres' })
        .regex(/^[a-z0-9]+$/, { message: 'Solo se permiten letras minúsculas y números sin espacios' }),
    password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
});

export const loginSchema = z.object({
    username: z.string().min(1, { message: 'El nombre de usuario no puede estar vacío' }),
    password: z.string().min(1, { message: 'La contraseña no puede estar vacía' }),
});
