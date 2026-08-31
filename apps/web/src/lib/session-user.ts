import { User } from '../types';
import { authClient } from './auth-client';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

interface BetterAuthUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  createdAt: string | Date;
  // Custom field added via `user.additionalFields` on the api's better-auth
  // config; not present in the client's base type, hence the loose cast at
  // the call site.
  username?: string;
}

export function mapSessionUser(sessionUser: BetterAuthUser): User {
  return {
    id: sessionUser.id,
    name: sessionUser.name,
    username: sessionUser.username || sessionUser.email.split('@')[0],
    email: sessionUser.email,
    avatar: sessionUser.image || DEFAULT_AVATAR,
    status: 'online',
    role: 'Member',
    createdAt:
      typeof sessionUser.createdAt === 'string'
        ? sessionUser.createdAt
        : sessionUser.createdAt.toISOString(),
  };
}

// better-auth's `useSession()` return type is generic over the plugin/field
// config passed to `createAuthClient`, and doesn't resolve cleanly without
// wiring cross-package type inference to the api's `auth` instance. The
// runtime value is fine (it's the actual session), so it's cast to the
// shape we know the api actually returns instead of chasing that inference.
export function useCurrentUser(): {
  currentUser: User | null;
  isPending: boolean;
  refetch: () => Promise<void>;
} {
  const { data, isPending, refetch } = authClient.useSession() as unknown as {
    data: { user: BetterAuthUser } | null;
    isPending: boolean;
    refetch: () => Promise<void>;
  };

  return {
    currentUser: data ? mapSessionUser(data.user) : null,
    isPending,
    refetch,
  };
}
