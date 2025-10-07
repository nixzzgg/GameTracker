
"use client";

import SearchBar from '@/components/search-bar';
import Recommendations from '@/components/menu/recommendations';
import { useAuth } from '@/hooks/use-auth';
import SugerenciaCard from '@/components/inicio/sugerencia-card';
import PlaytimeOracleCard from '@/components/inicio/playtime-oracle-card';
import DifficultyAnalyzerCard from '@/components/inicio/difficulty-analyzer-card';
import PanicButtonCard from '@/components/inicio/panic-button-card';


export default function InicioPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
        <header className="text-center space-y-4">
          <div>
            <h1 className="text-3xl font-bold font-headline text-primary">
              Hola, {user?.username}!
            </h1>
            <p className="text-muted-foreground mt-1">Qué vamos a jugar hoy?</p>
          </div>
          <div className="w-full max-w-lg mx-auto">
              <SearchBar />
          </div>
        </header>
        
        <main className="space-y-10">
          <div className="max-w-4xl mx-auto space-y-8">
            <div>
              <h2 className="text-xl md:text-2xl font-bold font-headline text-primary text-center">Sugerencia express</h2>
              <p className="text-muted-foreground mt-1 text-center">Pide a la IA una sugerencia contextual</p>
              <SugerenciaCard />
            </div>
             <div>
              <h2 className="text-xl md:text-2xl font-bold font-headline text-primary text-center">Oráculo del tiempo</h2>
              <p className="text-muted-foreground mt-1 text-center">Predice cuánto tardarás en completar un juego</p>
              <PlaytimeOracleCard />        
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold font-headline text-primary text-center">Análisis de dificultad</h2>
              <p className="text-muted-foreground mt-1 text-center">Será un reto divertido o una frustración?</p>
              <DifficultyAnalyzerCard />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold font-headline text-primary text-center">Parálisis por análisis?</h2>
              <p className="text-muted-foreground mt-1 text-center">Pulsa el botón. Recibe una orden. Juega.</p>
              <PanicButtonCard />
            </div>
          </div>
          
          <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold font-headline text-primary text-center">Para ti</h2>
              <p className="text-muted-foreground mt-1 mb-4 text-center">Basado en tu ADN Gamer, estos son los juegos que creemos que te encantarán</p>
              <Recommendations />
          </div>
        </main>
      </div>
    </div>
  );
}
