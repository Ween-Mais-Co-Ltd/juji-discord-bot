import { startBot } from './bot'
import { musicCacheCleaner } from './music/MusicCacheCleaner'

musicCacheCleaner.start()
await startBot()
