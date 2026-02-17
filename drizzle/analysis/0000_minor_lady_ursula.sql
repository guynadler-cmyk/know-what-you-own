CREATE TABLE "ai_business_analysis" (
	"cache_key" text PRIMARY KEY NOT NULL,
	"company_name" text NOT NULL,
	"ticker" text NOT NULL,
	"cik" text,
	"fiscal_year" text NOT NULL,
	"filing_date" text NOT NULL,
	"result" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_footnotes_analysis" (
	"cache_key" text PRIMARY KEY NOT NULL,
	"company_name" text NOT NULL,
	"ticker" text NOT NULL,
	"cik" text,
	"fiscal_year" text NOT NULL,
	"filing_date" text NOT NULL,
	"result" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_temporal_analysis" (
	"cache_key" text PRIMARY KEY NOT NULL,
	"company_name" text NOT NULL,
	"ticker" text NOT NULL,
	"cik" text,
	"time_horizon" text NOT NULL,
	"years_analyzed" jsonb,
	"result" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_checkup_emails" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"ticker" varchar(10) NOT NULL,
	"selected_checkins" jsonb NOT NULL,
	"custom_message" varchar(500),
	"reminder_dates" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "waitlist_signups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"stage_name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");