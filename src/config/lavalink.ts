import { boolEnv, numberEnv, optionalEnv } from '.'

export const lavalinkHost = optionalEnv('LAVALINK_HOST', 'lavalink')
export const lavalinkPort = numberEnv('LAVALINK_PORT', 2333)
export const lavalinkPassword = optionalEnv('LAVALINK_PASSWORD', 'youshallnotpass')
export const lavalinkSecure = boolEnv('LAVALINK_SECURE', false)
