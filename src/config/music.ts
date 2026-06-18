import { join } from 'node:path'
import { numberEnv, optionalEnv } from '.'

export const cacheDir = optionalEnv('MUSIC_CACHE_DIR', join(process.cwd(), 'music_cache'))
export const cookiesFile = optionalEnv('YTDLP_COOKIES_FILE', join(process.cwd(), 'cookies.txt'))
export const streamThresholdSec = numberEnv('MUSIC_STREAM_THRESHOLD_SEC', 600)

const retentionDays = numberEnv('MUSIC_CACHE_RETENTION_DAYS', 3)
export const cacheRetentionMs = retentionDays * 24 * 60 * 60 * 1000

const sweepHours = numberEnv('MUSIC_CACHE_SWEEP_HOURS', 6)
export const cacheSweepIntervalMs = sweepHours * 60 * 60 * 1000
