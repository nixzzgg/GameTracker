'use server';

import { getAllUsersWithGameLists, findUserById, loadUserData } from '@/lib/data-service';
import type { User } from '@/lib/types';
import type { GameState } from '@/hooks/use-game-store';

export async function getPublicProfiles(): Promise<{ user: User; lists: GameState }[]> {
  return await getAllUsersWithGameLists();
}

export async function getPublicProfile(userId: string): Promise<{ user: User | undefined, lists: GameState | null }> {
    const user = await findUserById(userId);
    if (!user || user.isPublic === false) {
        return { user: undefined, lists: null };
    }
    const lists = await loadUserData(userId);
    return { user, lists };
}
