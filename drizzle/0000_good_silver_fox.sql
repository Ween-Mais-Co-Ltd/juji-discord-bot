CREATE TABLE "listen_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"play_event_id" uuid NOT NULL,
	"guild_id" text NOT NULL,
	"discord_user_id" text NOT NULL,
	"listened_sec" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "play_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" text NOT NULL,
	"track_id" text NOT NULL,
	"discord_user_id" text,
	"query" text,
	"request_source" text NOT NULL,
	"voice_channel_id" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"end_reason" text,
	"listened_sec" integer
);
--> statement-breakpoint
CREATE TABLE "tracks" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"url" text NOT NULL,
	"thumbnail" text,
	"duration_sec" integer NOT NULL,
	"source_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "listen_events" ADD CONSTRAINT "listen_events_play_event_id_play_events_id_fk" FOREIGN KEY ("play_event_id") REFERENCES "public"."play_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listen_events" ADD CONSTRAINT "listen_events_discord_user_id_users_id_fk" FOREIGN KEY ("discord_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_events" ADD CONSTRAINT "play_events_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_events" ADD CONSTRAINT "play_events_discord_user_id_users_id_fk" FOREIGN KEY ("discord_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "listen_events_user_idx" ON "listen_events" USING btree ("discord_user_id");--> statement-breakpoint
CREATE INDEX "listen_events_play_event_idx" ON "listen_events" USING btree ("play_event_id");--> statement-breakpoint
CREATE INDEX "listen_events_guild_created_idx" ON "listen_events" USING btree ("guild_id","created_at");--> statement-breakpoint
CREATE INDEX "play_events_guild_started_idx" ON "play_events" USING btree ("guild_id","started_at");--> statement-breakpoint
CREATE INDEX "play_events_track_started_idx" ON "play_events" USING btree ("track_id","started_at");--> statement-breakpoint
CREATE INDEX "play_events_user_started_idx" ON "play_events" USING btree ("discord_user_id","started_at");--> statement-breakpoint
CREATE INDEX "play_events_guild_track_idx" ON "play_events" USING btree ("guild_id","track_id");