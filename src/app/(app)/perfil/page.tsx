
"use client";

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User as UserIcon, Camera, Dna, Clock, Trash2, Gamepad } from 'lucide-react';
import { updateUserProfile, changePassword } from './actions';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import type { ScheduleBlock, Platform } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const scheduleBlockSchema = z.object({
  id: z.string(),
  day: z.enum(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

const platformSchema = z.enum(['PC', 'PlayStation', 'Xbox', 'Nintendo', 'Mobile', 'Sin preferencias']);

const profileSchema = z.object({
  username: z.string().min(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' }).max(50),
  description: z.string().max(200, { message: 'La descripción no puede superar los 200 caracteres' }).optional().default(''),
  profilePicture: z.string().optional(),
  isPublic: z.boolean().default(true),
  schedule: z.array(scheduleBlockSchema).optional(),
  favoritePlatform: platformSchema.optional(),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, { message: "La contraseña actual es requerida" }),
    newPassword: z.string().min(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' }),
});

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;
const platforms: Platform[] = ['PC', 'PlayStation', 'Xbox', 'Nintendo', 'Mobile', 'Sin preferencias'];

export default function PerfilPage() {
    const { user, login, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isProfilePending, startProfileTransition] = useTransition();
    const [isPasswordPending, startPasswordTransition] = useTransition();
    const [previewImage, setPreviewImage] = useState<string | undefined>(user?.profilePicture);
    const [schedule, setSchedule] = useState<ScheduleBlock[]>([]);

    const profileForm = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            username: '',
            description: '',
            profilePicture: '',
            isPublic: true,
            schedule: [],
            favoritePlatform: undefined,
        },
    });

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { currentPassword: '', newPassword: '' },
    });
    
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
        if (user) {
            const userSchedule = user.schedule || [];
            profileForm.reset({
                username: user.username,
                description: user.description || '',
                profilePicture: user.profilePicture || '',
                isPublic: user.isPublic !== false,
                schedule: userSchedule,
                favoritePlatform: user.favoritePlatform
            });
            setPreviewImage(user.profilePicture);
            setSchedule(userSchedule);
        }
    }, [user, loading, router, profileForm]);

    const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUri = reader.result as string;
                setPreviewImage(dataUri);
                profileForm.setValue('profilePicture', dataUri);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddBlock = () => {
        const newBlock: ScheduleBlock = {
            id: crypto.randomUUID(),
            day: 'Lunes',
            start: '18:00',
            end: '20:00',
        };
        const newSchedule = [...schedule, newBlock];
        setSchedule(newSchedule);
        profileForm.setValue('schedule', newSchedule);
    };

    const handleRemoveBlock = (id: string) => {
        const newSchedule = schedule.filter(block => block.id !== id);
        setSchedule(newSchedule);
        profileForm.setValue('schedule', newSchedule);
    };

    const handleBlockChange = (id: string, field: keyof ScheduleBlock, value: string) => {
        const newSchedule = schedule.map(block => 
            block.id === id ? { ...block, [field]: value } : block
        );
        setSchedule(newSchedule);
        profileForm.setValue('schedule', newSchedule);
    }

    async function onProfileSubmit(values: z.infer<typeof profileSchema>) {
        if (!user) return;
        startProfileTransition(async () => {
            const result = await updateUserProfile(user.id, values);
            if (result.error || !result.user) {
                toast({ title: 'Error', description: result.error });
            } else {
                login(result.user); // Update auth context
                toast({ title: 'Éxito', description: 'Perfil actualizado correctamente' });
            }
        });
    }
    
    async function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
        if (!user) return;
        startPasswordTransition(async () => {
            const result = await changePassword(user.id, values);
            if (result.error) {
                toast({ title: 'Error', description: result.error });
            } else {
                toast({ title: 'Éxito', description: 'Contraseña cambiada correctamente' });
                passwordForm.reset();
            }
        });
    }

    if (loading) {
        return null;
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            <header>
                <h1 className="text-3xl font-bold font-headline text-primary">Configuración de perfil</h1>
                <p className="text-muted-foreground mt-1">Gestiona la información de tu cuenta</p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Análisis de IA</CardTitle>
                    <CardDescription>Descubre tus gustos y obtén información personalizada sobre tu perfil de jugador</CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/perfil/adn">
                        <Button variant="outline" className="w-full">
                            <Dna className="mr-2 h-4 w-4" />
                            Ver mi ADN Gamer
                        </Button>
                    </Link>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Información de perfil</CardTitle>
                    <CardDescription>Actualiza tu nombre de usuario, descripción, foto y privacidad</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-8">
                            <div>
                                <h3 className="text-lg font-medium mb-4">Perfil Básico</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-20 w-20">
                                            <AvatarImage src={previewImage} />
                                            <AvatarFallback><UserIcon className="h-10 w-10" /></AvatarFallback>
                                        </Avatar>
                                        <div className="relative">
                                            <Button asChild variant="outline">
                                                <label htmlFor="picture-upload" className="cursor-pointer flex items-center gap-2">
                                                    <Camera className="h-4 w-4" />
                                                    Cambiar foto
                                                </label>
                                            </Button>
                                            <Input id="picture-upload" type="file" className="sr-only" accept="image/*" onChange={handlePictureChange} disabled={isProfilePending}/>
                                        </div>
                                    </div>
                                    <FormField control={profileForm.control} name="username" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre de usuario</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Tu nombre de usuario" {...field} disabled={isProfilePending} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={profileForm.control} name="description" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Descripción</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Una breve descripción sobre ti" {...field} disabled={isProfilePending} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={profileForm.control} name="favoritePlatform" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Plataforma favorita</FormLabel>
                                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona tu plataforma principal" />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                {platforms.map(platform => (
                                                    <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                                                ))}
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>Esto ayudará a la IA a recomendarte mejores juegos</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            </div>
                            
                            <Separator />
                            
                            <div>
                                <h3 className="text-lg font-medium mb-4">Horario de juego</h3>
                                <div className="space-y-4">
                                    {schedule.map((block) => (
                                        <div key={block.id} className="grid grid-cols-1 sm:grid-cols-8 gap-2 items-center">
                                            <div className="sm:col-span-3">
                                                <Select value={block.day} onValueChange={(value) => handleBlockChange(block.id, 'day', value)}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {daysOfWeek.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="sm:col-span-2">
                                                <Input type="time" value={block.start} onChange={(e) => handleBlockChange(block.id, 'start', e.target.value)} />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <Input type="time" value={block.end} onChange={(e) => handleBlockChange(block.id, 'end', e.target.value)} />
                                            </div>
                                            <div className="sm:col-span-1 flex justify-end">
                                                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveBlock(block.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" onClick={handleAddBlock}>
                                        <Clock className="mr-2 h-4 w-4" />
                                        Añadir bloque horario
                                    </Button>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <h3 className="text-lg font-medium mb-4">Privacidad</h3>
                                <FormField
                                    control={profileForm.control}
                                    name="isPublic"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel>Perfil público</FormLabel>
                                                <FormDescription>Otros usuarios podrán ver tu perfil y tus listas de juegos</FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isProfilePending} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Button type="submit" disabled={isProfilePending}>
                                {isProfilePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                                Guardar cambios de perfil
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Cambiar contraseña</CardTitle>
                    <CardDescription>Actualiza tu contraseña, se recomienda usar una contraseña segura</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                             <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contraseña actual</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} disabled={isPasswordPending} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nueva contraseña</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} disabled={isPasswordPending} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <Button type="submit" disabled={isPasswordPending}>
                                {isPasswordPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Cambiar contraseña
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}