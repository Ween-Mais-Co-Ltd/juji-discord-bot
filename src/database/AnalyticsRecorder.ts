import { eq, sql } from 'drizzle-orm'
import { databaseClient, db } from './client'
import { listenEvents, playEvents, tracks, users } from './schema'
import type { EndReason, RequestSource } from './schema'
import type { Track } from '../types/track'

export interface PlayContext {
  discordUserId?: string
  displayName: string
  query?: string
  requestSource: RequestSource
}

export interface ListenerDuration {
  discordUserId: string
  displayName: string
  listenedSec: number
}

interface OpenEvent {
  eventId: string
  startedAtMs: number
}

class AnalyticsRecorder {
  private readonly open = new Map<string, OpenEvent>()

  recordPlay(guildId: string, voiceChannelId: string | null, track: Track, ctx: PlayContext): void {
    if (!databaseClient.enabled || !track.id) return
    void this.doRecordPlay(guildId, voiceChannelId, track, ctx).catch((error: unknown) => {
      console.error('[analytics] recordPlay failed:', error)
    })
  }

  recordEnd(guildId: string, endReason: EndReason, listeners: ListenerDuration[]): void {
    const openEvent = this.open.get(guildId)
    this.open.delete(guildId)
    if (!databaseClient.enabled || !openEvent) return
    void this.doRecordEnd(openEvent, guildId, endReason, listeners).catch((error: unknown) => {
      console.error('[analytics] recordEnd failed:', error)
    })
  }

  private async doRecordPlay(
    guildId: string,
    voiceChannelId: string | null,
    track: Track,
    ctx: PlayContext,
  ): Promise<void> {
    const trackValues = {
      title: track.title,
      author: track.author,
      url: track.url,
      thumbnail: track.thumbnail ?? null,
      durationSec: track.durationSec,
      sourceName: track.sourceName,
    }
    await db
      .insert(tracks)
      .values({ id: track.id, ...trackValues })
      .onConflictDoUpdate({ target: tracks.id, set: { ...trackValues, updatedAt: new Date() } })

    if (ctx.discordUserId) {
      await this.upsertUsers([{ id: ctx.discordUserId, displayName: ctx.displayName }])
    }

    const [row] = await db
      .insert(playEvents)
      .values({
        guildId,
        trackId: track.id,
        discordUserId: ctx.discordUserId ?? null,
        query: ctx.query ?? null,
        requestSource: ctx.requestSource,
        voiceChannelId,
      })
      .returning({ id: playEvents.id })

    if (row) this.open.set(guildId, { eventId: row.id, startedAtMs: Date.now() })
  }

  private async doRecordEnd(
    openEvent: OpenEvent,
    guildId: string,
    endReason: EndReason,
    listeners: ListenerDuration[],
  ): Promise<void> {
    const listenedSec = Math.round((Date.now() - openEvent.startedAtMs) / 1000)
    await db
      .update(playEvents)
      .set({ endedAt: new Date(), endReason, listenedSec })
      .where(eq(playEvents.id, openEvent.eventId))

    const valid = listeners.filter((listener) => listener.listenedSec > 0)
    if (valid.length === 0) return

    await this.upsertUsers(
      valid.map((listener) => ({ id: listener.discordUserId, displayName: listener.displayName })),
    )
    await db.insert(listenEvents).values(
      valid.map((listener) => ({
        playEventId: openEvent.eventId,
        guildId,
        discordUserId: listener.discordUserId,
        listenedSec: listener.listenedSec,
      })),
    )
  }

  private upsertUsers(rows: { id: string; displayName: string }[]): Promise<unknown> {
    return db
      .insert(users)
      .values(rows)
      .onConflictDoUpdate({
        target: users.id,
        set: { displayName: sql`excluded.display_name`, updatedAt: new Date() },
      })
  }
}

export const analyticsRecorder = new AnalyticsRecorder()
