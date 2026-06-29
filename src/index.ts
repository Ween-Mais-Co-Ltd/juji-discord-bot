import { startApi } from './api'
import { startBot } from './bot'
import { databaseClient } from './database'

await databaseClient.connect()
await startApi()
await startBot()
