CREATE TABLE "admin_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"expires_at" timestamp with time zone NOT NULL,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "contact_inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"service" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"admin_notes" text DEFAULT '' NOT NULL,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "educations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period" text NOT NULL,
	"degree" text NOT NULL,
	"institution" text NOT NULL,
	"location" text NOT NULL,
	"focus" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experiences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period" text NOT NULL,
	"role" text NOT NULL,
	"organization" text NOT NULL,
	"location" text NOT NULL,
	"responsibilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"url" text NOT NULL,
	"kind" text NOT NULL,
	"folder" text NOT NULL,
	"original_filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_assets_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"aspect" text DEFAULT '4:5' NOT NULL,
	"subtitle" text NOT NULL,
	"description" text NOT NULL,
	"tools" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"year" text NOT NULL,
	"color" text DEFAULT '#d7ff3f' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"thumbnail_asset_id" uuid,
	"video_asset_id" uuid,
	"external_video_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "site_profile" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"location" text NOT NULL,
	"location_short" text NOT NULL,
	"timezone" text NOT NULL,
	"availability" text NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"kicker" text NOT NULL,
	"headline" text NOT NULL,
	"subhead" text NOT NULL,
	"bio_long" text NOT NULL,
	"about_headline" text NOT NULL,
	"roles_cycling" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"terminal_statuses" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"disciplines" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"contact_email" text NOT NULL,
	"contact_phone" text NOT NULL,
	"telegram_handle" text NOT NULL,
	"telegram_url" text NOT NULL,
	"facebook_name" text NOT NULL,
	"facebook_url" text NOT NULL,
	"portrait_asset_id" uuid,
	"cv_asset_id" uuid,
	"cv_title" text DEFAULT 'SareyBoth — Resume 2026' NOT NULL,
	"cv_description" text DEFAULT 'Complete career documentation including technical certifications, university course marks, and client project references.' NOT NULL,
	"show_technical_category" boolean DEFAULT false NOT NULL,
	"footer_cta_headline" text DEFAULT 'Ready to elevate your visual identity or IT infrastructure?' NOT NULL,
	"footer_bio" text DEFAULT 'Creative design, high-tempo video editing, and enterprise IT network support based in Phnom Penh, Cambodia.' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"level" text DEFAULT 'Advanced' NOT NULL,
	"tag" text NOT NULL,
	"short_code" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_frames" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot_index" integer NOT NULL,
	"wall" text NOT NULL,
	"aspect_ratio" text NOT NULL,
	"index_label" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"accent_color" text DEFAULT '#d7ff3f' NOT NULL,
	"primary_metric" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"image_asset_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_user_id_admin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_thumbnail_asset_id_media_assets_id_fk" FOREIGN KEY ("thumbnail_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_video_asset_id_media_assets_id_fk" FOREIGN KEY ("video_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_profile" ADD CONSTRAINT "site_profile_portrait_asset_id_media_assets_id_fk" FOREIGN KEY ("portrait_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_profile" ADD CONSTRAINT "site_profile_cv_asset_id_media_assets_id_fk" FOREIGN KEY ("cv_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_frames" ADD CONSTRAINT "studio_frames_image_asset_id_media_assets_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_sessions_user_id_idx" ON "admin_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "admin_sessions_expires_at_idx" ON "admin_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "contact_inquiries_status_idx" ON "contact_inquiries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "contact_inquiries_created_at_idx" ON "contact_inquiries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "educations_sort_idx" ON "educations" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "experiences_sort_idx" ON "experiences" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "media_assets_kind_idx" ON "media_assets" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "media_assets_created_at_idx" ON "media_assets" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "projects_category_sort_idx" ON "projects" USING btree ("category","sort_order");--> statement-breakpoint
CREATE INDEX "projects_published_idx" ON "projects" USING btree ("published");--> statement-breakpoint
CREATE INDEX "skills_sort_idx" ON "skills" USING btree ("sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "studio_frames_slot_index_uidx" ON "studio_frames" USING btree ("slot_index");