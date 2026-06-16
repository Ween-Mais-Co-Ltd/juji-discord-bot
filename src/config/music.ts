import { join } from 'node:path'

export const cacheDir = Bun.env.MUSIC_CACHE_DIR ?? join(process.cwd(), 'music_cache')

export const cookiesFile = Bun.env.YTDLP_COOKIES_FILE ?? join(process.cwd(), 'cookies.txt')

const retentionDays = Number(Bun.env.MUSIC_CACHE_RETENTION_DAYS ?? 3)
export const cacheRetentionMs = retentionDays * 24 * 60 * 60 * 1000

const sweepHours = Number(Bun.env.MUSIC_CACHE_SWEEP_HOURS ?? 6)
export const cacheSweepIntervalMs = sweepHours * 60 * 60 * 1000
