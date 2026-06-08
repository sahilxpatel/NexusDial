import dotenv from 'dotenv';
dotenv.config();

const required = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET', 'GROQ_API_KEY'] as const;

for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing env var: ${key}`);
}

export const config = {
  databaseUrl: process.env.DATABASE_URL!,
  redisUrl: process.env.REDIS_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  groqKey: process.env.GROQ_API_KEY!,
  port: Number(process.env.PORT ?? 3000),
};
