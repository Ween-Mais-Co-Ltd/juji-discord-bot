import { boolEnv, numberEnv, optionalEnv } from '.'

export const ollamaHost = optionalEnv('OLLAMA_HOST', 'http://ollama:11434')

export const ollamaModel = optionalEnv('OLLAMA_MODEL', 'qwen3.5:0.8b')

export const llmTimeoutMs = numberEnv('LLM_TIMEOUT_MS', 120_000)

export const llmMaxInputChars = numberEnv('LLM_MAX_INPUT_CHARS', 1_000)

export const ollamaNumCtx = numberEnv('OLLAMA_NUM_CTX', 4_096)

export const llmEnabled = boolEnv('LLM_ENABLED', true)
