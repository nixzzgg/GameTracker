"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { Search as SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newQuery = formData.get('query') as string;
    if (newQuery) {
      router.push(`/search?q=${encodeURIComponent(newQuery)}`);
    } else {
      router.push(`/inicio`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        name="query"
        type="search"
        placeholder="Busca juegos para añadir..."
        className="pl-10 w-full"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </form>
  );
}
