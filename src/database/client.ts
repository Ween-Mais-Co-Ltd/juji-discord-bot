import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/bun-sql'
import { databaseUrl } from '../config'
import * as schema from './schema'

class DatabaseClient {
  readonly db = drizzle(databaseUrl, { schema })
  enabled = false

  async connect(): Promise<void> {
    try {
      await this.db.execute(sql`select 1`)
      this.enabled = true
      console.log('[database] connected')
    } catch (error) {
      this.enabled = false
      console.warn('[database] connection failed — analytics disabled:', error)
    }
  }
}

export const databaseClient = new DatabaseClient()
export const db = databaseClient.db
