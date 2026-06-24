import { startApi } from './api'
import { startBot } from './bot'
import { ollamaClient } from './llm/OllamaClient'

ollamaClient.warmup()
await startApi()
await startBot()
