import { optionalEnv } from '.'

export const databaseUrl = optionalEnv('DATABASE_URL', 'postgres://juji:juji@postgres:5432/juji')
