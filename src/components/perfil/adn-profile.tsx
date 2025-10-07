"use client"

import type { AdnGamerOutput } from '@/ai/flows/adn-gamer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface AdnProfileProps {
    dna: AdnGamerOutput;
}

export default function AdnProfile({ dna }: AdnProfileProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Perfil de jugador</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{dna.summary}</p>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="font-headline">Géneros preferidos</CardTitle>
                    <CardDescription>Basado en los juegos de tus listas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {dna.topGenres.map(genre => (
                        <div key={genre.genre} className="space-y-1">
                            <div className="flex justify-between items-baseline">
                                <span className="font-medium">{genre.genre}</span>
                                <span className="text-sm text-muted-foreground">{Math.round(genre.percentage)}%</span>
                            </div>
                            <Progress value={genre.percentage} />
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Mecánicas comunes</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                            {dna.commonMechanics.map(mechanic => (
                            <Badge key={mechanic} variant="secondary">{mechanic}</Badge>
                            ))}
                    </CardContent>
                </Card>
                    <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Estilos artísticos</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        {dna.artisticStyles.map(style => (
                            <Badge key={style} variant="outline">{style}</Badge>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
