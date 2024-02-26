import { Redis } from 'ioredis'

export const redis = new Redis({
  password:
    process.env.NODE_ENV === 'production'
      ? process.env.REDIS_PASSWORD
      : undefined,
})
