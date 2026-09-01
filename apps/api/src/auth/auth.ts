import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

function generateUsername(email: string): string {
  const base = email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_');
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}_${suffix}`;
}

export const auth = betterAuth({
  database: new Pool({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USERNAME ?? 'nexus',
    password: process.env.DB_PASSWORD ?? 'nexus',
    database: process.env.DB_NAME ?? 'nexus',
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  trustedOrigins: [process.env.WEB_ORIGIN ?? 'http://localhost:5173'],
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    },
  },
  user: {
    additionalFields: {
      username: {
        type: 'string',
        // Not enforced as required here: that would block social sign-in,
        // which never supplies a username. The register form still requires
        // it for email/password sign-up, and the hook below backfills it
        // for everyone else so the NOT NULL column is always satisfied.
        required: false,
        input: true,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (user.username) return { data: user };
          return { data: { ...user, username: generateUsername(user.email) } };
        },
      },
    },
  },
});
