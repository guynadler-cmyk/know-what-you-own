CREATE TABLE "business_sections" (
	"cik" varchar(10) NOT NULL,
	"accession" varchar(20) NOT NULL,
	"text" varchar NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "footnotes_sections" (
	"cik" varchar(10) NOT NULL,
	"accession" varchar(20) NOT NULL,
	"text" varchar NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raw_10k_texts" (
	"cik" varchar(10) NOT NULL,
	"accession" varchar(20) NOT NULL,
	"text" varchar NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sec_submissions" (
	"cik" varchar(10) PRIMARY KEY NOT NULL,
	"filings" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
CREATE INDEX "business_sections_pk" ON "business_sections" USING btree ("cik","accession");--> statement-breakpoint
CREATE INDEX "footnotes_sections_pk" ON "footnotes_sections" USING btree ("cik","accession");--> statement-breakpoint
CREATE INDEX "raw_10k_pk" ON "raw_10k_texts" USING btree ("cik","accession");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");