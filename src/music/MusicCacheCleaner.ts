import { existsSync } from 'node:fs'
import { stat, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { cacheDir, cacheRetentionMs, cacheSweepIntervalMs } from '../config'

export class MusicCacheCleaner {
  private timer: ReturnType<typeof setInterval> | null = null

  constructor(
    private readonly cacheDir: string,
    private readonly retentionMs: number,
    private readonly sweepIntervalMs: number,
  ) {}

  async cleanup(): Promise<number> {
    if (!existsSync(this.cacheDir)) {
      return 0
    }

    const cutoff = Date.now() - this.retentionMs
    let deleted = 0

    for await (const name of new Bun.Glob('*.opus').scan({ cwd: this.cacheDir })) {
      const filePath = join(this.cacheDir, name)
      try {
        const stats = await stat(filePath)
        if (stats.mtimeMs < cutoff) {
          await unlink(filePath)
          deleted += 1
        }
      } catch (error) {
        console.error(`[music-cache] failed to evict ${filePath}:`, error)
      }
    }

    return deleted
  }

  start(): void {
    if (this.timer !== null) return
    this.sweep()
    this.timer = setInterval(() => {
      this.sweep()
    }, this.sweepIntervalMs)
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private sweep(): void {
    this.cleanup()
      .then((deleted) => {
        if (deleted > 0) {
          console.log(`[music-cache] removed ${deleted} expired file(s)`)
        }
      })
      .catch((error: unknown) => {
        console.error('[music-cache] cleanup sweep failed:', error)
      })
  }
}

export const musicCacheCleaner = new MusicCacheCleaner(
  cacheDir,
  cacheRetentionMs,
  cacheSweepIntervalMs,
)
