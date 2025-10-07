
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { fetchPlaytimePrediction } from '@/app/(app)/inicio/actions';

export default function PlaytimeOracleCard() {
    const { user } = useAuth();
    const [gameName, setGameName] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        if (!result) return;

        const timer = setTimeout(() => {
            setIsFadingOut(true);
            const fadeTimer = setTimeout(() => {
                setResult(null);
                setGameName('');
            }, 500); // Animation duration
            
            return () => clearTimeout(fadeTimer);
        }, 15000); // 15 seconds

        return () => clearTimeout(timer);
    }, [result]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !gameName) return;

        setIsLoading(true);
        setError(null);
        setResult(null);
        setIsFadingOut(false);

        const response = await fetchPlaytimePrediction(user.id, gameName);
        if (response.error) {
            setError(response.error);
        } else {
            setResult(response.prediction);
        }
        setIsLoading(false);
    };

    return (
        <Card className="mt-4">
            <CardContent className="p-4 space-y-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input 
                        placeholder="Escribe el nombre de un juego..."
                        value={gameName}
                        onChange={(e) => setGameName(e.target.value)}
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading || !gameName} size="icon">
                        {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 />}
                        <span className="sr-only">Predecir</span>
                    </Button>
                </form>
                
                {isLoading && (
                    <div className="flex flex-col justify-center items-center text-center text-muted-foreground p-4 min-h-[52px]">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="text-sm font-semibold font-headline">Analizando...</p>
                    </div>
                )}
                
                {result && !isLoading && !error && (
                    <div className={`text-center p-4 bg-card/50 rounded-lg min-h-[52px] flex items-center justify-center transition-opacity duration-500 ease-in-out ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
                        <p className="text-sm text-muted-foreground italic">"{result}"</p>
                    </div>
                )}
                {error && !isLoading && (
                    <div className="text-center p-4 text-muted-foreground min-h-[52px] flex items-center justify-center">
                        <p className="text-sm">{error}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
